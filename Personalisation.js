
const fs = require('fs');

const Personalisation = {

    dices : [],
    backgorunds : {

    },

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

})();


exports.getDices = function() 
{
    return Personalisation.dices;
};

exports.getBackgrounds = function() 
{
    return Object.keys(Personalisation.backgorunds);
};

exports.writePersonalisationCss = function(res)
{
    for (let key in Personalisation.backgorunds)
        res.write(`.${key} { background: url("/media/personalisation/backgrounds/${Personalisation.backgorunds[key]}") no-repeat center center fixed; background-size: cover; }\n`);

    res.write(" ");
};;