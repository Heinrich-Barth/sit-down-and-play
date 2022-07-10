
const PlayboardManager = require("./PlayboardManager");
const DeckManagerArda = require("./DeckManagerArda");

class PlayboardManagerArda extends PlayboardManager
{
    constructor(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer)
    {
        super(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer);
    }

    requireDeckManager(isSinglePlayer)
    {
        return new DeckManagerArda(isSinglePlayer);
    }
}

module.exports = PlayboardManagerArda;