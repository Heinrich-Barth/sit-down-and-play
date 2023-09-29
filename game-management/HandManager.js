const Logger = require("../Logger");

class HandManager 
{
    constructor(pDecks)
    {
        this.DECKS = pDecks;
    }

    getCardPils(playerId, type)
    {
        if (typeof this.DECKS._deck[playerId] === "undefined")
        {
            Logger.warn("Cannod find deck of player #" + playerId);
            return [];
        }
        else if (typeof this.DECKS._deck[playerId][type] === "undefined")
        {
            Logger.warn("Cannod find " + type + " pile of player #" + playerId);
            return [];
        }
        else 
        {
            return this.DECKS._deck[playerId][type];
        }
    }

    size(playerId)
    {
        if (typeof this.DECKS._deck[playerId] === "undefined")
        {
            Logger.warn("decksize: Cannod find deck of player #" + playerId);
            return null;
        }
        else
            return this.DECKS._deck[playerId].size();
    }

    sites(playerId)
    {
        return this.getCardPils(playerId, "sites");
    }

    hand(playerId)
    {
        return this.getCardPils(playerId, "handCards");
    }

    sideboard(playerId)
    {
        return this.getCardPils(playerId, "sideboard");
    }

    discardpile(playerId)
    {
        return this.getCardPils(playerId, "discardPile");
    }

    playdeck(playerId)
    {
        return this.getCardPils(playerId, "playdeck");
    }

    handMarshallingPoints(_playerId)
    {
        return [];
    }

    victory(playerId)
    {
        return this.getCardPils(playerId, "victory");
    }

    getShared(type, ignorePlayId)
    {
        let list = [];
        for (let id of Object.keys(this.DECKS._deck))
        {
            if (id !== ignorePlayId)
                list = list.concat(this.getCardPils(id, type));
        }            

        return list;
    }

    sharedVicory(playerId)
    {
        return this.getShared("victory", playerId);
    }

    outofplay()
    {
        return this.getShared("outofplay", "");
    }
}


module.exports = HandManager;