

const PlayboardManager = require("./PlayboardManager");

const DeckManagerDefault = require("./deckmanager-default");
const DeckManagerArda = require("./deckmanager-arda");

const newDeckManagerInstance = function(isArda, isSinglePlayer)
{
    return isArda || isSinglePlayer ? new DeckManagerArda(isSinglePlayer) : new DeckManagerDefault();
}

/**
 * Create a new Game
 * @param {Array} _agentList 
 * @returns 
 */
exports.setup = function(_agentList, _eventManager, _gameCardProvider, isArda, isSinglePlayer) 
{
    const pDeckManager = newDeckManagerInstance(isArda, isSinglePlayer);
    return new PlayboardManager(pDeckManager, _agentList, _eventManager, _gameCardProvider);
};