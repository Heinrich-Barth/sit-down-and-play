
const navigationEntry = function(url, label)
{
    return { url: url, label: label };
};

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
        targetList.push(navigationEntry("/about", "About"));
    });
}

function __ignore()
{
    pEventManager.addEvent("test", function(p1, p2, p3)
    {
        console.log("Param1 " + p1);
        console.log("Param2 " + p2);
        console.log("Param3 " + p3);
    });

    /** register additional routes */
    pEventManager.addEvent("register-game-endpoints", function(pMeccgApi)
    {
        
    });

    pEventManager.addEvent("setup-new-game", function(jMap)
    {
        jMap.points = { 
            vorlons: 4,
            shadows: 4,
            babylon5: 4,
            players: { }
        };

    });

    pEventManager.addEvent("on-deck-added", function(playerId, jsonDeck, targetMap)
    {
        if (playerId === undefined || jsonDeck === undefined || jsonDeck.race === undefined 
            || targetMap === undefined 
            || targetMap.points === undefined || targetMap.points.players === undefined
            || targetMap.points.players[playerId] !== undefined)
            return;

        let tensions = {
            centauri: 2,
            human: 2,
            minbari: 2,
            narn: 2,
            unrest: 1,
            influence: 3
        };

        if (race === "minbari")
        {
            tensions.minbari = -1;
            tensions.human = 3;
        }
        else if (race === "narn")
        {
            tensions.narn = -1;
            tensions.centauri = 4;
        }
        else if (race === "centauri")
        {
            tensions.centauri = -1;
            tensions.narn = 4;
            tensions.human = 1;
        }
        else if (race === "human")
        {
            tensions.human = -1;
            tensions.centauri = 1;
            tensions.minbari = 4;
        }

        targetMap.points.players[playerId] = tensions;
    });
}

exports.registerEvents = (pEventManager) => _register(pEventManager);