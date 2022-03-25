
const navigationEntry = function(url, label)
{
    return { url: url, label: label };
};

let g_jsonList = [];
(function()
{
    const fs = require('fs')
    fs.readFile(__dirname + '/namelist.json', 'utf8', function (err,data) 
    {
        if (err) 
        {
            console.log("No sample user names available.");
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

            console.log(g_jsonList.length + " sample player names avaiable");
        }
        catch (ex)
        {
            console.warn(ex.message);
        }
    });
})();

const Arda = require("./game-arda");

function _register(pEventManager)
{
    pEventManager.addEvent("add-sample-rooms", function(targetList)
    {
        const SampleList = ["AmonHen", "Anduin", "Arnor", "Baranduin", "Beleriand", "Bree", "Bruinen", "Erebor", "EredLuin", "EredMithrin", "EredNimrais", "Eriador", "Esgaroth", "Fangorn", "Gondor", "GreatEastRoad", "Harad", "HelmsDeep", "Isengard", "Khazaddum", "Lothlorien", "Mirkwood", "MistyMountains", "Mordor", "MountDoom", "NorthSouthRoad", "Numenor", "Rhovanion", "Rhun", "Rivendell", "Rohan", "TheShire", "Weathertop"]
        SampleList.sort();
        SampleList.forEach((e) => targetList.push(e));
        console.log("Sample room names loaded: " + SampleList.length);
    });

    pEventManager.addEvent("main-navigation", function(targetList)
    {
        targetList.push(navigationEntry("/cards", "Card Browser"));
        targetList.push(navigationEntry("/deckbuilder", "Deckbuilder"));
        targetList.push(navigationEntry("/converter", "Import a deck"));
        targetList.push(navigationEntry("/", "Play a game"));
        targetList.push(navigationEntry("/map/regions", "Region Map"));
        targetList.push(navigationEntry("/map/underdeeps", "Underdeeps Map"));
        targetList.push(navigationEntry("/about", "About"));
    });

    pEventManager.addEvent("add-sample-names", function(targetList)
    {
        for (let elem of g_jsonList)
            targetList.push(elem);
    });

    pEventManager.addEvent("arda-prepare-deck", (pGameCardProvider, jDeck, keepOthers) => Arda.prepareDeck(pGameCardProvider, jDeck, keepOthers));

    pEventManager.dump();
}

exports.registerEvents = (pEventManager) => _register(pEventManager);