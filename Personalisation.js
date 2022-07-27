
const fs = require('fs');

const Personalisation = {

    dices : [],
    backgorunds : {

    },

    background_keys : [],

    css : ""
};

(function()
{
    const readDir = function(rootDir)
    {
        try
        {
            let files = fs.readdirSync(rootDir);
            let res = files.filter(filename => fs.statSync(rootDir+ "/" + filename).isDirectory())

            res.sort();
            return res;
        }
        catch (err)
        {
            console.log(err);
        }

        return [];
    };

    const readFiles = function(rootDir)
    {
        try
        {
            let files = fs.readdirSync(rootDir);
            let res = files.filter(filename => fs.statSync(rootDir+ "/" + filename).isFile())

            res.sort();
            return res;
        }
        catch (err)
        {
            console.log(err);
        }

        return [];
    };

    const toMap = function(list)
    {
        if (list.length === 0)
            return { };

        let res = { };

        const len = list.length;
        for (let i = 0; i < len; i++)
            res["bg-" + i] = list[i];

        return res;
    };

    Personalisation.dices = readDir(__dirname + "/media/personalisation/dice");
    Personalisation.backgorunds = toMap(readFiles(__dirname + "/media/personalisation/backgrounds"));
    Personalisation.background_keys = Object.keys(Personalisation.backgorunds);

    console.log("personalisation information:");
    console.log("\t - "+Personalisation.dices.length + " dice(s) available");
    console.log("\t - "+Personalisation.background_keys.length + " background(s) available");
})();

const writePersonalisationCss = function(_req, res)
{
    res.setHeader('content-type', 'text/css');

    for (let key in Personalisation.backgorunds)
        res.write(`.${key} { background: url("/media/personalisation/backgrounds/${Personalisation.backgorunds[key]}") no-repeat center center fixed; background-size: cover; }\n`);

    res.write(" ");

    res.end();
};

module.exports = function(SERVER, g_pExpress)
{
    SERVER.instance.get("/data/dices", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(Personalisation.dices).status(200));
    SERVER.instance.get("/data/backgrounds", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(Personalisation.background_keys).status(200));

    SERVER.instance.use("/media/personalisation/dice", g_pExpress.static(__dirname + "/media/personalisation/dice"));
    SERVER.instance.use("/media/personalisation/backgrounds", g_pExpress.static(__dirname + "/media/personalisation/backgrounds"));
    SERVER.instance.use("/media/personalisation/sounds", g_pExpress.static(__dirname + "/media/personalisation/sounds"));
    SERVER.instance.get("/media/personalisation/personalisation.css", SERVER.caching.expires.generic, writePersonalisationCss);
}

