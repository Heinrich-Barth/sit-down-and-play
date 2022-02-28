
/**
 * Load Cards, prepare image lists etc.
 */
const fs = require('fs');

const UTILS = require("./meccg-utils");

let SERVER = {

    environment: null,

    cacheResponseHeader : {
        etag: true,
        maxage: 8640000 * 1000
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
    const RoomManager = require("./game-server/RoomManager");

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
    
    SERVER.authenticationManagement = require("./game-server/authentication.js");
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
    decklist : require("./plugins/decklist.js").load(require("./game-server/decklist.js"), __dirname)
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
                console.log("auth is ok");
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
SERVER.instance.use("/media/assets", g_pExpress.static("media/assets", SERVER.cacheResponseHeader));

  
/**
 * This is a blank (black) page. Necessary for in-game default page
 */
SERVER.instance.use("/blank", g_pExpress.static(__dirname + "/pages/blank.html", SERVER.cacheResponseHeader));

if (!SERVER.environment.isProduction())
{
    SERVER.instance.use("/api", g_pExpress.static(__dirname + "/api/http"));
    SERVER.instance.use("/api/swagger.css", g_pExpress.static(__dirname + "/api/swagger.css"));
    SERVER.instance.use("/api/swagger.js", g_pExpress.static(__dirname + "/api/swagger.js"));
    SERVER.instance.use("/api/client", g_pExpress.static(__dirname + "/api/game-client"));
    SERVER.instance.use("/api/server", g_pExpress.static(__dirname + "/api/game-client"));    
}


/**
 * Simple PING
 */
SERVER.instance.get("/ping", (req, res) => SERVER.expireResponse(res, "text/plain").send("" + Date.now()).status(200));

/**
 * Show list of available images. 
 */
SERVER.instance.get("/data/list/images", (req, res) => SERVER.cacheResponse(res, 'application/json').send(SERVER.cards.getImageList()).status(200));

/**
 * Show list of available sites
 */
SERVER.instance.get("/data/list/sites", (req, res) => SERVER.cacheResponse(res, "application/json").send(SERVER.cards.getSiteList()).status(200));

const Personalisation = require("./Personalisation");

SERVER.instance.get("/data/dices", (req, res) => SERVER.expireResponse(res, "application/json").send(Personalisation.getDices()).status(200));
SERVER.instance.get("/data/backgrounds", (req, res) => SERVER.expireResponse(res, "application/json").send(Personalisation.getBackgrounds()).status(200));
SERVER.instance.use("/media/personalisation/dice", g_pExpress.static(__dirname + "/media/personalisation/dice"));
SERVER.instance.use("/media/personalisation/backgrounds", g_pExpress.static(__dirname + "/media/personalisation/backgrounds"));
SERVER.instance.get("/media/personalisation/personalisation.css", (req, res) => {
    res.setHeader('content-type', 'text/css');
    Personalisation.writePersonalisationCss(res);
    res.end();
});
/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
SERVER.instance.use("/data/scores", g_pExpress.static(__dirname + "/data/scores.json", SERVER.cacheResponseHeader));

/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
SERVER.instance.get("/data/marshallingpoints", (req, res) => {
    res.setHeader('content-type', 'application/json');
    res.send(SERVER.cards.getMarshallingPoints(req.query.code));
});

/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
 SERVER.instance.use("/robots.txt", g_pExpress.static(__dirname + "/robots.txt"));
 
 /**
 * Get the navigation
 */
SERVER.instance.get("/data/navigation", (req, res) => SERVER.cacheResponse(res, "application/json").send(SERVER._navigation).status(200));
     
/**
 * Provide the cards
 */
SERVER.instance.get("/data/list/cards", (req, res) => SERVER.cacheResponse(res, "application/json").send(SERVER.cards.getCards()).status(200));

SERVER.instance.get("/data/list/filters", (req, res) => SERVER.expireResponse(res, "application/json").send(SERVER.cards.getFilters()).status(200));


/**
 * Get active games
 */
SERVER.instance.get("/data/games", (req, res) => SERVER.expireResponse(res, "application/json").send(SERVER.roomManager.getActiveGames()).status(200));

/**
 * Get the status of a given player (access denied, waiting, addmitted)
 */
SERVER.instance.get("/data/dump", (req, res) => SERVER.expireResponse(res, "application/json").send(SERVER.roomManager.dump()).status(200));

/**
 * Load a list of available challenge decks to start right away
 */
SERVER.instance.get("/data/decks", (req, res) => SERVER.cacheResponse(res,"application/json").send(PLUGINS.decklist).status(200));

/**
  * Check if the deck is valid.
  */
SERVER.instance.post("/data/decks/check", function (req, res) 
{
    let bChecked = false;
    let vsUnknown = [];

    const jData = req.body;

    /* Prevents DoS. */
    if (!(jData instanceof Array)) 
    { 
        SERVER.expireResponse(res, "application/json").send({valid : false, codes : [] }).status(200);
        return;
    }

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

SERVER.instance.get("/data/samplerooms", (req, res) => SERVER.expireResponse(res, "application/json").send(SERVER._sampleRooms).status(200));
SERVER.instance.get("/data/samplenames", (req, res) => SERVER.expireResponse(res, "application/json").send(SERVER._sampleNames).status(200));

SERVER.instance.use("/help", g_pExpress.static(__dirname + "/pages/help.html", SERVER.cacheResponseHeader));

if (SERVER.environment.hasLocalImages())
{
    console.log("Card images are accessed locally from " + SERVER.environment.imageFolder());
    SERVER.instance.use("/data/images", g_pExpress.static(SERVER.environment.imageFolder(), SERVER.cacheResponseHeader));
}

/**
 * Error endpoint.
 * This also deletes all available cookies
 */
SERVER.instance.get("/error", (req, res) => SERVER.clearCookies(res).sendFile(__dirname + "/pages/error.html"));
SERVER.instance.get("/error/https-required", (req, res) => SERVER.clearCookies(res).sendFile(__dirname + "/pages/error-https-required.html"));
SERVER.instance.get("/error/denied", (req, res) => SERVER.clearCookies(res).sendFile(__dirname + "/pages/error-access-denied.html"));
SERVER.instance.get("/error/login", (req, res) => SERVER.clearCookies(res).sendFile(__dirname + "/pages/error-login.html"));
  
/**
 * Start the deckbuilder
 */
SERVER.instance.get("/deckbuilder", g_pAuthentication.isSignedInDeckbuilder, (req, res) => SERVER.cacheResponse(res, "text/html").sendFile(__dirname + "/pages/deckbuilder.html"));

SERVER.instance.get("/converter", (req, res) => SERVER.cacheResponse(res, "text/html").sendFile(__dirname + "/pages/converter.html"));

SERVER.instance.get("/cards", g_pAuthentication.isSignedInCards, (req, res) => SERVER.cacheResponse(res, "text/html").sendFile(__dirname + "/pages/card-browser.html"));
 
/**
  * Home Page redirects to "/play"
  */
SERVER.instance.get("/", (req, res) => res.redirect("/play"));

SERVER.instance.get("/login", (req, res) => g_pAuthentication.showLoginPage(req, res, __dirname + "/pages/authentication-login.html"));
SERVER.instance.post("/login", (req, res) => {

    if (g_pAuthentication.signIn(req, res))
        res.redirect("/");
    else 
        res.redirect("/login");
});

SERVER.instance.post("/csp-violation", (req, res) => {
    /** this is not needed here */
    res.status(204).end();
});

/**
  * About Page
  */
SERVER.instance.get("/about", (req, res) => SERVER.cacheResponse(res, "text/html").sendFile(__dirname + "/pages/about.html"));

require("./game-play")(SERVER, SERVER.environment.isProduction(), g_pAuthentication);

require("./game-map").setup(SERVER, SERVER.environment.isProduction(), g_pExpress);

require("./game-rules").setup(SERVER, g_pExpress);


/**
 * Health Endpoint
 */
require("./health").setup(SERVER);


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
SERVER.instance.use(function(req, res, next) 
{
    res.status(404);
    res.format({
      html: () => res.sendFile(__dirname + "/pages/error-404.html"),
      json: () => res.json({ error: 'Not found' }),
      default: () => res.type('txt').send('Not found')
    });
});
  
/* 500 - Any server error */
SERVER.instance.use(function(err, req, res, next) 
{
    res.status(500);
    res.format({
      html: () => res.sendFile(__dirname + "/pages/error-500.html"),
      json: () => res.json({ error: "Something went wrong" }),
      default: () => res.type('txt').send("Something went wrong")
    });
});

/**
 * allow CTRL+C
 */
process.on('SIGTERM', SERVER.shutdown);
process.on('SIGINT', SERVER.shutdown);

console.log("Server started at port " + SERVER.environment.port());
SERVER.instanceListener = SERVER._http.listen(SERVER.environment.port(), SERVER.onListenSetupSocketIo);

SERVER.instanceListener.on('clientError', (err, socket) => 
{
    console.error(err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

