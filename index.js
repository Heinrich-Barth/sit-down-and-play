
/**
 * Load Cards, prepare image lists etc.
 */
const fs = require('fs');
const Configiration = require("./Configuration");
const ResultToken = require("./game-management/ResultToken");

if (!fs.existsSync("./logs"))
    fs.mkdirSync("./logs");

let SERVER = {

    configuration: new Configiration(__dirname + "/data/config.json"),

    caching : {

        headerData : {

            generic : {
                etag: true,
                maxage: 8640000 * 1000
            },

            jpeg : {
                etag: true,
                maxage: 8640000 * 1000,
                "Content-Type": "image/jpeg"
            }
        },

        cache : {

            jsonCallback : function(_req, res, next)
            {
                res.header("Cache-Control", "public, max-age=21600");
                res.header('Content-Type', "application/json");
                next();
            },

            jsonCallback6hrs : function(_req, res, next)
            {
                res.header("Cache-Control", "public, max-age=21600");
                res.header('Content-Type', "application/json");
                next();
            },

            htmlCallback : function(_req, res, next)
            {
                res.header("Cache-Control", "public, max-age=0");
                res.header('Content-Type', "text/html");
                next();
            },
        },

        expires : {

            jsonCallback : function(_req, res, next)
            {
                SERVER.caching.expires.withResultType(res, "application/json");
                next();
            },

            generic : function(_req, res, next)
            {
                res.header("Cache-Control", "no-store");
                next();
            },

            withResultType(res, sType)
            {
                res.header("Cache-Control", "no-store");
                res.header('Content-Type', sType);
            }
        }
    },

    dices : [],

    gamesStarted : 0,

    roomManager : null,
    cards : null,
    _io : null,
    _sampleRooms : [],
    _sampleNames : [],

    startupTime : Date.now(),

    getSocketIo : function()
    {
        return SERVER._io;
    }, 

    endpointVisits : {

        deckbuilder: 0,
        cards: 0,
        converter: 0,

        increase : function(req, _res, next)
        {
            switch(decodeURIComponent(req.baseUrl))
            {
                case "/deckbuilder":
                    SERVER.endpointVisits.deckbuilder++;
                    break;
                case "/cards":
                    SERVER.endpointVisits.cards++;
                    break;
                case "/converter":
                    SERVER.endpointVisits.converter++;
                    break;
                default:
                    break;
            }

            next();
        }
    }
};

const CardDataProvider = require("./plugins/CardDataProvider");
SERVER.cards = new CardDataProvider(SERVER.configuration.mapPositionsFile(), SERVER.configuration.cardUrl(), SERVER.configuration.imageUrl());
SERVER.cards.load();

(function(){

    const g_pEventManager = require("./EventManager");
    const RoomManager = require("./game-management/RoomManager");

    require("./plugins/events").registerEvents(g_pEventManager);
    
    SERVER.eventManager = g_pEventManager;
    SERVER.roomManager = new RoomManager(SERVER.getSocketIo, 
        fs.readFileSync(__dirname + "/pages/game.html", 'utf8'),
        g_pEventManager, 
        SERVER.cards,
        SERVER.configuration.maxRooms(),
        SERVER.configuration.maxPlayersPerRoom());
    
    SERVER.authenticationManagement = require("./game-management/authentication");
    SERVER.authenticationManagement.setUserManager(SERVER.roomManager);

    g_pEventManager.trigger("add-sample-rooms", SERVER._sampleRooms);
    g_pEventManager.trigger("add-sample-names", SERVER._sampleNames);

})();


/**
 * Create server
 */
const g_pAuthentication = require("./authentication");
const g_pExpress = require('express');

const cspAllowRemoteImages = function(sPath)
{
    return sPath.startsWith("/play") || 
           sPath.startsWith("/arda") || 
           sPath.startsWith("/singleplayer") || 
           sPath.startsWith("/deckbuilder") || 
           sPath.startsWith("/cards") || 
           sPath.startsWith("/pwa") || 
           sPath.startsWith("/map/"); 
}

SERVER.instance = g_pExpress();

(function()
{
    SERVER.instance.use(require('cookie-parser')());
    SERVER.instance.use(g_pExpress.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
    SERVER.instance.use(g_pExpress.json()); // for parsing application/json

    SERVER.instance.use(function (req, res, next) 
    {
        res.header('X-Robots-Tag','noindex, nofollow');
        res.header("X-Frame-Options",'sameorigin');

        if (cspAllowRemoteImages(req.path))
        {
            res.header('Content-Security-Policy', SERVER.configuration.createContentSecurityPolicyMegaAdditionals());
            res.header('X-Content-Security-Policy', SERVER.configuration.createContentSecurityPolicyMegaAdditionals());    
        }
        else
        {
            res.header('Content-Security-Policy', SERVER.configuration.createContentSecurityPolicySelfOnly());
            res.header('X-Content-Security-Policy', SERVER.configuration.createContentSecurityPolicySelfOnly());
        }

        next();
    });

    SERVER.instance.disable('x-powered-by');
    SERVER._http = require('http').createServer(SERVER.instance);
})();

const PLUGINS = {
    decklist : require("./game-management/Decklist.js").load(SERVER.configuration.deckListFolder())
};

/**
 * Once the server is up and running,
 * init the game module. This will make socket.io available
 * only if the server is up.
 */
SERVER.onListenSetupSocketIo = function () 
{
    SERVER._io = require('socket.io')(SERVER._http);
    SERVER._io.on('connection', SERVER.onIoConnection.bind(SERVER));

    SERVER._io.engine.on("connection_error", (err) => console.error("There is a connection error ("+ err.code + "): " + err.message));

    SERVER._io.use((socket, next) => 
    {
        const data = socket.handshake.auth;

        const token = data.authorization;
        const room = data.room;

        try
        {
            if (SERVER.roomManager.allowJoin(room, token, data.userId, data.joined, data.player_access_token_once))
            {
                socket.auth = true;
                socket.room = room;
                socket.userid = data.userId;
                socket.username = data.dispayName;
                socket.joined = data.joined;
                next();
                return;
            }
            else
                socket.disconnect("invalid authentication");
        }
        catch(err)
        {
            console.log(err);
        }

        next(null, false);
    });
};

SERVER.doShutdown = function()
{
    try{

        try 
        {
            console.log("- shutdown IO http server.");
            SERVER._io.httpServer.close();
        }
        catch (e) 
        {
            console.error(e);
        }

        try 
        {
            console.log("- shutdown IO.");
            SERVER._io.close();
        }
        catch (e) 
        {
            console.error(e);
        }

        try 
        {
            console.log("- shutdown server.");
            SERVER.instanceListener.close();
        }
        catch (e) 
        {
            console.error(e);
        }
    }
    finally
    {
        SERVER._io = null;
        SERVER.instanceListener = null;
    
        console.log("- stop application.");
        process.exit(0);
    }
};

/**
 * Shutdown game module and the http server
 */
SERVER.shutdown = function () 
{
    console.log("\nShutting down game server.");

    /** send save game instruction to running games */
    if (SERVER.roomManager.sendShutdownSaving())
    {
        function sleep (time) {
            return new Promise((resolve) => setTimeout(resolve, time));
        }
            
        sleep(2000).then(SERVER.doShutdown).catch(console.error);
    }
    else
        SERVER.doShutdown();
}

/**
 * These are the JS game files. Avoid caching.
 */
SERVER.instance.use("/media/client", g_pExpress.static("game-client"));

require("./game-logs")(SERVER.instance, g_pExpress);

/* All media can be used with static routes */
SERVER.instance.use("/media/assets", g_pExpress.static("media/assets", SERVER.caching.headerData.generic));
SERVER.instance.use("/media/maps", g_pExpress.static("media/maps", SERVER.caching.headerData.generic));

if (SERVER.configuration.useLocalImages())
{
    console.log("Use local image path");
    SERVER.instance.use("/data/images", g_pExpress.static("data-local/images", SERVER.caching.headerData.generic));
}
/**
 * Show list of available images. 
 */
SERVER.instance.get("/data/list/images", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => res.send(SERVER.cards.getImageList()).status(200));

/**
 * Show list of available sites
 */
SERVER.instance.get("/data/list/sites", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => res.send(SERVER.cards.getSiteList()).status(200));

SERVER.instance.get("/data/list/gamedata", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => {

    res.status(200).json({
        images: SERVER.cards.getImageList(),
        map: SERVER.cards.getMapdata(),
        underdeeps: SERVER.cards.getUnderdeepMapdata()
    });
});

SERVER.instance.get("/data/list/map", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => res.send(SERVER.cards.getMapdata()).status(200));
SERVER.instance.get("/data/list/underdeeps", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => res.send(SERVER.cards.getUnderdeepMapdata()).status(200));


/** Suggestions for code/name resolving */
SERVER.instance.get("/data/list/name-code-suggestions", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(SERVER.cards.getNameCodeSuggestionMap()).status(200));

require("./releasenotes")(SERVER)
require("./Personalisation")(SERVER, g_pExpress);

/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
SERVER.instance.use("/data/scores", g_pExpress.static(__dirname + "/data/scores.json", SERVER.caching.headerData.generic));

/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
SERVER.instance.get("/data/marshallingpoints", SERVER.caching.expires.jsonCallback, (req, res) => res.send(SERVER.cards.getMarshallingPoints(req.query.code)));

/**
 * Provide the cards
 */
SERVER.instance.get("/data/list/cards", SERVER.caching.cache.jsonCallback6hrs, (_req, res) => res.send(SERVER.cards.getCardsDeckbuilder()).status(200));

SERVER.instance.get("/data/list/filters", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(SERVER.cards.getFilters()).status(200));

SERVER.instance.use("/data/backside", g_pExpress.static(__dirname + "/media/assets/images/cards/backside.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/backside-region", g_pExpress.static(__dirname + "/media/assets/images/cards/backside-region.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-generic", g_pExpress.static(__dirname + "/media/assets/images/cards/notfound-generic.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-region", g_pExpress.static(__dirname + "/media/assets/images/cards/notfound-region.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-site", g_pExpress.static(__dirname + "/media/assets/images/cards/notfound-site.jpg", SERVER.caching.headerData.jpeg));

require("./pwa")(SERVER, g_pExpress, g_pAuthentication);

SERVER.instance.use("/serviceWorker.js", g_pExpress.static(__dirname + "/serviceWorker.js"));

/**
 * Get active games
 */
SERVER.instance.get("/data/games", g_pAuthentication.isSignedInPlay, SERVER.caching.expires.jsonCallback, (_req, res) => res.send(SERVER.roomManager.getActiveGames()).status(200));
SERVER.instance.get("/data/games/:room", g_pAuthentication.isSignedInPlay, SERVER.caching.expires.jsonCallback, (req, res) => res.send(SERVER.roomManager.getActiveGame(req.params.room)).status(200));
SERVER.instance.get("/data/spectators/:room", g_pAuthentication.isSignedInPlay, SERVER.caching.expires.jsonCallback, (req, res) => res.send(SERVER.roomManager.getSpectators(req.params.room)).status(200));

/**
 * Get the status of a given player (access denied, waiting, addmitted)
 */
SERVER.instance.get("/data/dump", g_pAuthentication.isSignedInPlay, SERVER.caching.expires.jsonCallback, (_req, res) => res.send(SERVER.roomManager.dump()).status(200));

/**
 * Load a list of available challenge decks to start right away
 */
SERVER.instance.get("/data/decks", g_pAuthentication.isSignedInPlay, SERVER.caching.expires.jsonCallback, (_req, res) => res.send(PLUGINS.decklist).status(200));

/**
  * Check if the deck is valid.
  */
SERVER.instance.post("/data/decks/check", g_pAuthentication.isSignedInPlay, SERVER.caching.expires.jsonCallback, function (req, res) 
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
            if (!SERVER.cards.isCardAvailable(code) && !SERVER.cards.isCardAvailableGuessed(code))
                vsUnknown.push(code);
        }
    }
    
    res.send({
        valid : bChecked && vsUnknown.length === 0,
        codes : vsUnknown
    }).status(200);
});

SERVER.instance.get("/data/samplerooms", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(SERVER._sampleRooms).status(200));
SERVER.instance.post("/data/hash", g_pAuthentication.isSignedInPlay, (req, res) =>
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


if (SERVER.configuration.hasLocalImages())
{
    console.log("Card images are accessed locally from " + SERVER.configuration.imageFolder());
    SERVER.instance.use("/data/images", g_pExpress.static(SERVER.configuration.imageFolder(), SERVER.caching.headerData.generic));
}

/** load navigation and non-game endpoints */
require("./plugins/Navigation")(SERVER, g_pExpress, g_pAuthentication, __dirname);

/**
  * Home Page redirects to "/play"
  */
SERVER.instance.get("/", (_req, res) => {
    res.header("Cache-Control", "no-store");
    res.redirect("/play")
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
        console.warn(err);
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

require("./server/RoutingPlay")(SERVER, SERVER.configuration.isProduction(), g_pAuthentication);
require("./server/RoutingMap").setup(SERVER, SERVER.configuration.isProduction(), g_pExpress);
require("./server/RoutingRules").setup(SERVER, g_pExpress);
require("./server/RoutingHealth").setup(SERVER, g_pAuthentication);
require("./server/RoutingGenerals")(SERVER, g_pExpress);
require("./server/RoutingErrorPages")(SERVER, g_pExpress);
require("./server/RoutingTournament")(SERVER, g_pExpress);

SERVER.onIoConnection = function (socket) 
{
    socket.username = "";

    SERVER.authenticationManagement.triggerAuthenticationProcess(socket);

    /**
     * The disconnect event may have 2 consequnces
     * 1. interrupted and connection will be reestablished after some time
     * 2. user has left entirely
     */
    socket.on("disconnect", (reason) => 
    {
        if (!socket.auth) 
        {
            console.log("Disconnected unauthenticated session " + socket.id);
        }
        else 
        {
            SERVER.roomManager.onDisconnected(socket.userid, socket.room);
            SERVER.roomManager.checkGameContinuence(socket.room);
        }
    });

    /** Player has reconnected. Send an update all */
    socket.on('reconnect', () => SERVER.roomManager.onReconnected(socket.userid, socket.room));
};

/** Map tiles not found - send black tile */
SERVER.instance.use(function(req, res, next) 
{
    if (req.path.startsWith("/media/maps/"))
        res.redirect("/media/map-black-tile");
    else
        next();
});

let g_sPage404 = "";
let g_sPage500 = "";

/** 404 - not found */
SERVER.instance.use(function(_req, res, _next) 
{
    res.status(404);

    if (g_sPage404 !== "")
    {
        res.send(g_sPage404);
        return;
    }

    fs.readFile(__dirname + "/pages/error-404.html", 'utf-8', (err, data) => 
    {
        if (err) 
            g_sPage404 = ""
        else
            g_sPage404 = data;

        res.send(g_sPage404);
    });    
});
  
/* 500 - Any server error */
SERVER.instance.use(function(err, _req, res, _next) 
{
    if (err)
        console.error(err);

    res.status(500);

    if (g_sPage500 !== "")
    {
        res.send(g_sPage500);
        return;
    }

    fs.readFile(__dirname + "/pages/error-500.html", 'utf-8', (err, data) => 
    {
        if (err) 
            g_sPage500 = "";
        else
            g_sPage500 = data;

        res.send(g_sPage500);
    });    
});

SERVER.instanceListener = SERVER._http.listen(SERVER.configuration.port(), SERVER.onListenSetupSocketIo);
{
    const seconds = SERVER.configuration.getRequestTimeout();
    SERVER.instanceListener.setTimeout(1000 * seconds);
}

SERVER.instanceListener.on('clientError', (err, socket) => 
{
    console.error(err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

console.log("Server started at port " + SERVER.configuration.port());

process.on('beforeExit', code => {
    setTimeout(() => {
        console.log(`Process will exit with code: ${code}`)
        process.exit(code)
    }, 100)
})
  
process.on('exit', code => console.log(`Process exited with code: ${code}`));
process.on('uncaughtException', err => console.error(err));
process.on('unhandledRejection', (err, promise) => console.warn('Unhandled rejection at ', promise, `reason: ${err.message}`));
  
/**
 * allow CTRL+C
 */
process.on('SIGTERM', SERVER.shutdown);
process.on('SIGINT', SERVER.shutdown);
 