const Authentication = require("../authentication");
const autoRestart = typeof process.env.SERVER_AUTO_RESTART === "string" && process.env.SERVER_AUTO_RESTART !== "";
const ServerModule = require("../Server");

const lUptime = Date.now();
const g_sUptime = new Date(lUptime).toUTCString();

const getLoadavg = function()
{
    const os = require('os');
    return os.loadavg();
};

const getMemory = function()
{
    let data = {
        raw: process.memoryUsage(),
        megabytes : { }
    };

    for (let key in data.raw) 
        data.megabytes[key] = (Math.round(data.raw[key] / 1024 / 1024 * 100) / 100);

    return data;
}

const onHealthSmall = function(_req, res)
{
    const gameCount = ServerModule.Server.getRoomManager().getGameCount().length;
    const data = { 
        startup: g_sUptime,
        uptime : Date.now() - lUptime,
        games: gameCount,
        autoRestart: autoRestart
    };

    res.header('Content-Type', 'application/json');
    res.header("Cache-Control", "no-store");
    res.send(JSON.stringify(data, null, 3));
};

const onHealth = function(_req, res)
{
    const jGames = ServerModule.Server.getRoomManager().getActiveGames();
    const gameCount = ServerModule.Server.getRoomManager().getGameCount();
    const visits = {
        deckbuilder : ServerModule.Server.endpointVisits.deckbuilder,
        cards : ServerModule.Server.endpointVisits.cards,
        converter : ServerModule.Server.endpointVisits.converter,
        games: gameCount
    };

    const data = { 

        startup: g_sUptime,

        loadavg : getLoadavg(),
        memory : getMemory(),

        games: jGames,
        count: visits
    };

    res.header('Content-Type', 'application/json');
    res.header("Cache-Control", "no-store");
    res.send(JSON.stringify(data, null, 3));
};

module.exports = function()
{
    ServerModule.Server.getServerInstance().get("/health", Authentication.isSignedInPlay, onHealthSmall);
    ServerModule.Server.getServerInstance().get("/health/full", Authentication.isSignedInPlay, onHealth);
};