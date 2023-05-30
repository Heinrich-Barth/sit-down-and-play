
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
    const gameCount = g_Server.roomManager.getGameCount().length;
    const data = { 
        startup: g_sUptime,
        uptime : Date.now() - lUptime,
        games: gameCount
    };

    res.header('Content-Type', 'application/json');
    res.header("Cache-Control", "no-store");
    res.send(JSON.stringify(data, null, 3));
};

const onHealth = function(_req, res)
{
    const jGames = g_Server.roomManager.getActiveGames();
    const gameCount = g_Server.roomManager.getGameCount();
    const visits = {
        deckbuilder : g_Server.endpointVisits.deckbuilder,
        cards : g_Server.endpointVisits.cards,
        converter : g_Server.endpointVisits.converter,
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

const lUptime = Date.now();
const g_sUptime = new Date(lUptime).toUTCString();
let g_Server = null;
let g_pAuthentication = null;

exports.setup = function(SERVER, pAuthentication)
{
    g_Server = SERVER;
    g_pAuthentication = pAuthentication;

    SERVER.instance.get("/health", g_pAuthentication.isSignedInPlay, onHealthSmall);
    SERVER.instance.get("/health/full", g_pAuthentication.isSignedInPlay, onHealth);
};