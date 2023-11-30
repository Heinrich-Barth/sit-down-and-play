const HandManager = require("./HandManager");


class HandManagerArda extends HandManager
{
    handCardsCharacters(playerId)
    {
        return this.getCardPils(playerId, "handCardsCharacters");
    }

    handMinorItems(playerId)
    {
        return this.getCardPils(playerId, "handMinorItems");
    }

    sites(_playerId)
    {
        return [];
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