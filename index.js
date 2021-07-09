
/**
 * Load Cards, prepare image lists etc.
 */
const fs = require('fs');

/**
 * Load the configuration.
 * 
 * Your custom config file will be preferred (if available!).
 */
const g_pConfig = require("./configuration.js").load(__dirname + "/data/config.json", process.env.NODE_ENV);
const g_pEventManager = require("./eventmanager.js");

let HTTP_SERVER = {

    environment: {

        uuid_tpl: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
        startupTime: Date.now(),
        port: process.env.PORT || 8080,

        imageCDN: g_pConfig.imageUrl() || "",
        imageExpires: g_pConfig.imageExpires() || 0,

        isProduction : g_pConfig.isProduction(),

        maxRooms : g_pConfig.maxRooms() || 10,
        maxPlayersPerRoom : g_pConfig.maxPlayersPerRoom() || 10,

        csp_image_domain : g_pConfig.imageDomain() || "",
        csp_report_uri : g_pConfig.cspReportUri() || "",

        expiresDate : new Date(Date.now()).toUTCString(),
        expiresTime : Date.now(),
        cacheDate : 0
    },

    _userManagement : null,
    _roomManager : null,
    _cards : null,
    _io : null
};

HTTP_SERVER.environment.cacheDate = new Date(Date.now() + (HTTP_SERVER.environment.imageExpires * 1000)).toUTCString();
HTTP_SERVER._cards = require("./plugins/cards.js");
HTTP_SERVER._cards.load(g_pConfig.cardUrl());

require("./plugins/events.js").registerEvents(g_pEventManager);

HTTP_SERVER._roomManager = require("./game-server/room-manager.js").create(
{
    createSecret : () => HTTP_SERVER.createSecret(),
    getSocketId : () => { return HTTP_SERVER._io; }
}, 
__dirname + "/pages/game.html", 
HTTP_SERVER._cards.getAgents, 
g_pEventManager, 
{
    getCardType : HTTP_SERVER._cards.getCardType
});


/**
 * Validates Deck send by user prior Login
 */
HTTP_SERVER._userManagement = require("./game-server/lobby-manager.js");
HTTP_SERVER._userManagement.setup(HTTP_SERVER._cards);
 
HTTP_SERVER._authenticationManagement = require("./game-server/authentication.js");
HTTP_SERVER._authenticationManagement.setUserManager(HTTP_SERVER._roomManager);

/**
 * Create server
 */
const g_pExpress = require('express');

HTTP_SERVER._server = g_pExpress();

(function()
{
    HTTP_SERVER._server.use(require('cookie-parser')());
    HTTP_SERVER._server.use(g_pExpress.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
    HTTP_SERVER._server.use(g_pExpress.json()); // for parsing application/json

    HTTP_SERVER._server.disable('x-powered-by');
    HTTP_SERVER._http = require('http').createServer(HTTP_SERVER._server);
})();

const PLUGINS = {
    decklist : require("./plugins/decklist.js").load(require("./game-server/decklist.js"), __dirname)
};

/**
 * Check if the input is valid and alphanumeric
 * 
 * @param {String} sInput 
 * @returns 
 */
HTTP_SERVER.isAlphaNumeric = function(sInput)
{
    return sInput !== undefined && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
};


/**
 * Create a unique user id
 * @returns UUID String
 */
HTTP_SERVER.generateUuid = function () 
{
    return HTTP_SERVER.environment.uuid_tpl.replace(/[xy]/g, function (c) 
    {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

HTTP_SERVER.getContentSecurityPolicyMegaAdditionals = function()
{
    const jEntries = {
        "script-src": "'self' 'nonce-START'",
        "img-src": "'self' " + HTTP_SERVER.environment.csp_image_domain,
        "report-uri": HTTP_SERVER.environment.csp_report_uri
    };

    let sVal = "";
    for (let key in jEntries) 
    {
        if (jEntries[key] !== "")
            sVal += key + " " + jEntries[key] + "; ";
    }
     
    return sVal.trim();
}

/**
 * Create a unique secret 
 * @returns hashed SHA256 salt as HEX
 */
HTTP_SERVER.createSecret = function () 
{
    const salt1 = HTTP_SERVER.generateUuid() + Math.floor(Math.random() * Math.floor(1000)) + 1;
    const salt2 = HTTP_SERVER.generateUuid() + Math.floor(Math.random() * Math.floor(1000)) + 1;
    const x = salt1 + salt2 + HTTP_SERVER.generateUuid() + "0";
    return require('crypto').createHash('sha256').update(x, 'utf8').digest('hex');
};


/**
 * Once the server is up and running,
 * init the game module
 */
HTTP_SERVER.onListen = function () 
{
    HTTP_SERVER._io = require('socket.io')(HTTP_SERVER._http);
    HTTP_SERVER._io.on('connection', HTTP_SERVER.onIoConnection);
};

/**
 * Set the response to expire and not be cached at all
 * @param {Object} res 
 * @returns res
 */
HTTP_SERVER.expireResponse = function(res)
{
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Expires", HTTP_SERVER.environment.expiresDate);
    return res;
}

/**
 * Add cache header params
 * @param {Object} res 
 * @returns res
 */
HTTP_SERVER.cacheResponse = function(res)
{
    res.setHeader("Cache-Control", "public, max-age=" + HTTP_SERVER.environment.imageExpires);
    res.setHeader("Expires", HTTP_SERVER.environment.cacheDate);
    return res;
}

/**
 * Shutdown game module and the http server
 */
HTTP_SERVER.shutdown = function () 
{
    console.log("\nShutting down game server.");

    try 
    {
        console.log("- shutdown IO http server.");
        HTTP_SERVER._io.httpServer.close();
    }
    catch (e) 
    {
        console.error(e);
    }

    try 
    {
        console.log("- shutdown IO.");
        HTTP_SERVER._io.close();
    }
    catch (e) 
    {
        console.error(e);
    }

    try 
    {
        console.log("- shutdown server.");
        HTTP_SERVER._serverListener.close();
    }
    catch (e) 
    {
        console.error(e);
    }

    HTTP_SERVER._io = null;
    HTTP_SERVER._serverListener = null;

    console.log("- stop application.");
    process.exit(0);
}

HTTP_SERVER.sameOrigin = function(req)
{
    function getDomain(sInout)
    {
        if (sInout === undefined || sInout === null || sInout === "")
            return null;

        let nPos = sInout.indexOf("//");
        if (nPos === -1)
            return sInout;

        sInout = sInout.substring(nPos + 2);
        return sInout === "" ? null : sInout;
    }

    let sOrigin = getDomain(req.get('origin'));
    let sHost = getDomain(req.get('host'));

    return sOrigin === sHost && sOrigin !== null && sOrigin !== "";
}

/**
 * Check if all necessary cookies are still valid
 * 
 * @param {Object} res 
 * @param {Object} req 
 * @returns 
 */
HTTP_SERVER.validateCookies = function (res, req) 
{
    /** no cookies available */
    if (req.cookies.userId === undefined ||
        req.cookies.room === undefined ||
        req.cookies.userId.length !== HTTP_SERVER.environment.uuid_tpl.length ||
        req.cookies.joined === undefined || req.cookies.joined < HTTP_SERVER.environment.startupTime) 
    {
        console.log("cookies appear to be nonexistent");
        HTTP_SERVER.clearCookies(res);
        return false;
    }
    else if (req.cookies.room !== undefined && !HTTP_SERVER._roomManager.isValidRoomCreationTime(req.cookies.room, req.cookies.joined)) 
    {
        /** cookies do exist, but appear to be from a previous game */
        HTTP_SERVER.clearCookies(res);

        console.log("cookies appear to be from an older game");
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
HTTP_SERVER.clearCookies = function (res) 
{
    res.clearCookie('userId');
    res.clearCookie('joined');
    res.clearCookie('room');
};

/**
 * These are the JS game files. Avoid caching.
 */
HTTP_SERVER._server.use("/media/client", g_pExpress.static("game-client"));

/* All media can be used with static routes */
HTTP_SERVER._server.use("/media/assets", g_pExpress.static("media/assets", 
{
    etag: true,
    maxage: HTTP_SERVER.environment.imageExpires * 1000
}));

/* Map images should be cached */
HTTP_SERVER._server.use("/media/maps", g_pExpress.static("media/maps", 
{
    etag: true,
    maxage: HTTP_SERVER.environment.imageExpires * 1000
}));
  
/**
 * This is a blank (black) page. Necessary for in-game default page
 */
HTTP_SERVER._server.use("/blank", function (req, res) 
{
    res.setHeader('Content-Type', 'text/html');
    HTTP_SERVER.cacheResponse(res).send('<!DOCTYPE html><html><body style="background:#000"></body></html>').status(200);
});

/**
 * Show Map Pages
 */
HTTP_SERVER._server.use("/map/underdeeps", g_pExpress.static(__dirname + "/pages/map-underdeeps.html", 
{
    etag: true,
    maxage: HTTP_SERVER.environment.imageExpires
}));

if (!HTTP_SERVER.environment.isProduction)
{
    HTTP_SERVER._server.use("/api", g_pExpress.static(__dirname + "/api/http"));
    HTTP_SERVER._server.use("/api/swagger.css", g_pExpress.static(__dirname + "/api/swagger.css"));
    HTTP_SERVER._server.use("/api/swagger.js", g_pExpress.static(__dirname + "/api/swagger.js"));
    HTTP_SERVER._server.use("/api/client", g_pExpress.static(__dirname + "/api/game-client"));
    HTTP_SERVER._server.use("/api/server", g_pExpress.static(__dirname + "/api/game-client"));    
}


/**
 * Show Region Map.
 * 
 * Since the map will be used regularly and many times per game, the HTML will be prepared
 * exactly ONCE and then be loaded from a cached variable
 * instead of creating it many times over and over again.
 */
HTTP_SERVER._mapHtml = "";
HTTP_SERVER.onRequestRegionMapHtml = function ()
{
    if (HTTP_SERVER._mapHtml === "")
    {
        const sSecurity = HTTP_SERVER.getContentSecurityPolicyMegaAdditionals();
        let sHtml = fs.readFileSync(__dirname + "/pages/map-regions.html", 'utf8');

        HTTP_SERVER._mapHtml = sHtml.replace("{TPL_CSP}", sSecurity).replace("{TPL_CSP_X}", sSecurity).replace("{IMAGE_CDN_URL}", HTTP_SERVER.environment.imageCDN);
    }
     
    return HTTP_SERVER._mapHtml;
};

HTTP_SERVER.onGetTappedSites = function (cookies)
{
    try
    {
        if (cookies !== undefined && cookies.room !== undefined && cookies.userId !== undefined)
            return HTTP_SERVER._roomManager.getTappedSites(cookies.room, cookies.userId);
    }
    catch(e)
    {
        console.log(e);
    }express

    return { };
};

/**
 * Region Map. Importantly, this must not be cached!
 */
HTTP_SERVER._server.get("/map/regions", function (req, res) 
{
    res.setHeader('Content-Type', 'text/html');
    HTTP_SERVER.expireResponse(res).send(HTTP_SERVER.onRequestRegionMapHtml()).status(200);
});


/**
 * Simple PING
 */
HTTP_SERVER._server.get("/ping", function (req, res) 
{
    res.setHeader('Content-Type', 'text/plain');
    HTTP_SERVER.expireResponse(res).send("pong").status(200);
});
 
/**
 * Show list of available images. 
 */
HTTP_SERVER._server.get("/data/list/images", function (req, res) 
{
    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.cacheResponse(res).send(HTTP_SERVER._cards.getImageList()).status(200);
});

/**
 * Show list of available sites
 */
HTTP_SERVER._server.get("/data/list/sites", function (req, res) 
{
    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.cacheResponse(res).send(HTTP_SERVER._cards.getSiteList()).status(200);
});

/**
 * This allows dynamic scoring categories. Can be cached, because it will not change.
 */
HTTP_SERVER._server.use("/data/scores", g_pExpress.static(__dirname + "/data/scores.json", 
{
    etag: true,
    maxage: HTTP_SERVER.environment.imageExpires
}));

/**
 * Get a list of tapped sites. This endpoint requiers cookie information. If these are not available,
 * the endpoint returns an empty map object.
 */
HTTP_SERVER._server.get("/data/list/sites-tapped", function (req, res) 
{
    const data = HTTP_SERVER.onGetTappedSites(req.cookies);

    res.setHeader('Content-Type', 'application/json'); 
    HTTP_SERVER.expireResponse(res).send( data ).status(200);    
});
        


/**
 * Provide the cards
 */
 HTTP_SERVER._server.get("/data/list/cards", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.cacheResponse(res).send(HTTP_SERVER._cards.getCards()).status(200);
});

/**
 * Provide the map data with all regions and sites for the map windows
 */
HTTP_SERVER._server.get("/data/list/map", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.cacheResponse(res).send(HTTP_SERVER._cards.getMapdata()).status(200);
});

HTTP_SERVER._server.get("/data/list/filters", function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.expireResponse(res).send(HTTP_SERVER._cards.getFilters()).status(200);
});

/**
 * Give some health information
 */
HTTP_SERVER._server.get("/health", function (req, res) 
{
    var os = require('os');

    const data = { 
        memory : {

            raw: process.memoryUsage(),
            megabytes : { },
        },
        loadavg : os.loadavg(),
    };

    for (let key in data.memory.raw) 
        data.memory.megabytes[key] = (Math.round(data.memory.raw[key] / 1024 / 1024 * 100) / 100);

    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.expireResponse(res).send(data).status(200);
});


/**
 * Error endpoint.
 * This also deletes all available cookies
 */
HTTP_SERVER._server.get("/error", function (req, res) 
{
    HTTP_SERVER.clearCookies(res);
    res.sendFile(__dirname + "/pages/error.html");
});

/**
 * Error endpoints with specific causes.
 * These also deletes all available cookies
 */
 HTTP_SERVER._server.get("/error/:type", function (req, res) 
{
    HTTP_SERVER.clearCookies(res);

    let page = "error.html";
    switch (req.params.type)
    {
        case "https-required":
            page = "error-https-required.html";
            break;
            
        case "denied":
            page = "error-access-denied.html";
            break;

        case "login":
            page = "error-login.html";
            break;
    
        default:
            break;
    }
    res.sendFile(__dirname + "/pages/" + page);
});


/**
 * Start the deckbuilder
 */
 HTTP_SERVER._server.get("/deckbuilder", function (req, res) 
 {
    let sHtmlCsp = HTTP_SERVER.getContentSecurityPolicyMegaAdditionals();
    
    let sHtml = fs.readFileSync(__dirname + "/pages/deckbuilder.html", 'utf8');

    res.setHeader('Content-Type', 'text/html');
    HTTP_SERVER.cacheResponse(res).send(sHtml.replace("{TPL_CSP}", sHtmlCsp).replace("{TPL_CSP_X}", sHtmlCsp).replace("{IMAGE_CDN_URL}", HTTP_SERVER.environment.imageCDN)).status(200)
});

/**
 * The LOGIN page.
 * 
 * Here, the user will provide a display name used in the game and
 * also upload their deck.
 * 
 * The page forwards to a login page which will create all cookies.
 */
HTTP_SERVER._server.get("/play/:room/login", function (req, res) 
{
    HTTP_SERVER.clearCookies(res);

    /* assert the room is valid */
    if (!HTTP_SERVER.isAlphaNumeric(req.params.room))
    {
        res.redirect("/error/error-invalid-room-name.html");
    }
    else
    {
        const sUser = req.cookies.username === undefined ? "" : req.cookies.username;
        let sHtml = fs.readFileSync(__dirname + "/pages/login.html", 'utf8');

        res.setHeader('Content-Type', 'text/html');
        HTTP_SERVER.expireResponse(res).send(sHtml.replace("{DISPLAYNAME}", sUser)).status(200);
    }
});

/**
 * Load a list of available challenge decks to start right away
 */
HTTP_SERVER._server.get("/data/decks", function (req, res) 
{
    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.cacheResponse(res).send(PLUGINS.decklist).status(200);
});

/**
 * Home Page
 */
HTTP_SERVER._server.get("/", function (req, res) 
{
    HTTP_SERVER.clearCookies(res);
    res.setHeader('Content-Type', 'text/html');
    HTTP_SERVER.cacheResponse(res).sendFile(__dirname + "/pages/home.html");
});

/**
 * About Page
 */
HTTP_SERVER._server.get("/about", function (req, res) 
{
    res.setHeader('Content-Type', 'text/html');
    HTTP_SERVER.cacheResponse(res).sendFile(__dirname + "/pages/about.html");
});

HTTP_SERVER.validateUserNameInjection = function(input)
{
    if (input === undefined || input === "")
        return "";

    input = input.trim().replace(/"/g, "");

    if (input.length > 30)
        input = input.substring(0, 29).trim();

    if (input === "" || input.indexOf("<") !== -1 || input.indexOf(">") !== -1)
        return "";
    else
        return input;
}

/**
 * Check if the deck is valid.
 */
HTTP_SERVER._server.post("/data/decks/check", function (req, res) 
{
    let bChecked = false;
    let vsUnknown = [];

    const jData = req.body;
    const nSize = jData.length;

    for (let i = 0; i < nSize; i++)
    {
        const code = jData[i];
        if (code !== "")
        {
            bChecked = true;
            if (!HTTP_SERVER._cards.isCardAvailable(code))
                vsUnknown.push(code);
        }
    }
    
    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.expireResponse(res).send({
        valid : bChecked && vsUnknown.length === 0,
        codes : vsUnknown
    }).status(200);
});
                
      
/**
 * Perform the login and set all necessary cookies.
 * 
 * The room will only allow ALPHANUMERIC characters and the display name will also be
 * checked to be alphanumeric only to avoid any HTML injection possibilities.
 * 
 */
HTTP_SERVER._server.post("/play/:room/login/check", function (req, res) 
{
    try 
    {
        if (!HTTP_SERVER.sameOrigin(req))
            throw "Invalid route";
        else if (!HTTP_SERVER.isAlphaNumeric(req.params.room))
            throw "Invalid room name";

        let room = req.params.room.toLocaleLowerCase();

        let jData = JSON.parse(req.body.data);
        let displayname = jData.name;

        /**
         * assert the username is alphanumeric only
         */
        if (!HTTP_SERVER.isAlphaNumeric(displayname) || jData.deck === undefined)
            throw "Invalid data";

        if (HTTP_SERVER._roomManager.isTooCrowded(room))
            throw "Too crowded";

        /**
         * Validate Deck first
         */
        let jDeck = HTTP_SERVER._userManagement.validateDeck(jData.deck);
        if (jDeck === null)
            throw "Invalid Deck";

        /**
         * Now, check if there already is a game for this Room
         */
        let userId = HTTP_SERVER.generateUuid();

        /** add player to lobby */
        let lNow = HTTP_SERVER._roomManager.addToLobby(room, userId, displayname, jDeck);

        /** proceed to lobby */
        const jSecure = { httpOnly: true, secure: true };
        res.cookie('room', room, jSecure);
        res.cookie('username', displayname, jSecure);
        res.cookie('userId', userId, jSecure);
        res.cookie('joined', lNow, jSecure);
        res.setHeader('Content-Type', 'text/plain');
        HTTP_SERVER.expireResponse(res).redirect("/play/" + req.params.room);
    }
    catch (e) 
    {
        console.log(e);
        HTTP_SERVER.expireResponse(res).redirect("/error/login");
    }
});

/**
 * Player enters the lobby to wait until addmitted to the table.
 * 
 * If the player entering this lobby is the first player (or allowed to access the table),
 * the player will be redirected to the game.
 * 
 * If the player does not yet have logged in, redirect to login.
 * Otherwise, simply show the waiting screen
 */
HTTP_SERVER._server.get("/play/:room/lobby", function (req, res) {
    
    /** assert that all necessary cookies are available and valid at this point  */
    if (!HTTP_SERVER.validateCookies(res, req)) 
    {
        res.redirect("/play/" + req.params.room + "/login");
        return;
    }

    /* if player is admin or accepted, simply redirect to game room */
    if (HTTP_SERVER._roomManager.isAccepted(req.params.room, req.cookies.userId)) 
    {
        res.redirect("/play/" + req.params.room);
    }
    else 
    {
        HTTP_SERVER._roomManager.sendJoinNotification(req.params.room);
        let sHtml = fs.readFileSync(__dirname + "/pages/lobby.html", 'utf8');
        res.setHeader('Content-Type', 'text/html');
        HTTP_SERVER.expireResponse(res).send(sHtml.replace("{room}", req.params.room).replace("{id}",req.cookies.userId)).status(200);
    }
});

/**
 * Get a list of players who are waiting to join this game
 */
HTTP_SERVER._server.get("/play/:room/waiting/:token", function (req, res) 
{
    if (HTTP_SERVER._roomManager.isGameHost(req.params.room, req.params.token))
    {
        let data = {
            waiting: HTTP_SERVER._roomManager.getWaitingList(req.params.room),
            players : HTTP_SERVER._roomManager.getPlayerList(req.params.room)
        }

        res.setHeader('Content-Type', 'application/json');
        HTTP_SERVER.expireResponse(res).send(data).status(200);
    }
    else
        res.sendStatus(401);
});


/**
 * Allow player to access thetable
 */
HTTP_SERVER._server.post("/play/:room/invite/:id/:token", function (req, res) 
{
    if (HTTP_SERVER._roomManager.isGameHost(req.params.room, req.params.token))
    {
        HTTP_SERVER._roomManager.inviteWaiting(req.params.room, req.params.id);
        HTTP_SERVER.expireResponse(res).sendStatus(204);
    }
    else
        res.sendStatus(401);
});


/**
 * Reject player access to table
 */
 HTTP_SERVER._server.post("/play/:room/reject/:id/:token", function (req, res) 
 {
    if (HTTP_SERVER._roomManager.isGameHost(req.params.room, req.params.token))
    {
        HTTP_SERVER._roomManager.rejectEntry(req.params.room, req.params.id);
        HTTP_SERVER.expireResponse(res).sendStatus(204);
    }
    else
        res.sendStatus(401);
});


/**
 * Reject player access to table
 */
HTTP_SERVER._server.post("/play/:room/remove/:id/:token", function (req, res) 
{
    if (HTTP_SERVER._roomManager.isGameHost(req.params.room, req.params.token))
    {
        console.log("remove payer from game");
        HTTP_SERVER._roomManager.removePlayerFromGame(req.params.room, req.params.id);
        HTTP_SERVER.expireResponse(res).sendStatus(204);
    }
    else
        res.sendStatus(401);
});

/**
 * Get active games
 */
 HTTP_SERVER._server.get("/games", function (req, res) 
 {
    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.expireResponse(res).send(HTTP_SERVER._roomManager.getActiveGames()).status(200);
});

/**
 * Get the status of a given player (access denied, waiting, addmitted)
 */
 HTTP_SERVER._server.get("/dump", function (req, res) 
 {
    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.expireResponse(res).send(HTTP_SERVER._roomManager.dump()).status(200);
});

/**
 * Get the status of a given player (access denied, waiting, addmitted)
 */
HTTP_SERVER._server.get("/play/:room/status/:id", function (req, res) {

    let _obj = {
        status: "denied",
        room: req.params.room
    };

    let status = HTTP_SERVER._roomManager.isAccepted(req.params.room, req.params.id);
    if (status !== null)
        _obj.status = status ? "ok" : "wait";

    res.setHeader('Content-Type', 'application/json');
    HTTP_SERVER.expireResponse(res).send(_obj).status(200);
});

/**
 * Player joins a table.
 * 
 * The room name has to be ALPHANUMERIC. Otherwise, the requets will fail.
 */
HTTP_SERVER._server.get("/play/:room", function (req, res) 
{
    if (!HTTP_SERVER.isAlphaNumeric(req.params.room))
    {
        res.redirect("/error/error-invalid-room-name.html");
        return;
    }

    /**
     * enforece lowercase room, is always alphanumeric
     */
    const room = req.params.room.toLocaleLowerCase();

    /** 
     * Check if player has never been in this room before.
     * Forward to login page for deck selection and display name
     */
    if (!HTTP_SERVER.validateCookies(res, req)) 
    {
        res.redirect("/play/" + room + "/login");
        return;
    }

    /**
     * Assert that the user really accepted
     */
    let bForwardToGame = HTTP_SERVER._roomManager.isAccepted(room, req.cookies.userId);
    if (bForwardToGame === null) 
    {
        res.redirect("/play/" + room + "/login");
        return;
    }
    else if (!bForwardToGame) 
    {
        res.redirect("/play/" + room + "/lobby");
        return;
    }

    /**
     * At this point, the user is allowed to enter the room.
     * 
     * The user may have joined with a second window. In that case, they would have 2 active sessions open.
     */
    let lTimeJoined = HTTP_SERVER._roomManager.updateEntryTime(room, req.cookies.userId);
    if (lTimeJoined === 0) 
    {
        res.redirect("/play/" + room + "/login");
        return;
    }

    /**
     * Force close all existing other sessions of this player
     */
    res.cookie('joined', lTimeJoined, { httpOnly: true, secure: true });

    /**
     * now serve the game page
     */
    const sHtml = HTTP_SERVER._roomManager.loadGamePage(room, req.cookies.userId, req.cookies.username, lTimeJoined, HTTP_SERVER.getContentSecurityPolicyMegaAdditionals(), HTTP_SERVER.environment.imageCDN);
    res.setHeader('Content-Type', 'text/html');
    HTTP_SERVER.expireResponse(res).send(sHtml).status(200);
});

/**
 * Show Rules
 */
HTTP_SERVER._server.get("/rules/:rule", function (req, res) 
{
    let page;

    switch (req.params.type)
    {
        case "balrog":
        case "against-the-shadow":
        case "dark-minions":
        case "dragons":
        case "lidless-eye":
        case "white-hand":
            page = req.params.type;
            break;

        default:
            page = "wizards";
            break;
    }
    
    res.sendFile(__dirname + "/pages/rules-" + page + ".html");
});

HTTP_SERVER.onIoConnection = function (socket) 
{
    socket.auth = false;
    socket.userid = "";
    socket.username = "";

    HTTP_SERVER._authenticationManagement.triggerAuthenticationProcess(socket);

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
            console.log(socket.username + " disconnected from game " + socket.room);

            HTTP_SERVER._roomManager.onDisconnected(socket.userid, socket.room);
            HTTP_SERVER._roomManager.checkGameContinuence(socket.room);
        }
    });

    /** Player has reconnected. Send an update all */
    socket.on('reconnect', () => 
    {
        if (socket.auth) 
            HTTP_SERVER._roomManager.onReconnected(socket.userid, socket.room);
    });

    /**
     * Destroy session if not authenticated within 1second after connection
     * @return {void}
     */
    setTimeout(function () 
    {
        if (!socket.auth) 
        {
            console.log("Disconnecting socket " + socket.id + " due to missing authentication.");
            socket.disconnect('unauthorized');
        }

    }, 1000 * 60 * 2);
};


HTTP_SERVER._server.use(function(req, res, next) 
{
    res.status(404);
    res.format({
      html: function () {
        res.sendFile(__dirname + "/pages/error-404.html");
      },
      json: function () {
        res.json({ error: 'Not found' })
      },
      default: function () {
        res.type('txt').send('Not found')
      }
    })
});
  
// 500 - Any server error
HTTP_SERVER._server.use(function(err, req, res, next) 
{
    console.log(err);

    res.status(500);
    res.format({
      html: function () {
        res.sendFile(__dirname + "/pages/error-500.html");
      },
      json: function () {
        res.json({ error: "Something went wrong" })
      },
      default: function () {
        res.type('txt').send("Something went wrong")
      }
    });
});

/**
 * allow CTRL+C
 */
process.on('SIGTERM', HTTP_SERVER.shutdown);
process.on('SIGINT', HTTP_SERVER.shutdown);

console.log("Server started at port " + HTTP_SERVER.environment.port);
HTTP_SERVER._serverListener = HTTP_SERVER._http.listen(HTTP_SERVER.environment.port, HTTP_SERVER.onListen);

HTTP_SERVER._serverListener.on('clientError', (err, socket) => 
{
    console.error(err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

