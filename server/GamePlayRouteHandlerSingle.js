
const GamePlayRouteHandler = require("./GamePlayRouteHandler");
const CardRepository = require("../plugins/CardDataProvider")

class GamePlayRouteHandlerSingle extends GamePlayRouteHandler
{
    validateDeck(jDeck)
    {
        return CardRepository.validateDeckSingleplayer(jDeck);
    }

    isSinglePlayer()
    {
        return true;
    }

    isArda()
    {
        return true;
    }
}


module.exports = GamePlayRouteHandlerSingle;