
const PlayboardManager = require("./PlayboardManager");
const DeckManagerArda = require("./DeckManagerArda");

class PlayboardManagerArda extends PlayboardManager
{
    requireDeckManager()
    {
        return new DeckManagerArda();
    }
}

module.exports = PlayboardManagerArda;