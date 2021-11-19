
const CookiePreferences = require("./cookiepreferences");

const pCookiePreferences = new CookiePreferences("game");
pCookiePreferences.addPreference("background", "bg-game");

module.exports = function(SERVER, g_pAuthentication)
{
    pCookiePreferences.setProduction(SERVER.environment.isProduction);

    const GamePlayRouteHandlerDefault = require("./game-play-standard");
    new GamePlayRouteHandlerDefault(SERVER, "/play", "home.html", "login.html", "lobby.html", g_pAuthentication).setupRoutes();

    const GamePlayRouteHandlerArda = require("./game-play-arda");
    new GamePlayRouteHandlerArda(SERVER, "/arda", "home.html", "login-arda.html", "lobby.html", g_pAuthentication).setupRoutes();

    const GamePlayRouteHandlerSingle = require("./game-play-single");
    new GamePlayRouteHandlerSingle(SERVER, "/singleplayer", "home.html", "login-singleplayer.html", "home.html", g_pAuthentication).setupRoutes();

    SERVER.instance.get("/data/preferences/game", (req, res) => SERVER.expireResponse(res, "application/json").send(pCookiePreferences.get(req.cookies)).status(200));
    SERVER.instance.post("/data/preferences/game", (req, res) =>  { 
        pCookiePreferences.update(req, res);
        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });
};