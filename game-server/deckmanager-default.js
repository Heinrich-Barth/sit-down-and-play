const DeckManager = require("./deckmanager");

const HandManager = require("./handmanager");

const Deck = require("./deck-default");

class DeckManagerDefault extends DeckManager {

    constructor()
    {
        super();
    }

    creatHandManager()
    {
        return new HandManager(this);
    }

    newDeckInstance(playerId)
    {
        return new Deck(playerId);
    }
}

module.exports = DeckManagerDefault;