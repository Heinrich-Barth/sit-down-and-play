
let Arda = {

    _ready : false,
    _hasReceivedMinor : false,
    _hasReceivedMps : false,
    _hasReceivedCharacters : false,
    _idCount : 1,
    _exchangeBox : new ArdaExchangeBox(),

    createHtmlElement: function(_code, _img, _uuid, type)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "card-hand");
        div.setAttribute("id", "arda-hand-card-" + _uuid);
        div.innerHTML = `<img crossorigin="anonymous" decoding="async" src="${_img}" data-id="${_code}" class="card-icon">`;

        const divHover = document.createElement("div");
        divHover.setAttribute("class", "arda-actions");

        let aHand;
        
        aHand = document.createElement("img");
        aHand.setAttribute("src", "/media/assets/images/icons/icon-discardpile.png");
        aHand.setAttribute("data-to", "discardpile");
        aHand.setAttribute("data-from", type);
        aHand.setAttribute("data-uuid", _uuid);
        aHand.setAttribute("data-code", _code);
        aHand.setAttribute("title", "Discard this card");
        aHand.onclick = Arda.onCardAction; 
        divHover.appendChild(aHand);

        aHand = document.createElement("img");
        aHand.setAttribute("src", "/media/assets/images/icons/icon-hand.png");
        aHand.setAttribute("data-to", "hand");
        aHand.setAttribute("data-from", type);
        aHand.setAttribute("data-uuid", _uuid);
        aHand.setAttribute("data-code", _code);
        aHand.setAttribute("title", "Move to your hand");
        aHand.onclick = Arda.onCardAction; 
        divHover.appendChild(aHand);
        
        div.appendChild(divHover);
        return div;
    },

    /**
     * Take a card to hand or discard it
     * @param {Event} e 
     */
    onCardAction : function(e)
    {
        const elem = e.target;
        const data = {
            code : elem.getAttribute("data-code"),
            uuid : elem.getAttribute("data-uuid"),
            type : elem.getAttribute("data-from"),
            to : elem.getAttribute("data-to"),
        };

        MeccgApi.send("/game/arda/from-hand", data);
    },

    addCss : function()
    {
        /** add CSS  */
        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href","/media/assets/css/game-arda.css");
        document.head.appendChild(link);
    },

    updateSinglePlayer : function()
    {
        if (this.isSinglePlayer())
        {
            DomUtils.remove(document.getElementById("arda-action-container-randomchars"));
            DomUtils.remove(document.getElementById("arda-action-container-minor"));
            DomUtils.remove(document.getElementById("arda-action-container-charackters"));

            DomUtils.remove(document.getElementById("arda_minors_hand"));
            DomUtils.remove(document.getElementById("arda_characters_hand"));
        }
    },

    init : function()
    {
        if (this._ready)
            return;
    
        const bAllowRecyling = this.isAdraAdmin();

        this.addCss();
        this.insertArdaContainer();

        if (!this.isSinglePlayer() && bAllowRecyling)
            this.insertArdaSetupContainer();

        let idMps = this.createContainer("arda_mps", "mps", "Marshalling Points", 5, false, "")
        document.getElementById(idMps).classList.remove("hidden");

        let idMinor = this.createContainer("arda_minors", "minor", "Minor Item Offerings", 4, bAllowRecyling, "");
        this.createContainer("arda_characters", "charackters", "Roving Characters", 4, bAllowRecyling, idMinor);

        this.getOpeningHands();
        this.updateSinglePlayer();

        if (!this.isSinglePlayer())
        {
            this._exchangeBox = new ArdaExchangeBox();
            this._exchangeBox.create("arda-hand-wrapper");
        }
        
        this._ready = true;
        MeccgApi.send("/game/arda/checkdraft", {});
    },

    isSinglePlayer()
    {
        return document.body.getAttribute("data-is-singleplayer") === "true";
    },

    getOpeningHands()
    {
        MeccgApi.send("/game/arda/hands", { });
    },

    getRegularHand()
    {
        MeccgApi.send("/game/card/hand", { });
    },

    insertArdaSetupContainer : function()
    {
        if (document.getElementById("arda-setup-container") !== null)
            return;

        const container = document.createElement("div");
        container.setAttribute("id", "arda-setup-container");
        container.setAttribute("class", "blue-box arda-setup-container hidden");

        const title = document.createElement("h2");
        title.innerText = "Arda Setup Guide";
        container.appendChild(title);

        const divWrapp = document.createElement("div");
        divWrapp.setAttribute("id", "arda-setup-container-content");
        container.append(divWrapp);

        document.body.appendChild(container);
    },

    insertArdaContainer : function()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "arda-hand-wrapper");
        div.setAttribute("id", "arda-hand-wrapper");

        this.insertMp(div, "fa-users", "Roving Characters", "charackters", "arda_characters", "");
        this.insertMp(div, "fa-shield", "Minor Item Offerings", "minor", "arda_minors", "");
        this.insertMp(div, "fa-trophy", "Marshalling Points", "mps", "arda_mps", "");

        document.body.appendChild(div);
    },

    isAdraAdmin : function()
    {
        return g_sLobbyToken !== "";
    },

    insertPlayerSelectIndicator : function()
    {
        /** not needed here */
    },
    
    insertOnceAction : function(parent, html, title, dataType, playerId, label)
    {
        const div = this.insertMp(parent, html, title, dataType, playerId, label);
        div.querySelector("i").onclick = () =>
        { 
            DomUtils.empty(div);
            div.classList.add("hidden");

            const elem = document.getElementById("arda_characters_hand");
            if (elem !== null)
                elem.classList.remove("hidden");

            MeccgApi.send("/game/arda/assign-characters", {});
        };
    },

    insertMp : function(parent, html, title, dataType, playerId, label)
    {
        const div = document.createElement("div");
        const a = document.createElement("i");

        a.setAttribute("data-type", dataType);
        a.setAttribute("data-player", playerId);
        a.setAttribute("id", "arda-action-container-" + dataType);
        a.setAttribute("title", title + ". Right click to refresh.");
        a.setAttribute("class", "blue-box fa context-cursor " + html);
        a.setAttribute("aria-hidden", "true");
        a.onclick = Arda.toogleView;
        
        if (label !== "")
            a.innerText = label;

        div.setAttribute("class", "arda-hand-container ");
        div.oncontextmenu = Arda.onRefreshHands;
        div.appendChild(a);
        parent.appendChild(div);
        return div;
    },

    onRefreshHands : function(e)
    {
        Arda.getOpeningHands();

        e.preventDefault();
        e.stopPropagation();
    },

    onShowHands : function()
    {
        ArrayList(document).findByClassName("arda-card-hands").each((elem) => {
            if (elem.classList.contains("hidden"))
                elem.classList.remove("hidden");
        });
    },

    toogleView : function(e)
    {
        const elem = Arda.getContainer(e.target.getAttribute("data-player"));
        if (elem !== null)
        {
            if (elem.classList.contains("hidden"))
                elem.classList.remove("hidden");
            else
                elem.classList.add("hidden");
        }

        e.preventDefault();
        return false;
    },

    getContainer : function(id)
    {
        return document.getElementById(id + "_hand");
    },

    createContainer : function(playerid, dataType, title, nHandSize, bRecycleOnce, sShowNextElement)
    {
        const id = playerid + "_hand";
        const idCardList = "arda_hand_container_" + dataType;
        let elem = document.getElementById(id);
        if (elem !== null)
            return id;

        const div = document.createElement("div");
        div.setAttribute("class", "arda-card-hands blue-box hidden arda-card-hand-" + dataType);
        div.setAttribute("id", id);

        let _sizerId = "";
        
        if (!this.isSinglePlayer())
        {
            _sizerId = ResolveHandSizeContainer.create(div, title + " - Always resolve to", nHandSize, "cards.");
            div.getElementsByClassName("card-hands-sizer")[0].classList.add("arda-card-hands-sizer");
        }
        else 
            nHandSize = -1;

        let _div = document.createElement("div");
        _div.setAttribute("class", "arda-inline");
        _div.setAttribute("id", idCardList);
        div.appendChild(_div);

        _div = document.createElement("div");
        _div.setAttribute("class", "arda-inline arda-hand-card-actions");

        {
            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-pile-action" + (bRecycleOnce ? " hidden":""));
            _a.setAttribute("id", "arda-view-discard-" + dataType);
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("data-view", "discard");
            _a.setAttribute("title", "View discard pile");
            _a.innerHTML = `<img src="/media/assets/images/icons/icon-discardpile.png" data-view="discard" data-type="${dataType}">`;
            _a.onclick = Arda.onViewPile;
            _div.appendChild(_a);

            _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-pile-action context-cursor" + (bRecycleOnce ? " hidden":""));
            _a.setAttribute("id", "arda-view-playdeck-" + dataType);
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("title", "View playdeck. Right click to shuffle");
            _a.setAttribute("data-view", "playdeck");
            _a.innerHTML = `<img src="/media/assets/images/icons/icon-playdeck.png" data-view="playdeck" data-type="${dataType}">`;
            _a.onclick = Arda.onViewPile;
            _a.oncontextmenu = Arda.onShufflePlaydeck;
            _div.appendChild(_a);

            _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-draw" + (bRecycleOnce ? " hidden":""));
            _a.setAttribute("id", "arda-card-draw-" + dataType);
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("data-handsize", nHandSize)
            _a.setAttribute("title", "Draw a new card");
            _a.setAttribute("data-container-id", id);
            _a.onclick = Arda.onDrawNewCard;
            _div.appendChild(_a);
        }
        div.appendChild(_div);

        document.body.appendChild(div);

        if (_sizerId !== "")
            ResolveHandSizeFirst.create(idCardList, _sizerId,  title + " cards", ["organisation", "eotdiscard"]);

        return id;
    },

    onShufflePlaydeck : function(e)
    {
        const type = e.target.getAttribute("data-type");
        if (type === "mps" || type === "minor")
        {
            MeccgApi.send("/game/arda/shuffle", { target: type });
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Playdeck shuffled (" + type + ")" }));
        }

        e.preventDefault();
    },

    showIfExitent : function(id)
    {
        const elem = id === "" ? null : document.getElementById(id);
        if (elem !== null)
            elem.classList.remove("hidden");

        return elem;
    },

    updateArdaSetupContainer : function(bIsReady, bHideDraftCharacters, bHideDraftMinors)
    {
        if (bHideDraftCharacters && bHideDraftMinors)
        {
            DomUtils.remove(document.getElementById("arda-setup-container"));
            return;
        }

        const containerWrapper = document.getElementById("arda-setup-container");
        const container = document.getElementById("arda-setup-container-content");
        if (container === null || containerWrapper === null)
            return;

        DomUtils.empty(container);

        containerWrapper.classList.remove("hidden");
        if (!bIsReady)
        {
            const elem = document.createElement("p");
            elem.innerText = "Once everybody is at the table, you can start the random character assignment.";
            container.appendChild(elem);
            this.insertOnceAction(container, "fa-users", "Assign random characters to every player.", "randomchars", "arda_ranom", "Assign random characters");
        }
        else if (!bHideDraftCharacters && !bHideDraftMinors)
        {
            let elem = document.createElement("p");
            elem.innerText = "Everybody may draft characters with a total of 25 GI. Yet, only 20 GI may be used.";
            container.appendChild(elem);

            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-recycle fa fa-recycle");
            _a.setAttribute("data-type", "charackters");
            _a.setAttribute("id", "arda-card-recycle-charackters");
            _a.setAttribute("title", "Complete character draft and choose minor items.");
            _a.innerText = " Complete character draft and choose minor items.";
            _a.onclick = Arda.onRecycleDeck;
            container.appendChild(_a);

            elem = document.createElement("p");
            elem.innerText = "Recycling will automatically disacrd your current hand and reshuffle everything into the playdeck.";
            container.appendChild(elem);

        }
        else 
        {
            const elem = document.createElement("p");
            elem.innerText = "Everybody may choose up to 3 minor items. Once that is done, the game can start.";
            container.appendChild(elem);

            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-recycle fa fa-recycle");
            _a.setAttribute("data-type", "minor");
            _a.setAttribute("id", "arda-card-recycle-minor");
            _a.setAttribute("title", "Complete minor item draft and start the game.");
            _a.innerText = " Complete minor item draft and start the game.";
            _a.onclick = Arda.onRecycleDeck;
            container.appendChild(_a);
        }
    },

    onCheckDraft : function(bIsReady, bHideDraftCharacters, bHideDraftMinors)
    {
        let elem;
        
        elem = document.getElementById("arda-card-recycle-charackters");
        if (bHideDraftCharacters)
        {
            DomUtils.remove(elem);
            Arda.showIfExitent("arda-card-draw-charackters");

            Arda.showIfExitent("arda_characters_hand");

            Arda.showIfExitent("arda-view-playdeck-charackters");
            Arda.showIfExitent("arda-view-discard-charackters");
        }

        elem = document.getElementById("arda-card-recycle-minor");
        if (bHideDraftMinors)
        {
            DomUtils.remove(elem);
            Arda.showIfExitent("arda-card-draw-minor");
            Arda.showIfExitent("arda_minors_hand");

            Arda.showIfExitent("arda-view-playdeck-minor");
            Arda.showIfExitent("arda-view-discard-minor");
        }

        Arda.updateArdaSetupContainer(bIsReady, bHideDraftCharacters, bHideDraftMinors);
    },

    onViewPile : function(e)
    {
        const type = e.target.getAttribute("data-type");
        const pile = e.target.getAttribute("data-view");
        
        MeccgApi.send("/game/arda/view", { type: type, pile: pile });
    },

    onRecycleDeck : function(e)
    {
        new Question().onOk(function()
        {
            const target = e.target.getAttribute("data-type");
            const next = e.target.getAttribute("data-next");

            DomUtils.remove(e.target);

            Arda.showIfExitent("arda-card-draw-" + target);
            Arda.showIfExitent("arda-view-playdeck-" + target);
            Arda.showIfExitent("arda-view-discard-" + target);
            Arda.showIfExitent(next);

            MeccgApi.send("/game/arda/recycle", { type: target });
        }).show("Do you want to reshuffle all cards into the playdeck?", "All cards will be reshuffled into the playdeck and a new hand will be drawn.", "Reshuffle everything");
    },
    
    getAllowedHandSize : function(elem)
    {
        const id = elem === null ? null : elem.getAttribute("data-container-id");
        const container = id === null || id === "" ? null : document.getElementById(id);

        let nDefault = -1;
        try
        {
            nDefault = parseInt(elem.getAttribute("data-handsize"));
                        
            const list = container === null ? null : container.getElementsByClassName("card-hands-sizer-size");
            if(list !== null && list.length === 1)
                return parseInt(list[0].innerText);
        }
        catch (err)
        {
            console.error(err);
        }

        return nDefault;
    },
    
    onDrawNewCard : function(e)
    {
        const elem = e.target;

        const nLen = Arda.getAllowedHandSize(elem);
        const type = elem.getAttribute("data-type");
        
        const list = document.getElementById("arda_hand_container_" + type);
        if (list === null)
            return;

        const nCount = list.getElementsByClassName("card-hand").length;
        if (nCount < nLen || nLen === -1)
            MeccgApi.send("/game/arda/draw", { type : type });
        else
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "Hand already holds " + nLen + " cards." }));
    },

    onDrawSingleCard : function(container, cardCode, uuid, type)
    {
        if (container === null || uuid === "")
            return;
    
        const _code = g_Game.CardList.getSafeCode(cardCode);
        const _img = g_Game.CardList.getImage(cardCode);

        if (container.querySelector("#arda-hand-card-" + uuid) !== null)
            return;

        container.appendChild(Arda.createHtmlElement(_code, _img, uuid, type));
        g_Game.CardPreview.addHover("arda-hand-card-" + uuid, false, true);   
    },

    onReceiveOpeningHandGeneric : function(containerId, type, jData)
    {
        const container = document.getElementById(containerId);
        if (container === null)
            return false;

        DomUtils.removeAllChildNodes(container);

        for (let elem of jData)
            Arda.onDrawSingleCard(container, elem.code, elem.uuid, type);

        return jData.length > 0;
    },

    onReceiveOpeningHandCharacters : function(jData)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        if (!Arda._hasReceivedCharacters)
        {
            Arda._hasReceivedCharacters = Arda.onReceiveOpeningHandGeneric("arda_hand_container_charackters", "charackters", jData);
            if (Arda._hasReceivedCharacters)
            {
                let div = document.getElementById("arda-action-container-randomchars");
                if (div !== null)
                {
                    DomUtils.empty(div);
                    div.classList.add("hidden");
                }

                div = document.getElementById("arda_characters_hand");
                if (div !== null)
                    div.classList.remove("hidden");
            }
        }
        else
            Arda.onReceiveOpeningHandGeneric("arda_hand_container_charackters", "charackters", jData);
    },

    onReceiveOpeningHandMinor : function(jData)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        Arda.onReceiveOpeningHandGeneric("arda_hand_container_minor", "minor", jData);
    },

    onReceiveOpeningHandMarshalingPoints : function(bIsMe, jData)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        if (bIsMe)
            Arda.onReceiveOpeningHandGeneric("arda_hand_container_mps", "mps", jData);
    },

    onDrawCard : function(bIsMe, jData)
    {
        let containerId = "";
        if (jData.hand === "minor")
            containerId = "arda_hand_container_minor";
        else if (bIsMe && jData.hand === "mps")
            containerId = "arda_hand_container_mps";
        else if (jData.hand === "charackters")
            containerId = "arda_hand_container_charackters";

        const container = containerId === "" ? null : document.getElementById(containerId);
        if (container !== null)
        {
            if (jData.clear !== undefined && jData.clear === true)
                DomUtils.removeAllChildNodes(container);

            Arda.onDrawSingleCard(container, jData.code, jData.uuid, jData.hand);
        }
    },

    onRemoveHandCard : function(uuid)
    {
        const elem = document.getElementById("arda-hand-card-" + uuid);
        if (elem !== null)
            DomUtils.remove(elem);
        else
            DomUtils.remove(document.getElementById("card_icon_nr_" + uuid));
    }
};

if ("true" === document.body.getAttribute("data-game-arda"))
{
    document.body.addEventListener("meccg-api-connected", () => Arda.init(), false);
    MeccgApi.addListener("/game/arda/hand/show", () => Arda.onShowHands());
    MeccgApi.addListener("/game/arda/hand/minor", (_bIsMe, jData) => Arda.onReceiveOpeningHandMinor(jData.list));
    MeccgApi.addListener("/game/arda/hand/characters", (_bIsMe, jData) => Arda.onReceiveOpeningHandCharacters(jData.list));
    MeccgApi.addListener("/game/arda/hand/marshallingpoints", (bIsMe, jData) => Arda.onReceiveOpeningHandMarshalingPoints(bIsMe, jData.list));
    MeccgApi.addListener("/game/arda/hand/card/remove", (_bIsMe, jData) => Arda.onRemoveHandCard(jData.uuid));  
    MeccgApi.addListener("/game/arda/draw", (bIsMe, jData) => Arda.onDrawCard(bIsMe, jData));
    MeccgApi.addListener("/game/arda/checkdraft", (_bIsMe, jData) => Arda.onCheckDraft(jData.ready, jData.characters, jData.minoritems));
    MeccgApi.addListener("/game/arda/view", (bIsMe, jData) => g_Game.TaskBarCards.onShow(bIsMe, jData));

    Arda._exchangeBox.addRoutes();
}
else
    Arda = null;
    
