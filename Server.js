const fs = require('fs');
const Logger = require("./Logger");
const Configuration = require("./Configuration");
const AuthenticationManagement = require("./game-management/authentication");
const RoomManager = require("./game-management/RoomManager");

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

const SERVER = {

    instance : null,

    getServerInstance()
    {
        return SERVER.instance;
    },

    caching : {

        headerData : {

            generic : {
                etag: true,
                maxage: 8640000 * 1000,
                "Cache-Control": "public, max-age=21600"
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
    _io : null,
    _http: null,
    _sampleRooms : [],
    _sampleNames : [],

    getSocketIo : function()
    {
        return SERVER._io;
    },

    getRoomManager: function()
    {
        return SERVER.roomManager;
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
    },

    initServer:function(g_pExpress)
    {
        SERVER.instance = g_pExpress();
        SERVER.instance.disable('x-powered-by');
        SERVER.instance.use(require('cookie-parser')());
        SERVER.instance.use(g_pExpress.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
        SERVER.instance.use(g_pExpress.json()); // for parsing application/json
        SERVER.instance.use(function (req, res, next) 
        {
            res.header('X-Robots-Tag','noindex, nofollow');
            res.header("X-Frame-Options",'sameorigin');

            if (cspAllowRemoteImages(req.path))
            {
                res.header('Content-Security-Policy', Configuration.createContentSecurityPolicyMegaAdditionals());
                res.header('X-Content-Security-Policy', Configuration.createContentSecurityPolicyMegaAdditionals());    
            }
            else
            {
                res.header('Content-Security-Policy', Configuration.createContentSecurityPolicySelfOnly());
                res.header('X-Content-Security-Policy', Configuration.createContentSecurityPolicySelfOnly());
            }

            next();
        });

        SERVER._http = require('http').createServer(SERVER.instance);
    },

    instanceListener:null,

    _page404 : "",
    _page500 : ""
}

fs.readFile(__dirname + "/pages/error-404.html", 'utf-8', (err, data) => 
{
    if (err) 
        Logger.warn(err);
    else
        SERVER._page404 = data;
});    
  
fs.readFile(__dirname + "/pages/error-500.html", 'utf-8', (err, data) => 
{
    if (err) 
        Logger.warn(err);
    else
        SERVER._page500 = data;
});

const onListenSetupSocketIo = function()
{
    SERVER._io = require('socket.io')(SERVER._http);
    SERVER._io.on('connection', onIoConnection);
    SERVER._io.engine.on("connection_error", (err) => Logger.error("There is a connection error ("+ err.code + "): " + err.message));
    SERVER._io.use(onIoHandshake);
}

const doShutdown = function()
{
    try
    {
        try 
        {
            Logger.info("- shutdown IO http server.");
            SERVER._io.httpServer.close();
        }
        catch (e) 
        {
            Logger.error(e);
        }

        try 
        {
            Logger.info("- shutdown IO.");
            SERVER._io.close();
        }
        catch (e) 
        {
            Logger.error(e);
        }

        try 
        {
            Logger.info("- shutdown server.");
            SERVER.instanceListener.close();
        }
        catch (e) 
        {
            Logger.error(e);
        }
    }
    finally
    {
        SERVER._io = null;
        SERVER.instanceListener = null;
    
        Logger.info("- stop application.");
        process.exit(0);
    }
};

const onSocketDisconnect = function(socket)
{
    if (!socket.auth) 
    {
        Logger.info("Disconnected unauthenticated session " + socket.id);
    }
    else 
    {
        SERVER.getRoomManager().onDisconnected(socket.userid, socket.room);
        SERVER.getRoomManager().checkGameContinuence(socket.room);
    }
}
const onIoHandshake = function(socket, next)
{
    const data = socket.handshake.auth;

    const token = data.authorization;
    const room = data.room;

    try
    {
        if (SERVER.getRoomManager().allowJoin(room, token, data.userId, data.joined, data.player_access_token_once))
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
        Logger.error(err);
    }

    next(null, false);
}

const onIoConnection = function (socket) 
{
    socket.username = "";

    AuthenticationManagement.triggerAuthenticationProcess(socket);

    /**
     * The disconnect event may have 2 consequnces
     * 1. interrupted and connection will be reestablished after some time
     * 2. user has left entirely
     */
    socket.on("disconnect", (_reason) => onSocketDisconnect(socket));

    /** Player has reconnected. Send an update all */
    socket.on('reconnect', () => SERVER.getRoomManager().onReconnected(socket.userid, socket.room));
};

exports.shutdown = () => 
{
    Logger.info("Shutting down game server.");

    /** send save game instruction to running games */
    if (SERVER.getRoomManager().sendShutdownSaving())
    {
        function sleep (time) 
        {
            return new Promise((resolve) => setTimeout(resolve, time));
        }
            
        sleep(2000).then(doShutdown).catch(Logger.error);
    }
    else
        doShutdown();

}

exports.setup = function(express)
{
    SERVER.initServer(express)
    SERVER.roomManager = new RoomManager(SERVER.getSocketIo, fs.readFileSync(__dirname + "/pages/game.html", 'utf8'));
    AuthenticationManagement.setUserManager(SERVER.roomManager);
}

exports.startup = function()
{
    SERVER.instanceListener = SERVER._http.listen(Configuration.port(), onListenSetupSocketIo);
    SERVER.instanceListener.setTimeout(1000 * Configuration.getRequestTimeout());
    SERVER.instanceListener.on('clientError', (err, socket) => 
    {
        Logger.error(err);
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    
    Logger.info("Server started at port " + Configuration.port());
}

exports.getServerInstance = () => SERVER.getServerInstance();

exports.getPage500 = () => SERVER._page500;
exports.getPage404 = () => SERVER._page404;

exports.Server = SERVER;

exports.Caching = SERVER.caching;

