const Logger = require("../Logger");
const Configuration = require("../Configuration");

const CookiePreferences = require("./CookiePreferences");
const ServerModule = require("../Server");

const pCookiePreferences = new CookiePreferences("game");
pCookiePreferences.addPreference("background", "bg-game");
if (!Configuration.isProduction())
    pCookiePreferences.setProduction(false);

module.exports = function()
{
    const GamePlayRouteHandlerDefault = require("./GamePlayRouteHandler");
    new GamePlayRouteHandlerDefault("/play", "login.html", "lobby.html").setupRoutes();

    const GamePlayRouteHandlerArda = require("./GamePlayRouteHandlerArda");
    new GamePlayRouteHandlerArda("/arda", "login-arda.html", "lobby.html").setupRoutes();

    const GamePlayRouteHandlerSingle = require("./GamePlayRouteHandlerSingle");
    new GamePlayRouteHandlerSingle("/singleplayer", "login.html", "home.html").setupRoutes();

    ServerModule.getServerInstance().get("/data/preferences/game", ServerModule.Caching.expires.jsonCallback, (req, res) => res.send(pCookiePreferences.get(req.cookies)).status(200));
    ServerModule.getServerInstance().post("/data/preferences/game", (req, res) =>  { 
        pCookiePreferences.update(req, res);
        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });

    ServerModule.getServerInstance().post("/data/preferences/dice", (req, res) =>  { 
        try
        {
            const jData = req.body;
            const value = jData.value;
            if (value !== undefined && value !== "" && value.length < 20 && value.indexOf(".") === -1 && value.indexOf("\"") === -1)
                res.cookie("dice", value, true);
        }
        catch (e)
        {
            Logger.error(e);
        }

        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });
};