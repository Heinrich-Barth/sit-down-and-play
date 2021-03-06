
const GamePlayRouteHandler = require("./GamePlayRouteHandler");

class GamePlayRouteHandlerSingle extends GamePlayRouteHandler
{
    constructor(pServer, sContext, sPagePlayRoot, sPageLogin, sLobbyPage, pAuthentication)
    {
        super(pServer, sContext, sPagePlayRoot, sPageLogin, sLobbyPage, pAuthentication)
    }

    validateDeck(jDeck)
    {
        return this.m_pServerInstance.cards.validateDeckSingleplayer(jDeck);
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