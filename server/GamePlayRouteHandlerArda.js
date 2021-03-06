
const GamePlayRouteHandler = require("./GamePlayRouteHandler");

class GamePlayRouteHandlerArda extends GamePlayRouteHandler
{
    constructor(pServer, sContext, sPagePlayRoot, sPageLogin, sLobbyPage, pAuthentication)
    {
        super(pServer, sContext, sPagePlayRoot, sPageLogin, sLobbyPage, pAuthentication)
    }

    validateDeck(jDeck)
    {
        return this.m_pServerInstance.cards.validateDeckArda(jDeck);
    }

    isArda()
    {
        return true;
    }
}

module.exports = GamePlayRouteHandlerArda;