const Logger = require("../Logger");

class HandManager 
{
    constructor(pDecks)
    {
        this.DECKS = pDecks;
    }

    getPlayerDeck(playerId)
    {
        return this.DECKS.getPlayerDeck(playerId);
    }

    getCardPils(playerId, type)
    {
        const deck = this.getPlayerDeck(playerId);
        if (deck === null)
        {
            Logger.warn("Cannod find deck type " + type + " of player #" + playerId);
            try
            {
                throw new Error("temp only")
            }
            catch(err)
            {
                console.error(err);
            }
            return [];
        }

        const val = deck[type];
        if (typeof val === "undefined")
        {
            Logger.warn("Cannod find " + type + " pile of player #" + playerId);
            return [];
        }

        return val;
    }

    size(playerId)
    {
        const deck = this.getPlayerDeck(playerId);
        if (deck === null)
            return null;
        else
            return deck.size();
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
        for (let id of Object.keys(this.DECKS.getDecks()))
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