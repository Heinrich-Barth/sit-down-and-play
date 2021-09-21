
const CookiePreferences = require("./cookiepreferences");

const pCookiePreferences = new CookiePreferences("game");
pCookiePreferences.addPreference("background", "bg-game");

module.exports = function(SERVER)
{
    pCookiePreferences.setProduction(SERVER.environment.isProduction);

    const GamePlayRouteHandlerDefault = require("./game-play-standard");
    new GamePlayRouteHandlerDefault(SERVER, "/play", "home.html", "login.html", "lobby.html").setupRoutes();

    const GamePlayRouteHandlerArda = require("./game-play-arda");
    new GamePlayRouteHandlerArda(SERVER, "/arda", "home.html", "login-arda.html", "lobby.html").setupRoutes();

    const GamePlayRouteHandlerSingle = require("./game-play-single");
    new GamePlayRouteHandlerSingle(SERVER, "/singleplayer", "home.html", "login-singleplayer.html", "home.html").setupRoutes();

    SERVER.instance.get("/data/preferences/game", (req, res) => SERVER.expireResponse(res, "application/json").send(pCookiePreferences.get(req.cookies)).status(200));
    SERVER.instance.post("/data/preferences/game", (req, res) =>  { 
        pCookiePreferences.update(req, res);
        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });
};