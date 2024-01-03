const DeckManager = require("./DeckManager");

const HandManager = require("./HandManager");

const DeckDefault = require("./DeckDefault");

class DeckManagerDefault extends DeckManager 
{
    creatHandManager()
    {
        return new HandManager(this);
    }

    newDeckInstance(playerId)
    {
        return new DeckDefault(playerId);
    }

}

module.exports = DeckManagerDefault;