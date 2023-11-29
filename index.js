
/**
 * Load Cards, prepare image lists etc.
 */
const ResultToken = require("./game-management/ResultToken");
const Logger = require("./Logger");
const CardDataProvider = require("./plugins/CardDataProvider");
const g_pExpress = require('express');
const ServerModule = require("./Server");
const g_pAuthentication = require("./authentication");


(function() {
    require("./plugins/events").setupEvents();

    ServerModule.setup(g_pExpress);

    const g_pEventManager = require("./EventManager");
    g_pEventManager.trigger("add-sample-rooms", ServerModule.Server._sampleRooms);
    g_pEventManager.trigger("add-sample-names", ServerModule.Server._sampleNames);
})();

/**
 * Create server
 */
require("./pwa")();

const SERVER = ServerModule.Server;
SERVER.instance.use(g_pExpress.static("public"));

/**
 * Show list of available images. 
 */
SERVER.instance.use("/data", g_pAuthentication.isSignedInPlay);
SERVER.instance.get("/data/list/images", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => res.send(CardDataProvider.getImageList()).status(200));

/**
 * Show list of available sites
 */
SERVER.instance.get("/data/list/sites", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => res.send(CardDataProvider.getSiteList()).status(200));
SERVER.instance.get("/data/list/gamedata", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => {

    res.status(200).json({
        images: CardDataProvider.getImageList(),
        map: CardDataProvider.getMapdata(),
        underdeeps: CardDataProvider.getUnderdeepMapdata()
    });
});

SERVER.instance.get("/data/list/map", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => res.send(CardDataProvider.getMapdata()).status(200));
SERVER.instance.get("/data/list/underdeeps", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => res.send(CardDataProvider.getUnderdeepMapdata()).status(200));


/** Suggestions for code/name resolving */
SERVER.instance.get("/data/list/name-code-suggestions", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(CardDataProvider.getNameCodeSuggestionMap()).status(200));

require("./releasenotes")()
require("./Personalisation")();

/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
SERVER.instance.use("/data/scores", g_pExpress.static(__dirname + "/data-local/scores.json", SERVER.caching.headerData.generic));

/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
SERVER.instance.get("/data/marshallingpoints", SERVER.caching.expires.jsonCallback, (req, res) => res.send(CardDataProvider.getMarshallingPoints(req.query.code)));

/**
 * Provide the cards
 */
SERVER.instance.get("/data/list/cards", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => res.send(CardDataProvider.getCardsDeckbuilder()).status(200));

SERVER.instance.get("/data/list/filters", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(CardDataProvider.getFilters()).status(200));

SERVER.instance.use("/data/backside", g_pExpress.static(__dirname + "/public/media/assets/images/cards/backside.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/backside-region", g_pExpress.static(__dirname + "/public/media/assets/images/cards/backside-region.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-generic", g_pExpress.static(__dirname + "/public/media/assets/images/cards/notfound-generic.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-region", g_pExpress.static(__dirname + "/public/media/assets/images/cards/notfound-region.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-site", g_pExpress.static(__dirname + "/public/media/assets/images/cards/notfound-site.jpg", SERVER.caching.headerData.jpeg));


/**
 * Get active games
 */
SERVER.instance.get("/data/games", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(SERVER.getRoomManager().getActiveGames()).status(200));
SERVER.instance.get("/data/games/:room", SERVER.caching.expires.jsonCallback, (req, res) => res.send(SERVER.getRoomManager().getActiveGame(req.params.room)).status(200));
SERVER.instance.get("/data/spectators/:room", SERVER.caching.expires.jsonCallback, (req, res) => res.send(SERVER.getRoomManager().getSpectators(req.params.room)).status(200));

/**
 * Load a list of available challenge decks to start right away
 */
require("./plugins/Decklist").initRoutes();

/**
  * Check if the deck is valid.
  */
SERVER.instance.post("/data/decks/check", SERVER.caching.expires.jsonCallback, function (req, res) 
{
    let bChecked = false;
    let vsUnknown = [];

    /* Prevents DoS. */
    const jData = req.body instanceof Array ? req.body : [];

    const nSize = jData.length;
    for (let i = 0; i < nSize; i++)
    {
        const code = jData[i];
        if (code !== "")
        {
            bChecked = true;
            if (!CardDataProvider.isCardAvailable(code) && !CardDataProvider.isCardAvailableGuessed(code))
                vsUnknown.push(code);
        }
    }
    
    res.send({
        valid : bChecked && vsUnknown.length === 0,
        codes : vsUnknown
    }).status(200);
});

SERVER.instance.get("/data/samplerooms", SERVER.caching.cache.jsonCallback, (_req, res) => res.json(SERVER._sampleRooms).status(200));
SERVER.instance.get("/data/samplenames", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(SERVER._sampleNames).status(200));
SERVER.instance.post("/data/hash", (req, res) =>
{
    const data = req.body.value;
    if (typeof data !== "string" || data === "")
    {
        res.status(500).send("");
        return;
    }
    
    const val = ResultToken.createHash(data);
    if (val === "")
        res.status(500).send("");
    else
        res.status(200).json({
            value: val
        });
});

require("./game-logs")();

/** load navigation and non-game endpoints */
require("./plugins/Navigation")(__dirname);

/**
  * Home Page redirects to "/play"
  */
SERVER.instance.get("/", (req, res) => {
    res.header("Cache-Control", "no-store");
    if (g_pAuthentication.isSignedIn(req))
        res.redirect("/play")
    else
        res.redirect("/login")
});

const getRefererPath = function(url)
{
    try
    {
        let pos = url === undefined || url === "" || url === null ? -1 :  url.indexOf("//");
        if (pos === -1)
            throw new Error("Invalid URL");
    
        pos = url.indexOf("/", pos + 3);
        const parts = pos === -1 ? [] : url.substring(pos+1).split("/");
        if (parts.length < 2)
            return "";

        if (parts[0] !== "play" && parts[0] !== "arda")
            return "";

        const room = parts[1].trim();
        const watch = parts.length === 3 ? parts[2].trim() : "";

        if (room === "")
            return "";
        else if (watch === "")
            return "/" + parts[0] + "/" + room;
        else
            return "/" + parts[0] + "/" + room + "/" + watch;
    }
    catch(err)
    {
        Logger.warn(err);
    }

    return "";
};

SERVER.instance.get("/login", (req, res) => g_pAuthentication.showLoginPage(req, res, __dirname + "/pages/authentication-login.html"));
SERVER.instance.post("/login", (req, res) => {

    if (!g_pAuthentication.signIn(req, res))
    {
        res.redirect("/login");
        return;
    }

    const url = getRefererPath(req.headers.referer);
    if (url === "")
        res.redirect("/");
    else
        res.redirect(url);
});

require("./server/RoutingPlay")();
require("./server/RoutingMap")();
require("./server/RoutingHealth")();
require("./server/RoutingGenerals")();
require("./server/RoutingErrorPages")();
require("./server/RoutingTournament")();

/** Map tiles not found - send black tile */
SERVER.instance.use(function(req, res, next) 
{
    if (req.path.startsWith("/media/maps/"))
        res.redirect("/media/map-black-tile");
    else
        next();
});

/** 404 - not found */
SERVER.instance.use(function(_req, res, _next) 
{
    res.status(404).send(SERVER.getPage404());
});
  
/* 500 - Any server error */
SERVER.instance.use(function(err, _req, res, _next) 
{
    if (err)
    {
        Logger.error(err);
        console.error(err);
    }

    res.status(500).send(SERVER.getPage500());
});

process.on('beforeExit', code => 
{
    setTimeout(() => {
        Logger.info(`Process will exit with code: ${code}`)
        process.exit(code)
    }, 100)
})
  
process.on('exit', code => Logger.info(`Process exited with code: ${code}`));
process.on('uncaughtException', err => Logger.error(err));
process.on('unhandledRejection', (err, promise) => Logger.warn('Unhandled rejection at ', promise, `reason: ${err.message}`));
  
/**
 * allow CTRL+C
 */
process.on('SIGTERM', ServerModule.shutdown);
process.on('SIGINT', ServerModule.shutdown);
 
ServerModule.startup();