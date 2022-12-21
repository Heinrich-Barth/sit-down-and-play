class ArdaExchangeBox {

    ArdaExchangeBox()
    {
        this._myId = "";
        this._partnerId = "";
        this._tradeAccepted = 0;
        this._mapOffering = { };
        this._mapOfferred = { };
    }

    resetTraders()
    {
        this._myId = "";
        this._partnerId = "";
        this._tradeAccepted = 0;
        this._mapOffering = { };
        this._mapOfferred = { };
    }

    create(leftIconDivId)
    {
        const container = document.getElementById(leftIconDivId);
        if (container === null)
            return false;

        const div = document.createElement("div");
        const a = document.createElement("i");

        a.setAttribute("title", "Click to trade cards with another player");
        a.setAttribute("class", "blue-box fa fa-exchange");
        a.setAttribute("aria-hidden", "true");
        a.onclick = this.onChoosePlayer.bind(this);
        
        div.setAttribute("class", "arda-hand-container ");
        div.appendChild(a);
        container.appendChild(div);
        return true;
    }

    addRoutes()
    {
        MeccgApi.addListener("/game/arda/trade/start", this.showTradeBox.bind(this));
        MeccgApi.addListener("/game/arda/trade/cancel", this.tradeCancelled.bind(this));
        MeccgApi.addListener("/game/arda/trade/remove", this.tradeRemoveOffered.bind(this));
        MeccgApi.addListener("/game/arda/trade/offer", this.tradeOffer.bind(this));
        MeccgApi.addListener("/game/arda/trade/accept", this.tradeAccepted.bind(this));
        MeccgApi.addListener("/game/arda/trade/success", this.tradeSuccess.bind(this));
        
    }

    showError(message)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": message }));
    }
    showWarning(message)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": message }));
    }
    showSuccess(message)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": message }));
    }

    onChoosePlayer()
    {
        let pPlayersCurrent = MeccgPlayers.getPlayers();
        const sizeCurrent = Object.keys(pPlayersCurrent).length;
        if (sizeCurrent < 2)
        {
            this.showError("Another player is needed to trade cards");
            return;
        }

        const div = document.createElement("div");
        div.setAttribute("id", "restore-game");
        div.setAttribute("class", "restore-game trade-panel config-panel");


        let _temp = document.createElement("div");
        _temp.setAttribute("class", "config-panel-overlay");
        _temp.setAttribute("title", "click here to cancel");
        _temp.setAttribute("id", "trade-panel-overlay");
        _temp.onclick = this.removeOverlay.bind(this);
        div.appendChild(_temp);

        _temp = document.createElement("div");
        _temp.setAttribute("class", "config-panel blue-box restore-panel");
        _temp.setAttribute("id", "trade-panel");
        div.appendChild(_temp);

        let _element = document.createElement("h2");
        _element.innerText = "Choose player to trade with";
        _temp.appendChild(_element);

        _element = document.createElement("p");
        _element.innerText = "Please choose one player to trade cards with";
        _temp.appendChild(_element);

        let ul = document.createElement("ul");
        _temp.appendChild(ul);

        _element = document.createElement("button");
        _element.innerText = "Cancal";
        _element.onclick = this.removeOverlay.bind(this);
        _temp.appendChild(_element);

        let _otherPlayerId = "";


        for (let key of Object.keys(pPlayersCurrent))
        {
            if (MeccgPlayers.isChallenger(key))
                continue;

            _otherPlayerId = key;

            const _li = document.createElement("li");
            const _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("data-player", key);
            _a.innerText = pPlayersCurrent[key];
            _a.onclick = this.onTriggerTrading.bind(this);
            _li.appendChild(_a);
            ul.appendChild(_li);
        }

        if (sizeCurrent === 2 && _otherPlayerId !== "")        
            this.onTriggerTrading(null, _otherPlayerId);
        else
            document.body.appendChild(div);
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
        _element.innerText = "Choose cards to trade";
        _temp.appendChild(_element);

        _element = document.createElement("p");
        _element.innerText = "Cards being offered to you will appear automatically.";
        _temp.appendChild(_element);

        let ul = document.createElement("div");
        ul.setAttribute("class", "offered-list trade-card-images");
        ul.setAttribute("id", "trade-offerred");
        _temp.appendChild(ul);

        _element = document.createElement("p");
        _element.innerText = "Select your cards to trade.";
        _temp.appendChild(_element);

        ul = document.createElement("div");
        ul.setAttribute("class", "offering-list trade-card-images");
        ul.setAttribute("id", "trade-offering");
        _temp.appendChild(ul);

        for (let card of listCards)
            ul.appendChild(this.createCardContainer(card.code, card.uuid, false, first, second));

        _element = document.createElement("button");
        _element.innerText = "Accept trade";
        _element.onclick = this.tradeAccept.bind(this);
        _element.setAttribute("data-first", first);
        _element.setAttribute("data-second", second);
        _element.setAttribute("class", "trade-accept");
        _temp.appendChild(_element);

        _element = document.createElement("button");
        _element.innerText = "Cancal";
        _element.setAttribute("data-first", first);
        _element.setAttribute("data-second", second);
        _element.setAttribute("class", "trade-cancel");
        _element.onclick = this.tradeCancel.bind(this);
        _temp.appendChild(_element);

        document.body.appendChild(div);
    }

    createCardContainer(code, uuid, addId) 
    {
        let _img = g_Game.CardList.getImage(code);
        let sCode = g_Game.CardList.getSafeCode(code);

        const img = document.createElement("img");
        img.setAttribute("src", _img);
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
            MeccgApi.send("/game/arda/trade/remove", { 
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

            MeccgApi.send("/game/arda/trade/offer", { 
                first: this._myId,
                second:  this._partnerId,
                code: code,
                uuid: uuid
            });
        }
    }

    tradeCancel(e)
    {
        MeccgApi.send("/game/arda/trade/cancel", { 
            first: this._myId,
            second:  this._partnerId,
        });
    }

    tradeAccept(e)
    {
        const elem = document.getElementById("trade-panel");
        if (elem !== null)
            elem.classList.add("trade-await-reply");

        MeccgApi.send("/game/arda/trade/accept", { 
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
        MeccgApi.send("/game/arda/trade/perform", { 
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
            Arda.getOpeningHands();
        }
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
            MeccgApi.send("/game/arda/trade/start", { 
                first: MeccgPlayers.getChallengerId(),
                second:  otherPlayer
            });
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
            this._mapOffering[jData.uuid] = true;
            return;
        }
        
        this._mapOfferred[jData.uuid] = true;

        const container = document.getElementById("trade-offerred");
        if (container !== null)
            container.appendChild(this.createCardContainer(jData.code, jData.uuid, true));
    }

    showTradeBox(_isMe, jData)
    {
        let listCards = null;
        const num = this.tradePartyNumber(jData);
        if (num === 1)
            listCards = jData.cards.first;
        else if (num === 2)
            listCards = jData.cards.second;
        
        if (listCards !== null && listCards.length > 0)
            this.createTradingOverlay(listCards, jData.first, jData.second);
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