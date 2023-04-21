class ArdaExchangeBox extends TradeCards {

    constructor()
    {
        super();
    }

    labelErrorTooFewPlayers()
    {
        return "Another player is needed to trade cards";
    }

    labelChooseTradingPartner()
    {
        return "Choose player to trade with";
    }

    labelChoosePlayerToTradeWith()
    {
        return "Please choose one player to trade cards with";
    }

    getRouteTradeStart()
    {
        return "/game/arda/trade/start";
    }

    getRouteTradeCancel()
    {
        return "/game/arda/trade/cancel";
    }

    getRouteTradeRemove()
    {
        return "/game/arda/trade/remove";
    }

    getRouteTradeOffer()
    {
        return "/game/arda/trade/offer";
    }

    getRouteTradeAccept()
    {
        return "/game/arda/trade/accept";
    }

    getRouteTradeSuccess()
    {
        return "/game/arda/trade/success";
    }

    getRouteTradePerform()
    {
        return "/game/arda/trade/perform";
    }

    tradeSuccess(isMe, jData)
    {
        if (super.tradeSuccess(isMe, jData))
        {
            Arda.getOpeningHands();
            Arda.getRegularHand();
        }
    }

    create(leftIconDivId)
    {
        const container = document.getElementById(leftIconDivId);
        if (container === null)
            return false;

        const div = document.createElement("div");
        const a = document.createElement("i");

        a.setAttribute("title", "Click to exchange cards with another player");
        a.setAttribute("class", "blue-box fa fa-exchange");
        a.setAttribute("aria-hidden", "true");
        a.onclick = this.onChoosePlayer.bind(this);
        
        div.setAttribute("class", "arda-hand-container ");
        div.appendChild(a);
        container.appendChild(div);
        return true;
    }

}