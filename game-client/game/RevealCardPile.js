class RevealCardPile extends TradeCards
{
    constructor(deck)
    {
        super()

        this.deck = deck;
    }

    static isArda()
    {
        return "true" === document.body.getAttribute("data-game-arda");
    }

    revealOfferedCards()
    {
        return false;
    }

    getPayloadTriggerTrading(challengerId, partnerId)
    {
        const data = super.getPayloadTriggerTrading(challengerId, partnerId);
        data.count = 5;
        data.deck = this.deck;
        return data;
    }

    labelChooseCards()
    {
        return "Reordering of cards in " + this.deck.toUpperCase();
    }

    labelCardsBeingOffered()
    {
        return "Card reordering will appear automatically.";
    }

    labelSelectCardsToTrade()
    {
        return "Click on the cards to add them to the top of the deck";
    }

    labelAcceptTrade()
    {
        return "Accept ordering";
    }

    getRouteTradeStart()
    {
        return "/game/deck/reveal/start";
    }

    getRouteTradeCancel()
    {
        return "/game/deck/reveal/cancel";
    }

    getRouteTradeRemove()
    {
        return "/game/deck/reveal/remove";
    }

    getRouteTradeOffer()
    {
        return "/game/deck/reveal/offer";
    }

    getRouteTradeAccept()
    {
        return "/game/deck/reveal/accept";
    }

    getRouteTradeSuccess()
    {
        return "/game/deck/reveal/success";
    }

    getRouteTradePerform()
    {
        return "/game/deck/reveal/perform";
    }

    toList(map)
    {
        const list = [];
        for (let key in map)
            list.push({uid: key, time: map[key]});

        list.sort((a,b) => a.time - b.time);

        const res = [];
        for (let elem of list)
            res.push(elem.uid);

        return res;
    }

    tradeAccepted(isMe, jData)
    {
        if (this.tradePartyNumber(jData) === 0 || !isMe)
            return;

        const data = {}
        data[this._myId] = this.toList(this._mapOfferred);
        data[this._partnerId] = this.toList(this._mapOffering);

        MeccgApi.send(this.getRouteTradePerform(), { 
            first: this._myId,
            second:  this._partnerId,
            deck: this.deck,
            cards : data
        });
    }

    showTradeBox(isMe, jData)
    {
        const elem = super.showTradeBox(isMe, jData);
        if (isMe && elem !== null)
            elem.classList.add("trade-hide-buttons");
    }
};

class RevealPlayerDeck extends RevealCardPile
{
    constructor()
    {
        super("playdeck");
    }

    static INSTANCE = null;

    static init(id)
    {
        const elem = RevealPlayerDeck.INSTANCE === null || RevealCardPile.isArda() ? null : document.getElementById(id);
        if (elem === null)
            return;

        elem.classList.add("deckpile-additional-actions");

        const span = document.createElement("span");
        span.setAttribute("class", "deckpile-additional-action fa fa-cog");
        span.setAttribute("title", "Click for additional actions");
        span.onclick = ContextMenu.contextActions.onContextPlayDeckActions;
        elem.appendChild(span);
    }

    onShowCardsToPlayer(_bIsMe, data)
    {
        const myId = this.getMyId();
        const cards = data.cards;
        if (data.first !== myId && data.second !== myId || !Array.isArray(cards) || cards.length === 0)
            return;
    }
}

if (!RevealCardPile.isArda())
    RevealPlayerDeck.INSTANCE = new RevealPlayerDeck().addRoutes();
