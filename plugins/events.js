const Logger = require("../Logger");

let g_jsonList = [];
(function()
{
    const fs = require('fs')
    fs.readFile(__dirname + '/namelist.json', 'utf8', function (err,data) 
    {
        if (err) 
        {
            Logger.info("No sample user names available.");
            return;
        }

        try
        {
            const json = JSON.parse(data);
            for (let elem of json)
            {
                if (elem !== "" && typeof elem === "string")
                    g_jsonList.push(elem.trim());
            }

            Logger.info(g_jsonList.length + " sample player names avaiable");
        }
        catch (ex)
        {
            Logger.error(ex);
        }
    });
})();

const Arda = require("./game-arda");
const Discord = require("./discord");

const g_pDiscord = new Discord();


function _register(pEventManager)
{
    pEventManager.addEvent("add-sample-rooms", function(targetList)
    {
        const SampleList = ["AmonHen", "Anduin", "Arnor", "Baranduin", "Beleriand", "Bree", "Bruinen", "Erebor", "EredLuin", "EredMithrin", "EredNimrais", "Eriador", "Esgaroth", "Fangorn", "Gondor", "GreatEastRoad", "Harad", "HelmsDeep", "Isengard", "Khazaddum", "Lothlorien", "Mirkwood", "MistyMountains", "Mordor", "MountDoom", "NorthSouthRoad", "Numenor", "Rhovanion", "Rhun", "Rivendell", "Rohan", "TheShire", "Weathertop"]
        SampleList.sort();
        SampleList.forEach((e) => targetList.push(e));
        Logger.info("Sample room names loaded: " + SampleList.length);
    });

    pEventManager.addEvent("add-sample-names", function(targetList)
    {
        for (let elem of g_jsonList)
            targetList.push(elem);
    });

    pEventManager.addEvent("arda-prepare-deck", (pGameCardProvider, jDeck, keepOthers) => Arda.prepareDeck(pGameCardProvider, jDeck, keepOthers));
    
    g_pDiscord.registerEvents(pEventManager);

    pEventManager.dump();
}

exports.registerEvents = (pEventManager) => _register(pEventManager);