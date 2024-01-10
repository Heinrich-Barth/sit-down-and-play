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

    onShowCardsToPlayer(_bIsMe, data)
    {
        const myId = this.getMyId();
        const cards = data.cards;
        if (data.first !== myId && data.second !== myId || !Array.isArray(cards) || cards.length === 0)
            return;
    }
}


class RevealPlayerDeckSelf 
{
    static #instance = new RevealPlayerDeckSelf();

    #deck = "playdeck";
    #currentShown = 0;

    static lookAt(num)
    {
        if (num < 1)
            return;

        MeccgApi.send("/game/deck/reveal/self", {
            type: "show",
            deck: "playdeck",
            count: num
        });
    }

    static get()
    {
        return RevealPlayerDeckSelf.#instance;
    }

    onRevalToSelf(isMe, jData)
    {
        if (isMe !== true || jData === undefined)
            return;

        this.#removeDialog();
        const type = jData.deck;
        const list = jData.cards;

        this.#currentShown = list.length;
        if (this.#currentShown === 0)
            return;

        const dialog = this.#createDialog(list);
        document.body.append(dialog);
    }

    #createDialog(codes)
    {
        const dialog = document.createElement("div");
        dialog.setAttribute("id", "dialog_reveal_self");
        dialog.setAttribute("class", "reveal-to-self");
        dialog.setAttribute("title", "click anywhere to close");
        dialog.onclick = () => this.#closeDialog();


        const h2 = document.createElement("h2");
        h2.innerText = "Look at your playdeck";

        const p = document.createElement("p");
        p.innerText = "Click anywhere here to close this dialog.";

        const div = document.createElement("div");
        div.setAttribute("class", "reveal-to-self-content");

        div.append(h2, p, this.#createCards(codes));
        dialog.append(div);
        return dialog;
    }

    #createCardImage(card)
    {
        const img = document.createElement("img");
        img.setAttribute("src", g_Game.CardList.getImage(card.code));
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("class", "card-icon");
        img.setAttribute("data-image-backside", "/data/backside");

        const elem = document.createElement("div");
        elem.setAttribute("class", "card-hand");
        elem.appendChild(img);

        g_Game.CardPreview.init(elem, true, true);
        return elem;
    }

    #createCards(codes)
    {
        const div = document.createElement("div");

        for (let code of codes)
            div.append(this.#createCardImage(code));

        return div;
    }

    #closeDialog()
    {
        this.#removeDialog();

        if (this.#currentShown < 2)
            return;

        MeccgApi.send("/game/deck/reveal/self", {
            type: "shuffle",
            deck: this.#deck,
            count: this.#currentShown
        });   
    }

    #removeDialog()
    {
        const elem = document.getElementById("dialog_reveal_self");
        if (elem !== null)
            elem.parentElement.removeChild(elem);
    }

    init()
    {
        MeccgApi.addListener("/game/deck/reveal/self", this.onRevalToSelf.bind(this));
    }



}

if (!RevealCardPile.isArda())
    RevealPlayerDeck.INSTANCE = new RevealPlayerDeck().addRoutes();

RevealPlayerDeckSelf.get().init();