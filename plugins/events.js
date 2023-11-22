const Logger = require("../Logger");
const fs = require("fs");

const readJson = function(file)
{
    try
    {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    }
    catch (err)
    {
        Logger.warn(err);
    }

    return [];
}

const extractRoomName = function(uri)
{
    const pos = uri.lastIndexOf("/");
    const dot = uri.lastIndexOf(".");

    if (pos === -1 || dot < pos)
        return "";
    else
        return uri.substring(pos+1, dot);
}

const createRoomImageEntry = function(input)
{
    return {
        name: extractRoomName(input),
        image: input
    }
}

const g_jsonList = readJson(__dirname + '/namelist.json');
const g_roomNames = readJson(__dirname + '/../data-local/roomlist.json');

const Arda = require("./game-arda");
const Discord = require("./discord");

const g_pDiscord = new Discord();


function _register(pEventManager)
{
    pEventManager.addEvent("add-sample-rooms", function(targetList)
    {
        g_roomNames.forEach(_e => targetList.push(createRoomImageEntry(_e)));
        Logger.info("Sample room names loaded: " + targetList.length);
    });

    pEventManager.addEvent("add-sample-names", function(targetList)
    {
        g_jsonList.forEach(_e => targetList.push(_e));
    });

    pEventManager.addEvent("arda-prepare-deck", (pGameCardProvider, jDeck, keepOthers) => Arda.prepareDeck(pGameCardProvider, jDeck, keepOthers));
    
    g_pDiscord.registerEvents(pEventManager);

    pEventManager.dump();
}

exports.registerEvents = (pEventManager) => _register(pEventManager);