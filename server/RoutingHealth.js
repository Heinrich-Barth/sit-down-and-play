
const getHealthData = function(jGames)
{
    const os = require('os');

    const data = { 

        startup: {
            startup: g_nUptime,
            readable: new Date(g_nUptime).toUTCString()
        },

        loadavg : os.loadavg(),
        
        memory : {
            raw: process.memoryUsage(),
            megabytes : { }
        },

        games: jGames
    };

    for (let key in data.memory.raw) 
        data.memory.megabytes[key] = (Math.round(data.memory.raw[key] / 1024 / 1024 * 100) / 100);

    return data;
};

let g_nUptime = Date.now();

exports.setup = function(SERVER)
{
    g_nUptime = Date.now();
    SERVER.instance.get("/health", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(getHealthData(SERVER.roomManager.getActiveGames())).status(200));
};