const DeckManager = require("./DeckManager");

const HandManager = require("./HandManager");

const DeckDefault = require("./DeckDefault");

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
        return new DeckDefault(playerId);
    }

    resoteCardMapCloneCard(input)
    {
        return DeckDefault.cloneCardEntry(input);
    }
}

module.exports = DeckManagerDefault;