
const CookiePreferences = require("./CookiePreferences");

const pCookiePreferences = new CookiePreferences("game");
pCookiePreferences.addPreference("background", "bg-game");

module.exports = function(SERVER, isProduction, g_pAuthentication)
{
    pCookiePreferences.setProduction(isProduction);

    const GamePlayRouteHandlerDefault = require("./GamePlayRouteHandler");
    new GamePlayRouteHandlerDefault(SERVER, "/play", "home.html", "login.html", "lobby.html", g_pAuthentication).setupRoutes();

    const GamePlayRouteHandlerArda = require("./GamePlayRouteHandlerArda");
    new GamePlayRouteHandlerArda(SERVER, "/arda", "home.html", "login-arda.html", "lobby.html", g_pAuthentication).setupRoutes();

    const GamePlayRouteHandlerSingle = require("./GamePlayRouteHandlerSingle");
    new GamePlayRouteHandlerSingle(SERVER, "/singleplayer", "home.html", "login.html", "home.html", g_pAuthentication).setupRoutes();

    SERVER.instance.get("/data/preferences/game", SERVER.caching.expires.jsonCallback, (req, res) => res.send(pCookiePreferences.get(req.cookies)).status(200));
    SERVER.instance.post("/data/preferences/game", (req, res) =>  { 
        pCookiePreferences.update(req, res);
        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });

    SERVER.instance.post("/data/preferences/dice", (req, res) =>  { 
        try
        {
            const jData = req.body;
            const value = jData.value;
            if (value !== undefined && value !== "" && value.length < 20 && value.indexOf(".") === -1 && value.indexOf("\"") === -1)
                res.cookie("dice", value, true);
        }
        catch (e)
        {
            console.error(e);
        }

        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });
};