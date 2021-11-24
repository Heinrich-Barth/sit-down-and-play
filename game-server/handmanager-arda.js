const HandManager = require("./handmanager");


class HandManagerArda extends HandManager
{
    constructor(pDecks)
    {
        super(pDecks);
    }

    handCardsCharacters(playerId)
    {
        return this.getCardPils(playerId, "handCardsCharacters");
    }

    handMinorItems(playerId)
    {
        return this.getCardPils(playerId, "handMinorItems");
    }

    handMarshallingPoints(playerId)
    {
        return this.getCardPils(playerId, "handCardsMP");
    }

    discardPileMinor(playerId)
    {
        return this.getCardPils(playerId, "discardPileMinorItems");
    }

    playdeckMinor(playerId)
    {
        return this.getCardPils(playerId, "playdeckMinorItems");
    }

    playdeckMPs(playerId)
    {
        return this.getCardPils(playerId, "playdeckMP");
    }
    
    discardPileMPs(playerId)
    {
        return this.getCardPils(playerId, "discardPileMP");
    }

    playdeckCharacters(playerId)
    {
        return this.getCardPils(playerId, "playdeckCharacters");
    }
    
    discardPileCharacters(playerId)
    {
        return this.getCardPils(playerId, "discardPileCharacters");
    }
}


module.exports = HandManagerArda;