
/**
 * Load Cards, prepare image lists etc.
 */
const fs = require('fs');

const UTILS = require("./meccg-utils");
const ServerCaching = require("./server/ServerCaching");

let SERVER = {

    environment: null,

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
        }
    },


    cacheResponseJpgHeader : {
        etag: true,
        maxage: 8640000 * 1000,
        "Content-Type": "image/jpeg"
    },

    dices : [],

    gamesStarted : 0,

    roomManager : null,
    cards : null,
    _io : null,
    _sampleRooms : [],
    _navigation : [],
    _sampleNames : []
};

SERVER.getSocketIo = function()
{
    return SERVER._io;
};

const getHtmlCspPage = function(page)
{
    return fs.readFileSync(__dirname + "/pages/" + page, 'utf8');
};

/**
 * Update server environment
 */
(function(sConfigFile){
    const Configiration = require("./Configuration");

    SERVER.environment = new Configiration(sConfigFile);

})(__dirname + "/data/config.json");

 
(function(){

    const g_pEventManager = require("./eventmanager.js");
    const RoomManager = require("./game-management/RoomManager");

    SERVER.cards = require("./plugins/cards.js");
    SERVER.cards.setConfiguration(SERVER.environment.mapPositionsFile(), SERVER.environment.cardUrl(), SERVER.environment.imageUrl());
    SERVER.cards.load();

    require("./plugins/events.js").registerEvents(g_pEventManager);
    
    SERVER.roomManager = new RoomManager(SERVER.getSocketIo, 
        getHtmlCspPage("game.html"),
        g_pEventManager, 
        SERVER.cards,
        SERVER.environment.maxRooms(),
        SERVER.environment.maxPlayersPerRoom());
    
    SERVER.authenticationManagement = require("./game-management/authentication.js");
    SERVER.authenticationManagement.setUserManager(SERVER.roomManager);

    g_pEventManager.trigger("add-sample-rooms", SERVER._sampleRooms);
    g_pEventManager.trigger("main-navigation", SERVER._navigation);
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
            res.header('Content-Security-Policy', SERVER.environment.createContentSecurityPolicyMegaAdditionals());
            res.header('X-Content-Security-Policy', SERVER.environment.createContentSecurityPolicyMegaAdditionals());    
        }
        else
        {
            res.header('Content-Security-Policy', SERVER.environment.createContentSecurityPolicySelfOnly());
            res.header('X-Content-Security-Policy', SERVER.environment.createContentSecurityPolicySelfOnly());
        }

        next();
    });

    SERVER.instance.disable('x-powered-by');
    SERVER._http = require('http').createServer(SERVER.instance);
})();

const PLUGINS = {
    decklist : require("./game-management/Decklist.js").load(SERVER.environment.deckListFolder())
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
 * Set the response to expire and not be cached at all
 * @param {Object} res 
 * @returns res
 * @param {String} sContentType 
 */
SERVER.expireResponse = function(res, sContentType)
{
    res.header("Cache-Control", "no-store");
    res.header("Expires", SERVER.environment.expiresDate());
    if (sContentType !== undefined && sContentType !== "")
        res.header('Content-Type', sContentType);
    return res;
}

/**
 * Add cache header params
 * @param {Object} res 
 * @param {String} sContentType 
 * @returns res
 */
SERVER.cacheResponse = function(res, sContentType)
{
    res.header("Cache-Control", "public, max-age=" + SERVER.environment.imageExpires());
    res.header("Expires", SERVER.environment.cacheDate());
    if (sContentType !== undefined && sContentType !== "")
        res.header('Content-Type', sContentType);

    return res;
}

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
 * Check if all necessary cookies are still valid
 * 
 * @param {Object} res 
 * @param {Object} req 
 * @returns 
 */
SERVER.validateCookies = function (res, req) 
{
    /** no cookies available */
    if (req.cookies.userId === undefined ||
        req.cookies.room === undefined ||
        req.cookies.userId.length !== UTILS.uuidLength() ||
        req.cookies.joined === undefined || req.cookies.joined < SERVER.environment.startupTime()) 
    {
        SERVER.clearCookies(res);
        return false;
    }
    else if (req.cookies.room !== undefined && !SERVER.roomManager.isValidRoomCreationTime(req.cookies.room, req.cookies.joined)) 
    {
        /** cookies do exist, but appear to be from a previous game */
        SERVER.clearCookies(res);
        return false;
    }
    else
        return true;
}

/**
 * Clear Cookies
 * 
 * @param {Object} res 
 */
SERVER.clearCookies = function (res) 
{
    res.clearCookie('userId');
    res.clearCookie('joined');
    res.clearCookie('room');
    return res;
};


/**
 * These are the JS game files. Avoid caching.
 */
SERVER.instance.use("/media/client", g_pExpress.static("game-client"));

/* All media can be used with static routes */
SERVER.instance.use("/media/assets", g_pExpress.static("media/assets", SERVER.caching.headerData.generic));
SERVER.instance.use("/media/maps", g_pExpress.static("media/maps", SERVER.caching.headerData.generic));
  
/**
 * Show list of available images. 
 */
SERVER.instance.get("/data/list/images", (_req, res) => SERVER.cacheResponse(res, 'application/json').send(SERVER.cards.getImageList()).status(200));

/**
 * Show list of available sites
 */
SERVER.instance.get("/data/list/sites", (_req, res) => SERVER.cacheResponse(res, "application/json").send(SERVER.cards.getSiteList()).status(200));

const Personalisation = require("./Personalisation");

SERVER.instance.get("/data/dices", (_req, res) => SERVER.expireResponse(res, "application/json").send(Personalisation.getDices()).status(200));
SERVER.instance.get("/data/backgrounds", (_req, res) => SERVER.expireResponse(res, "application/json").send(Personalisation.getBackgrounds()).status(200));
SERVER.instance.use("/media/personalisation/dice", g_pExpress.static(__dirname + "/media/personalisation/dice"));
SERVER.instance.use("/media/personalisation/backgrounds", g_pExpress.static(__dirname + "/media/personalisation/backgrounds"));
SERVER.instance.use("/media/personalisation/sounds", g_pExpress.static(__dirname + "/media/personalisation/sounds"));
SERVER.instance.get("/media/personalisation/personalisation.css", (_req, res) => {
    res.setHeader('content-type', 'text/css');
    Personalisation.writePersonalisationCss(res);
    res.end();
});
/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
SERVER.instance.use("/data/scores", g_pExpress.static(__dirname + "/data/scores.json", SERVER.caching.headerData.generic));

/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
SERVER.instance.get("/data/marshallingpoints", (req, res) => {
    res.setHeader('content-type', 'application/json');
    res.send(SERVER.cards.getMarshallingPoints(req.query.code));
});

/**
 * Get the navigation
 */
SERVER.instance.get("/data/navigation", (_req, res) => SERVER.cacheResponse(res, "application/json").send(SERVER._navigation).status(200));
     
/**
 * Provide the cards
 */
SERVER.instance.get("/data/list/cards", (_req, res) => SERVER.cacheResponse(res, "application/json").send(SERVER.cards.getCards()).status(200));

SERVER.instance.get("/data/list/filters", (_req, res) => SERVER.expireResponse(res, "application/json").send(SERVER.cards.getFilters()).status(200));

SERVER.instance.use("/data/backside", g_pExpress.static(__dirname + "/media/assets/images/cards/backside.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/backside-region", g_pExpress.static(__dirname + "/media/assets/images/cards/backside-region.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-generic", g_pExpress.static(__dirname + "/media/assets/images/cards/notfound-generic.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-region", g_pExpress.static(__dirname + "/media/assets/images/cards/notfound-region.jpg", SERVER.caching.headerData.jpeg));
SERVER.instance.use("/data/card-not-found-site", g_pExpress.static(__dirname + "/media/assets/images/cards/notfound-site.jpg", SERVER.caching.headerData.jpeg));

/**
 * Get active games
 */
SERVER.instance.get("/data/games", g_pAuthentication.isSignedInPlay, (_req, res) => SERVER.expireResponse(res, "application/json").send(SERVER.roomManager.getActiveGames()).status(200));

/**
 * Get the status of a given player (access denied, waiting, addmitted)
 */
SERVER.instance.get("/data/dump", g_pAuthentication.isSignedInPlay, (_req, res) => SERVER.expireResponse(res, "application/json").send(SERVER.roomManager.dump()).status(200));

/**
 * Load a list of available challenge decks to start right away
 */
SERVER.instance.get("/data/decks", g_pAuthentication.isSignedInPlay, (_req, res) => SERVER.cacheResponse(res,"application/json").send(PLUGINS.decklist).status(200));

/**
  * Check if the deck is valid.
  */
SERVER.instance.post("/data/decks/check", g_pAuthentication.isSignedInPlay, function (req, res) 
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
            if (!SERVER.cards.isCardAvailable(code))
                vsUnknown.push(code);
        }
    }
    
    SERVER.expireResponse(res, "application/json").send({
        valid : bChecked && vsUnknown.length === 0,
        codes : vsUnknown
    }).status(200);
});

SERVER.instance.get("/data/samplerooms", (_req, res) => SERVER.expireResponse(res, "application/json").send(SERVER._sampleRooms).status(200));


if (SERVER.environment.hasLocalImages())
{
    console.log("Card images are accessed locally from " + SERVER.environment.imageFolder());
    SERVER.instance.use("/data/images", g_pExpress.static(SERVER.environment.imageFolder(), SERVER.caching.headerData.generic));
}


SERVER.instance.get("/about", (_req, res) => SERVER.cacheResponse(res, "text/html").sendFile(__dirname + "/pages/about.html"));
SERVER.instance.get("/deckbuilder", g_pAuthentication.isSignedInDeckbuilder, (_req, res) => SERVER.cacheResponse(res, "text/html").sendFile(__dirname + "/pages/deckbuilder.html"));
SERVER.instance.get("/converter", (_req, res) => SERVER.cacheResponse(res, "text/html").sendFile(__dirname + "/pages/converter.html"));
SERVER.instance.get("/cards", g_pAuthentication.isSignedInCards, (_req, res) => SERVER.cacheResponse(res, "text/html").sendFile(__dirname + "/pages/card-browser.html"));
SERVER.instance.use("/help", g_pExpress.static(__dirname + "/pages/help.html", SERVER.caching.headerData.generic));
 
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

SERVER.instance.post("/csp-violation", (_req, res) => {
    /** this is not needed here */
    res.status(204).end();
});

require("./server/RoutingPlay")(SERVER, SERVER.environment.isProduction(), g_pAuthentication);
require("./server/RoutingMap").setup(SERVER, SERVER.environment.isProduction(), g_pExpress);
require("./server/RoutingRules").setup(SERVER, g_pExpress);
require("./server/RoutingHealth").setup(SERVER);
require("./server/RoutingGenerals")(SERVER, g_pExpress);
require("./server/RoutingErrorPages")(SERVER);

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

SERVER.instanceListener = SERVER._http.listen(SERVER.environment.port(), SERVER.onListenSetupSocketIo);
SERVER.instanceListener.on('clientError', (err, socket) => 
{
    console.error(err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

console.log("Server started at port " + SERVER.environment.port());

/**
 * allow CTRL+C
 */
process.on('SIGTERM', SERVER.shutdown);
process.on('SIGINT', SERVER.shutdown);
 