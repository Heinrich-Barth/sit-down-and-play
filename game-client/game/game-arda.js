
let Arda = {

    _ready : false,
    _hasReceivedMinor : false,
    _hasReceivedMps : false,
    _hasReceivedCharacters : false,
    _idCount : 1,

    createHtmlElement: function(_code, _img, _uuid, type)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "card-hand");
        div.setAttribute("id", "arda-hand-card-" + _uuid);
        div.innerHTML = `<img decoding="async" src="${_img}" data-id="${_code}" class="card-icon">`;

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
        const to = elem.getAttribute("data-to", "hand");
        const uuid = elem.getAttribute("data-uuid");
        const code = elem.getAttribute("data-code");

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

    init : function()
    {
        if (this._ready)
            return;

        this.addCss();
        this.insertArdaContainer();

        const bAllowRecyling = this.isAdraAdmin();
        let idMps = this.createContainer("arda_mps", "mps", "Marshalling Points", 5, false, "")
        document.getElementById(idMps).classList.remove("hidden");

        let idMinor = this.createContainer("arda_minors", "minor", "Minor Item Offerings", 4, bAllowRecyling, "");
        this.createContainer("arda_characters", "charackters", "Roving Characters", 4, bAllowRecyling, idMinor);

        this.getOpeningHands();

        this._ready = true;
        MeccgApi.send("/game/arda/checkdraft", {});
    },

    getOpeningHands()
    {
        MeccgApi.send("/game/arda/hands", { });    
    },

    insertArdaContainer : function()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "arda-hand-wrapper");
        div.setAttribute("id", "arda-hand-wrapper");

        this.insertMp(div, "fa-users", "Roving Characters", "charackters", "arda_characters", "");
        this.insertMp(div, "fa-shield", "Minor Item Offerings", "minor", "arda_minors", "");
        this.insertMp(div, "fa-trophy", "Marshalling Points", "mps", "arda_mps", "");

        if (this.isAdraAdmin())
            this.insertOnceAction(div, "fa-users", "Assign random characters", "randomchars", "arda_ranom", "Assign random characters");

        document.body.appendChild(div);
    },

    isAdraAdmin : function()
    {
        return g_sLobbyToken !== "";
    },

    insertPlayerSelectIndicator : function()
    {

    },
    
    insertOnceAction : function(parent, html, title, dataType, playerId, label)
    {
        const div = this.insertMp(parent, html, title, dataType, playerId, label);
        div.querySelector("i").onclick = () =>
        { 
            DomUtils.empty(div);
            div.classList.add("hidden");
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
        a.setAttribute("title", title);
        a.setAttribute("class", "blue-box fa " + html);
        a.setAttribute("aria-hidden", "true");
        a.onclick = Arda.toogleView;

        if (label !== "")
            a.innerHTML = label;

        div.setAttribute("class", "arda-hand-container");
        div.appendChild(a);
        parent.appendChild(div);
        return div;
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

        let _sizerId = ResolveHandSizeContainer.create(div, title + " - Always resolve to", nHandSize, "cards.");
        div.getElementsByClassName("card-hands-sizer")[0].classList.add("arda-card-hands-sizer");

        let _div = document.createElement("div");
        _div.setAttribute("class", "arda-inline");
        _div.setAttribute("id", idCardList);
        div.appendChild(_div);

        _div = document.createElement("div");
        _div.setAttribute("class", "arda-inline arda-hand-card-actions " + (bRecycleOnce ? "arda-hand-card-actions-fl" : ""));

        if (bRecycleOnce)
        {
            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-recycle fa fa-recycle");
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("id", "arda-card-recycle-" + dataType);
            _a.setAttribute("data-next", sShowNextElement);
            _a.setAttribute("title", "Complete draft and reshuffle everything");
            _a.innerHTML = " Complete draft and reshuffle everything";
            _a.onclick = Arda.onRecycleDeck;
            _div.appendChild(_a);
        }

        {
            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-draw" + (bRecycleOnce ? " hidden":""));
            _a.setAttribute("id", "arda-card-draw-" + dataType);
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("data-handsize", nHandSize)
            _a.setAttribute("title", "Draw a new card");
            _a.onclick = Arda.onDrawNewCard;
            _div.appendChild(_a);
        }

        div.appendChild(_div);

        document.body.appendChild(div);

        if (_sizerId !== "")
            ResolveHandSizeFirst.create(idCardList, _sizerId,  title + " cards", ["organisation", "eotdiscard"]);

        return id;
    },

    onCheckDraft : function(bHideDraftCharacters, bHideDraftMinors)
    {
        let elem;
        
        elem = !bHideDraftCharacters ? null : document.getElementById("arda-card-recycle-charackters");
        if (elem !== null)
        {
            DomUtils.remove(elem);
            document.getElementById("arda-card-draw-charackters").classList.remove("hidden");

            elem = document.getElementById("arda_characters_hand");
            ArrayList(elem).findByClassName("arda-hand-card-actions-fl").each((_el) => _el.classList.remove("arda-hand-card-actions-fl"));
            elem.classList.remove("hidden");
        }

        elem = !bHideDraftMinors ? null : document.getElementById("arda-card-recycle-minor");
        if (elem !== null)
        {
            DomUtils.remove(elem);
            document.getElementById("arda-card-draw-minor").classList.remove("hidden");
            elem = document.getElementById("arda_minors_hand");
            ArrayList(elem).findByClassName("arda-hand-card-actions-fl").each((_el) => _el.classList.remove("arda-hand-card-actions-fl"));
            elem.classList.remove("hidden");
        }
    },

    onRecycleDeck : function(e)
    {
        let _question = createQuestionBox(function()
        {
            const target = e.target.getAttribute("data-type");
            const next = e.target.getAttribute("data-next");

            DomUtils.remove(e.target);
            document.getElementById("arda-card-draw-" + target).classList.remove("hidden");
            if (next !== "")
            {
                console.log("show next " + next);
                document.getElementById(next).classList.remove("hidden");
            }

            MeccgApi.send("/game/arda/recycle", { type: target });
        }, 
        "Do you want to reshuffle all cards into the playdeck?", 
        "All cards will be reshuffled into the playdeck and a new hand will be drawn.", 
        "Reshuffle everything", 
        "Cancel",
        "question-question-icon");

        _question.show("");
    },
    
    
    onDrawNewCard : function(e)
    {
        const elem = e.target;
        const nLen = parseInt(elem.getAttribute("data-handsize"));
        const type = elem.getAttribute("data-type");
        
        const list = document.getElementById("arda_hand_container_" + type);
        if (list === null)
            return;

        const nCount = list.getElementsByClassName("card-hand").length;
        if (nCount < nLen)
            MeccgApi.send("/game/arda/draw", { type : type });
        else
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "Hand already holds " + nLen + " cards." }));
    },

    onDrawSingleCard : function(container, cardCode, uuid, type)
    {
        if (container === null || uuid === "")
            return;
    
        var _code = g_Game.CardList.getSafeCode(cardCode);
        var _img = g_Game.CardList.getImage(cardCode);

        container.appendChild(Arda.createHtmlElement(_code, _img, uuid, type));
        g_Game.CardPreview.addHover("arda-hand-card-" + uuid, false, true);   
    },

    onReceiveOpeningHandGeneric : function(containerId, type, jData)
    {
        const container = document.getElementById(containerId);
        if (container === null)
            return false;

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
    },

    onReceiveOpeningHandMinor : function(jData)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        if (!Arda._hasReceivedMinor)
            Arda._hasReceivedMinor = Arda.onReceiveOpeningHandGeneric("arda_hand_container_minor", "minor", jData);
    },

    onReceiveOpeningHandMarshalingPoints : function(jData)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        if (!Arda._hasReceivedMps)
            Arda._hasReceivedMps = Arda.onReceiveOpeningHandGeneric("arda_hand_container_mps", "mps", jData);
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
    }
};

if (g_isArda !== undefined && g_isArda === true)
{
    document.body.addEventListener("meccg-api-connected", () => Arda.init(), false);
    MeccgApi.addListener("/game/arda/hand/minor", (bIsMe, jData) => Arda.onReceiveOpeningHandMinor(jData.list));
    MeccgApi.addListener("/game/arda/hand/characters", (bIsMe, jData) => Arda.onReceiveOpeningHandCharacters(jData.list));
    MeccgApi.addListener("/game/arda/hand/marshallingpoints", (bIsMe, jData) => Arda.onReceiveOpeningHandMarshalingPoints(jData.list));
    MeccgApi.addListener("/game/arda/hand/card/remove", (bIsMe, jData) => Arda.onRemoveHandCard(jData.uuid));  
    MeccgApi.addListener("/game/arda/draw", (bIsMe, jData) => Arda.onDrawCard(bIsMe, jData));
    MeccgApi.addListener("/game/arda/checkdraft", (bIsMe, jData) => Arda.onCheckDraft(jData.characters, jData.minoritems));
}
else
    Arda = null;
    

