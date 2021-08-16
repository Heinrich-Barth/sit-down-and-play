

const getHealthData = function(jGames)
{
    const os = require('os');
    const lUptime =Date.now() -  g_nUptime;
    const pUptime = new Date(lUptime);

    const data = { 

        startup: {
            startup: g_nUptime,
            readable: new Date(g_nUptime).toUTCString(),
        },

        uptime : {

            uptime: lUptime,
            readable : pUptime.toUTCString(),
            hours: pUptime.getHours() - 1,
            minutes: pUptime.getMinutes()
        },
        
        memory : {
            raw: process.memoryUsage(),
            megabytes : { },
        },
        loadavg : os.loadavg(),
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
    SERVER.instance.get("/health", (req, res) => SERVER.expireResponse(res, "application/json").send(getHealthData(SERVER.roomManager.getActiveGames())).status(200));
};