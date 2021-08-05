const DeckDefault = require("./deck-default");

class Deck extends DeckDefault {

    constructor(playerId)
    {
        super(playerId)
        
        this.playdeckSecond = [];
        this.handCardsSecond = [];
        this.discardPileSecond = [];
    }

    createNewCardUuid()
    {
        return "a" + super.createNewCardUuid();
    }

    saveState()
    {
        let data = super.saveState();
        data.handCardsSecond = [];
        data.discardPileSecond = [];
        return data;
    }

    drawSecond()
    {
        return this.transferCard(this.playdeckSecond.length, this.handCardsSecond);
    }

    popTopCardSecond()
    {
        return this.popTopCardFrom(this.playdeckSecond);
    }

    /**
     * Get card in hand
     * @returns {Array|deck.handCards}
     */
    getCardsInHandSecond()
    {
        return this.playdeckSecond;
    }
    
}

module.exports = Deck;