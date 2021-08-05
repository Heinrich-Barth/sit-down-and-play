const HandManager = require("./handmanager");


class HandManagerArda extends HandManager
{
    constructor(pDecks)
    {
        super(pDecks);
    }

    handSecond(playerId)
    {
        return this.getCardPils(playerId, "handCardsSecond");
    }

}


module.exports = HandManagerArda;