const getHours = function(lUptime)
{
    const lHours = lUptime / 60;
    return Math.floor(lHours);
};

const getMinutes = function(lUptime)
{
    const sHours = "" + Math.floor(lUptime % 60);
    const sShort = sHours.length < 2 ? sHours : sHours.substr(0, 2);
    return parseInt(sShort);
};


const getHealthData = function(jGames)
{
    const os = require('os');
    const lUptimeSeconds = (Date.now() -  g_nUptime) / 1000;
    const lUptime = lUptimeSeconds / 60;
    const lHours = getHours(lUptime);
    const lMins = getMinutes(lUptime);

    const data = { 

        startup: {
            startup: g_nUptime,
            readable: new Date(g_nUptime).toUTCString(),
            seconds: Math.floor(lUptimeSeconds)
        },

        uptime : {
            hours: lHours,
            minutes: lMins
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