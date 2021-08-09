const HandManager = require("./handmanager");


class HandManagerArda extends HandManager
{
    constructor(pDecks)
    {
        super(pDecks);
    }

    handMinorItems(playerId)
    {
        return this.getCardPils(playerId, "handMinorItems");
    }

    handMarshallingPoints(playerId)
    {
        return this.getCardPils(playerId, "handCardsMP");
    }
}


module.exports = HandManagerArda;