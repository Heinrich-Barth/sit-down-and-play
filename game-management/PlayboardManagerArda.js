
const PlayboardManager = require("./PlayboardManager");
const DeckManagerArda = require("./DeckManagerArda");

class PlayboardManagerArda extends PlayboardManager
{
    requireDeckManager(isSinglePlayer)
    {
        return new DeckManagerArda(isSinglePlayer);
    }
}

module.exports = PlayboardManagerArda;