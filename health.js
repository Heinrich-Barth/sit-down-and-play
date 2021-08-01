

const getHealthData = function()
{
    const os = require('os');

    const data = { 
        memory : {
            raw: process.memoryUsage(),
            megabytes : { },
        },
        loadavg : os.loadavg(),
    };

    for (let key in data.memory.raw) 
        data.memory.megabytes[key] = (Math.round(data.memory.raw[key] / 1024 / 1024 * 100) / 100);

    return data;
};

exports.setup = function(SERVER)
{

    /**
     * Give some health information
     */
    SERVER.instance.get("/health", (req, res) => SERVER.expireResponse(res, "application/json").send(getHealthData()).status(200));
};