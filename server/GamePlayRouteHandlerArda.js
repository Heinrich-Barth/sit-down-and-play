
const GamePlayRouteHandler = require("./GamePlayRouteHandler");
const CardRepository = require("../plugins/CardDataProvider")

class GamePlayRouteHandlerArda extends GamePlayRouteHandler
{
    validateDeck(jDeck)
    {
        return CardRepository.validateDeckArda(jDeck);
    }

    isArda()
    {
        return true;
    }
}

module.exports = GamePlayRouteHandlerArda;