
/**
 * Load Cards, prepare image lists etc.
 */
const fs = require('fs');
const Configiration = require("./Configuration");

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

            cacheDate : new Date(Date.now() + (8640000 * 1000)).toUTCString(),

            jsonCallback : function(_req, res, next)
            {
                res.header("Cache-Control", "public, max-age=8640000");
                res.header("Expires", SERVER.caching.cache.cacheDate);
                res.header('Content-Type', "application/json");
                
                next();
            },

            htmlCallback : function(_req, res, next)
            {
                res.header("Cache-Control", "public, max-age=8640000");
                res.header("Expires", SERVER.caching.cache.cacheDate);
                res.header('Content-Type', "text/html");
                
                next();
            },
        },

        expires : {

            dateStringNow : new Date().toUTCString(),

            jsonCallback : function(_req, res, next)
            {
                SERVER.caching.expires.withResultType(res, "application/json");
                next();
            },

            generic : function(_req, res, next)
            {
                res.header("Cache-Control", "no-store");
                res.header("Expires", SERVER.caching.expires.dateStringNow);

                next();
            },

            withResultType(res, sType)
            {
                res.header("Cache-Control", "no-store");
                res.header("Expires", SERVER.caching.expires.dateStringNow);
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
    }
};

const CardDataProvider = require("./plugins/CardDataProvider");
SERVER.cards = new CardDataProvider(SERVER.configuration.mapPositionsFile(), SERVER.configuration.cardUrl(), SERVER.configuration.imageUrl());
SERVER.cards.load();

(function(){

    const g_pEventManager = require("./EventManager");
    const RoomManager = require("./game-management/RoomManager");

    require("./plugins/events").registerEvents(g_pEventManager);
    
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
        const token = socket.handshake.auth.authorization;
        const room = socket.handshake.auth.room;
        const userid = socket.handshake.auth.userId;

        try
        {
            if (SERVER.roomManager.verifyApiKey(room, token))
            {
                socket.auth = true;
                socket.room = room;
                socket.userid = userid;
                next();
            }
            else
                socket.disconnect("invalid authentication");
        }
        catch(err)
        {
            console.log(err);
        }
    });
};

/**
 * Shutdown game module and the http server
 */
SERVER.shutdown = function () 
{
    console.log("\nShutting down game server.");

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

    SERVER._io = null;
    SERVER.instanceListener = null;

    console.log("- stop application.");
    process.exit(0);
}

/**
 * These are the JS game files. Avoid caching.
 */
SERVER.instance.use("/media/client", g_pExpress.static("game-client"));

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
SERVER.instance.get("/data/list/images", SERVER.caching.cache.jsonCallback, (_req, res) => res.send(SERVER.cards.getImageList()).status(200));

/**
 * Show list of available sites
 */
SERVER.instance.get("/data/list/sites", SERVER.caching.cache.jsonCallback, (_req, res) => res.send(SERVER.cards.getSiteList()).status(200));


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
SERVER.instance.get("/data/list/cards", SERVER.caching.cache.jsonCallback, (_req, res) => res.send(SERVER.cards.getCards()).status(200));

SERVER.instance.get("/data/list/filters", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(SERVER.cards.getFilters()).status(200));

SERVER.instance.use("/data/backside", g_pExpress.static(__dirname + "/media/assets/images/cards/backside.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/backside-region", g_pExpress.static(__dirname + "/media/assets/images/cards/backside-region.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-generic", g_pExpress.static(__dirname + "/media/assets/images/cards/notfound-generic.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-region", g_pExpress.static(__dirname + "/media/assets/images/cards/notfound-region.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-site", g_pExpress.static(__dirname + "/media/assets/images/cards/notfound-site.jpg", SERVER.caching.headerData.jpeg));

/**
 * Get active games
 */
SERVER.instance.get("/data/games", g_pAuthentication.isSignedInPlay, SERVER.caching.expires.jsonCallback, (_req, res) => res.send(SERVER.roomManager.getActiveGames()).status(200));

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

SERVER.instance.get("/login", (req, res) => g_pAuthentication.showLoginPage(req, res, __dirname + "/pages/authentication-login.html"));
SERVER.instance.post("/login", (req, res) => {

    if (g_pAuthentication.signIn(req, res))
        res.redirect("/");
    else 
        res.redirect("/login");
});

require("./server/RoutingPlay")(SERVER, SERVER.configuration.isProduction(), g_pAuthentication);
require("./server/RoutingMap").setup(SERVER, SERVER.configuration.isProduction(), g_pExpress);
require("./server/RoutingRules").setup(SERVER, g_pExpress);
require("./server/RoutingHealth").setup(SERVER);
require("./server/RoutingGenerals")(SERVER, g_pExpress);
require("./server/RoutingErrorPages")(SERVER, g_pExpress);

SERVER.onIoConnection = function (socket) 
{
    socket.username = "";

    SERVER.authenticationManagement.triggerAuthenticationProcess(socket);

    /**
     * The disconnect event may have 2 consequnces
     * 1. interrupted and connection will be reestablished after some time
     * 2. user has left entirely
     */
    socket.on("disconnect", () => 
    {
        if (!socket.auth) 
        {
            console.log("Disconnected unauthenticated session " + socket.id);
        }
        else 
        {
            console.log(socket.username + " (" + socket.id + ") disconnected from game " + socket.room);

            SERVER.roomManager.onDisconnected(socket.userid, socket.room);
            SERVER.roomManager.checkGameContinuence(socket.room);
        }
    });

    /** Player has reconnected. Send an update all */
    socket.on('reconnect', () => SERVER.roomManager.onReconnected(socket.userid, socket.room));
};

/** 404 - not found */
SERVER.instance.use(function(_req, res, _next) 
{
    res.status(404);
    res.format({
      html: () => res.sendFile(__dirname + "/pages/error-404.html"),
      json: () => res.json({ error: 'Not found' }),
      default: () => res.type('txt').send('Not found')
    });
});
  
/* 500 - Any server error */
SERVER.instance.use(function(err, _req, res, _next) 
{
    if (err)
        console.error(err);
        
    res.status(500);
    res.format({
      html: () => res.sendFile(__dirname + "/pages/error-500.html"),
      json: () => res.json({ error: "Something went wrong" }),
      default: () => res.type('txt').send("Something went wrong")
    });
});

SERVER.instanceListener = SERVER._http.listen(SERVER.configuration.port(), SERVER.onListenSetupSocketIo);
SERVER.instanceListener.on('clientError', (err, socket) => 
{
    console.error(err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

console.log("Server started at port " + SERVER.configuration.port());

/**
 * allow CTRL+C
 */
process.on('SIGTERM', SERVER.shutdown);
process.on('SIGINT', SERVER.shutdown);
 