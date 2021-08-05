
class HandManager 
{
    constructor(pDecks)
    {
        this.DECKS = pDecks;
    }

    getCardPils(playerId, type)
    {
        if (typeof this.DECKS._deck[playerId] === "undefined" || typeof this.DECKS._deck[playerId][type] === "undefined")
            return [];
        else
            return this.DECKS._deck[playerId][type];
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

    victory(playerId)
    {
        return this.getCardPils(playerId, "victory");
    }
}


module.exports = HandManager;