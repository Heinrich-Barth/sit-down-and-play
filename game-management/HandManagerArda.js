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

    handStage(playerId)
    {
        return this.getCardPils(playerId, "handStage");
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

    discardPileStage(playerId)
    {
        return this.getCardPils(playerId, "discardPileStage");
    }

    playdeckStage(playerId)
    {
        return this.getCardPils(playerId, "playdeckStage");
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