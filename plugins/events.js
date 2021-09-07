
const navigationEntry = function(url, label)
{
    return { url: url, label: label };
};

const Arda = require("./game-arda");

function _register(pEventManager)
{
    console.log("register custom events");

    pEventManager.addEvent("add-sample-rooms", function(targetList)
    {
        const SampleList = ["AmonHen", "Anduin", "Arnor", "Baranduin", "Beleriand", "Bree", "Bruinen", "Erebor", "EredLuin", "EredMithrin", "EredNimrais", "Eriador", "Esgaroth", "Fangorn", "Gondor", "GreatEastRoad", "Harad", "HelmsDeep", "Isengard", "Khazaddum", "Lothlorien", "Mirkwood", "MistyMountains", "Mordor", "MountDoom", "NorthSouthRoad", "Numenor", "Rhovanion", "Rhun", "Rivendell", "Rohan", "TheShire", "Weathertop"]
        SampleList.forEach((e) => targetList.push(e));
        console.log("Sample room names loaded: " + SampleList.length);
    });

    pEventManager.addEvent("main-navigation", function(targetList)
    {
        targetList.push(navigationEntry("/cards", "Card Browser"));
        targetList.push(navigationEntry("/deckbuilder", "Deckbuilder"));
        targetList.push(navigationEntry("/", "Play a game"));
        targetList.push(navigationEntry("/map/regions", "Region Map"));
        targetList.push(navigationEntry("/map/underdeeps", "Underdeeps Map"));
        targetList.push(navigationEntry("/about", "About"));
    });

    pEventManager.addEvent("arda-prepare-deck", (pGameCardProvider, jDeck, keepOthers) => Arda.prepareDeck(pGameCardProvider, jDeck, keepOthers));
}

exports.registerEvents = (pEventManager) => _register(pEventManager);