class TradeCards extends PlayerSelectorAction {

    constructor()
    {
        super();

        this._myId = "";
        this._partnerId = "";
        this._tradeAccepted = 0;
        this._mapOffering = { };
        this._mapOfferred = { };
    }

    getMyId()
    {
        return this._myId;
    }

    getPartnerId()
    {
        return this._partnerId;
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

    resetTraders()
    {
        this._myId = "";
        this._partnerId = "";
        this._tradeAccepted = 0;
        this._mapOffering = { };
        this._mapOfferred = { };
    }

    create()
    {
        return true;
    }

    getRouteTradeStart()
    {
        return "";
    }

    getRouteTradeCancel()
    {
        return "";
    }

    getRouteTradeRemove()
    {
        return "";
    }

    getRouteTradeOffer()
    {
        return "";
    }

    getRouteTradeAccept()
    {
        return "";
    }

    getRouteTradeSuccess()
    {
        return "";
    }

    getRouteTradePerform()
    {
        return "";
    }

    addRoutes()
    {
        MeccgApi.addListener(this.getRouteTradeStart(), this.showTradeBox.bind(this));
        MeccgApi.addListener(this.getRouteTradeCancel(), this.tradeCancelled.bind(this));
        MeccgApi.addListener(this.getRouteTradeRemove(), this.tradeRemoveOffered.bind(this));
        MeccgApi.addListener(this.getRouteTradeOffer(), this.tradeOffer.bind(this));
        MeccgApi.addListener(this.getRouteTradeAccept(), this.tradeAccepted.bind(this));
        MeccgApi.addListener(this.getRouteTradeSuccess(), this.tradeSuccess.bind(this));
        return this;
    }

    assignTraders(first, second)
    {
        this.resetTraders();

        if (MeccgPlayers.isChallenger(first))
        {
            this._myId = first;
            this._partnerId = second;
        }
        else
        {
            this._myId = second;
            this._partnerId = first;
        }
    }

    createTradingOverlay(listCards, first, second)
    {
        this.assignTraders(first, second);

        const div = document.createElement("div");
        div.setAttribute("id", "restore-game");
        div.setAttribute("class", "restore-game trade-panel config-panel");


        let _temp = document.createElement("div");
        _temp.setAttribute("class", "config-panel-overlay");
        _temp.setAttribute("id", "trade-panel-overlay");
        div.appendChild(_temp);

        _temp = document.createElement("div");
        _temp.setAttribute("class", "config-panel blue-box restore-panel");
        _temp.setAttribute("id", "trade-panel");
        div.appendChild(_temp);

        let _element = document.createElement("h2");
        _element.innerText = this.labelChooseCards();
        _temp.appendChild(_element);

        _element = document.createElement("p");
        _element.innerText = this.labelCardsBeingOffered();
        _temp.appendChild(_element);

        let ul = document.createElement("div");
        ul.setAttribute("class", "offered-list trade-card-images");
        ul.setAttribute("id", "trade-offerred");
        _temp.appendChild(ul);

        _element = document.createElement("p");
        _element.innerText = this.labelSelectCardsToTrade();
        _temp.appendChild(_element);

        ul = document.createElement("div");
        ul.setAttribute("class", "offering-list trade-card-images");
        ul.setAttribute("id", "trade-offering");
        _temp.appendChild(ul);

        for (let card of listCards)
            ul.appendChild(this.createCardContainer(card.code, card.uuid, false, first, second, true));

        _element = document.createElement("button");
        _element.innerText = this.labelAcceptTrade();
        _element.onclick = this.tradeAccept.bind(this);
        _element.setAttribute("data-first", first);
        _element.setAttribute("data-second", second);
        _element.setAttribute("class", "trade-accept");
        _temp.appendChild(_element);

        _element = document.createElement("button");
        _element.innerText = "Cancel";
        _element.setAttribute("data-first", first);
        _element.setAttribute("data-second", second);
        _element.setAttribute("class", "trade-cancel");
        _element.onclick = this.tradeCancel.bind(this);
        _temp.appendChild(_element);

        document.body.appendChild(div);
        return div;
    }

    labelChooseCards()
    {
        return "Choose cards to trade";
    }

    labelCardsBeingOffered()
    {
        return "Cards being offered to you will appear automatically.";
    }

    labelSelectCardsToTrade()
    {
        return "Select your cards to trade.";
    }

    labelAcceptTrade()
    {
        return "Accept trade"
    }

    createCardContainer(code, uuid, addId, reveal) 
    {
        let _img = reveal ? g_Game.CardList.getImage(code) : "/data/backside";
        let sCode = g_Game.CardList.getSafeCode(code);

        const img = document.createElement("img");
        img.setAttribute("src", _img);
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("data-uuid", uuid);
        img.setAttribute("data-code", sCode);
        img.setAttribute("class", "card-icon");
        img.setAttribute("data-image-backside", "/data/backside");

        if (!addId)
            img.onclick = this.toggleImageOffering.bind(this);

        const elem = document.createElement("div");
        elem.setAttribute("class", "card-hand");
        if (addId)
            elem.setAttribute("id", "trade_" + uuid);
        
        elem.appendChild(img);


        g_Game.CardPreview.init(elem, true, true);
        return elem;
    }

    toggleImageOffering(e)
    {
        const elem = e.target.parentElement;
        const code = e.target.getAttribute("data-code");
        const uuid = e.target.getAttribute("data-uuid");

        if (elem.classList.contains("fa"))
        {
            elem.classList.remove("fa");
            elem.classList.remove("fa-exchange");
            MeccgApi.send(this.getRouteTradeRemove(), { 
                first: this._myId,
                second:  this._partnerId,
                code: code,
                uuid: uuid
            });
        }
        else 
        {
            elem.classList.add("fa");
            elem.classList.add("fa-exchange");

            MeccgApi.send(this.getRouteTradeOffer(), { 
                first: this._myId,
                second:  this._partnerId,
                code: code,
                uuid: uuid
            });
        }
    }

    tradeCancel(e)
    {
        MeccgApi.send(this.getRouteTradeCancel(), { 
            first: this._myId,
            second:  this._partnerId,
        });
    }

    tradeAccept(e)
    {
        const elem = document.getElementById("trade-panel");
        if (elem !== null)
            elem.classList.add("trade-await-reply");

        MeccgApi.send(this.getRouteTradeAccept(), { 
            first: this._myId,
            second:  this._partnerId,
        });
    }

    tradeAccepted(isMe, jData)
    {
        if (this.tradePartyNumber(jData) === 0)
            return;

        this._tradeAccepted++;
        if (!isMe || this._tradeAccepted !== 2)
            return;

        const data = {}
        data[this._myId] = this.toList(this._mapOffering);
        data[this._partnerId] = this.toList(this._mapOfferred);

        MeccgApi.send(this.getRouteTradePerform(), { 
            first: this._myId,
            second:  this._partnerId,
            cards : data
        });
    }

    toList(map)
    {
        let list = [];
        for (let key of Object.keys(map))
            list.push(key);
        return list;
    }

    tradeCancelled(_isMe, jData)
    {
        this.removeOverlay();
        if (!_isMe && this.tradePartyNumber(jData) !== 0)
            this.showWarning("Trade was cancelled");
    }

    tradeSuccess(_isMe, jData)
    {
        this.removeOverlay();

        if (this.tradePartyNumber(jData) !== 0)
        {
            this.showSuccess("Trade completed");
            return true;
        }
        else
            return false;
    }

    removeOverlay()
    {
        DomUtils.removeNode(document.getElementById("restore-game"));
    }

    onTriggerTrading(e, other)
    {
        const otherPlayer = e !== null ? e.target.getAttribute("data-player") : other;
        this.removeOverlay();

        if (otherPlayer === null || otherPlayer === undefined || otherPlayer === "")
        {
            this.showError("Could not get other player to trade with.");
        }
        else
        {
            MeccgApi.send(this.getRouteTradeStart(), this.getPayloadTriggerTrading( 
                MeccgPlayers.getChallengerId(),
                otherPlayer
            ));
        }
    }

    getPayloadTriggerTrading(challengerId, partnerId)
    {
        return {
            first: challengerId,
            second:  partnerId
        }
    }


    tradeRemoveOffered(_isMe, jData)
    {
        if (this.tradePartyNumber(jData) === 0)
            return;

        DomUtils.remove(document.getElementById("trade_" + jData.uuid));
        if (this._mapOffering[jData.uuid] !== undefined)
            delete this._mapOffering[jData.uuid];
        else if (this._mapOfferred[jData.uuid] !== undefined)
            delete this._mapOfferred[jData.uuid];
    }

    tradeOffer(isMe, jData)
    {
        if (this.tradePartyNumber(jData) === 0)
            return;

        if (isMe)
        {
            this._mapOffering[jData.uuid] = Date.now();
            return;
        }
        
        this._mapOfferred[jData.uuid] = Date.now();

        const container = document.getElementById("trade-offerred");
        if (container !== null)
            container.appendChild(this.createCardContainer(jData.code, jData.uuid, true, this.revealOfferedCards()));
    }

    revealOfferedCards()
    {
        return true;
    }

    showTradeBox(_isMe, jData)
    {
        let listCards = null;
        const num = this.tradePartyNumber(jData);
        if (num === 1)
            listCards = this.getCardList(jData.cards.first);
        else if (num === 2)
            listCards = this.getCardList(jData.cards.second);
        
        if (listCards === null)
            return null;
        else
            return this.createTradingOverlay(listCards, jData.first, jData.second);
    }

    getCardList(listCards)
    {
        if (listCards === null)
            return null;

        if (Array.isArray(listCards))
            return listCards;
        else if (!Array.isArray(listCards.mp) || !Array.isArray(listCards.hand))
            return [];
        
        const list = [];

        for (let e of listCards.hand)
            list.push(e);
        for (let e of listCards.mp)
            list.push(e);

        return list;
    }

    tradePartyNumber(jData)
    {
        if (jData === undefined || jData.first === undefined || jData.second === undefined)
            return 0;
        else if (MeccgPlayers.isChallenger(jData.first))
            return 1;
        else if (MeccgPlayers.isChallenger(jData.second))
            return 2;
        else
            return 0;
    }
}