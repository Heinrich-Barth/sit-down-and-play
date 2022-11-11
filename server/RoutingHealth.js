
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

const onHealth = function(_req, res)
{
    const jGames = g_Server.roomManager.getActiveGames();
    const gameCount = g_Server.roomManager.getGameCount();
    
    const data = { 

        startup: g_sUptime,

        loadavg : getLoadavg(),
        memory : getMemory(),

        games: jGames,
        count: gameCount
    };


    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data, null, 3));
};

const g_sUptime = new Date(Date.now()).toUTCString();
let g_Server = null;

exports.setup = function(SERVER)
{
    g_Server = SERVER;
    SERVER.instance.get("/health", SERVER.caching.expires.jsonCallback, onHealth);
};