const GameBuilder = {
        
    _minuteInMillis : 60 * 1000,
    _gameStarted : 0,
    _timeStarted : 0,
    _hiddenStartPhase : false,
    _saved : { },
    _isVisitor : false,

    CardList : null,
    CardPreview : null,
    HandCardsDraggable : null,
    CompanyManager : null,
    Stagingarea : null,
    Scoring : null,

    createGameBuilder : function(_CardList_, _CardPreview_, _HandCardsDraggable_, _CompanyManager_, _Stagingarea_, _Scoring_)
    {
        GameBuilder.CardList = _CardList_;
        GameBuilder.CardPreview = _CardPreview_;
        GameBuilder.HandCardsDraggable = _HandCardsDraggable_;
        GameBuilder.CompanyManager = _CompanyManager_;
        GameBuilder.Stagingarea = _Stagingarea_;
        GameBuilder.Scoring = _Scoring_;
        GameBuilder._isVisitor = document.body.getAttribute("data-is-watcher") === "true";

        document.body.addEventListener("meccg-connected", GameBuilder.onConnected.bind(GameBuilder));
        document.body.addEventListener("meccg-disconnected", GameBuilder.onDisconnected.bind(GameBuilder));
        
        GameBuilder.initRestEndpoints();
    },

    isVisitor : function()
    {
        return GameBuilder._isVisitor;
    },

    addToHandContainer : function(pElement)
    {
        document.getElementById("playercard_hand_container").appendChild(pElement);    
    },

    _onClickDiscardHandCard : function(e)
    {
        const sUuid = e.target.getAttribute("data-card-uuid");

        if (sUuid !== null && sUuid !== undefined && sUuid !== "")
        {
            MeccgApi.send("/game/card/move", { uuid: sUuid, target: "discardpile", drawTop: false });
            DomUtils.removeNode(document.getElementById("card_icon_nr_" + sUuid));
        }

        return false;
    },

    /**
     * Creates a Card DIV when drawn
     * @param {String} _code
     * @param {String} _img
     * @param {String} _uuid
     * @param {String} _type
     * @return {Object} DOM Element
     */
    createHtmlElement: function(_code, _img, _uuid, _type)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "card-hand pos-rel");
        div.setAttribute("id", "card_icon_nr_" + _uuid);
        div.setAttribute("data-uuid", _uuid);
        div.setAttribute("data-card-type", _type);
        div.setAttribute("draggable", "true");

        const img = document.createElement("img");
        img.setAttribute("decoding", "async");
        img.setAttribute("src", _img);
        img.setAttribute("data-id", _code);
        img.setAttribute("class", "card-icon");

        const linkA = document.createElement("a");
        linkA.setAttribute("href", "#");
        linkA.setAttribute("class", "discardpile");
        linkA.setAttribute("data-card-uuid", _uuid);
        linkA.setAttribute("title", "Move to top of discard pile");
        linkA.onclick = GameBuilder._onClickDiscardHandCard;

        div.appendChild(img);
        div.appendChild(linkA);
        
        return div;
    },

    getSavedGame : function()
    {
        return this._saved;
    },
    
    onGameTime : function(jData)
    {
        let _online = typeof jData === "undefined" || jData.time < 0 ? 0 : jData.time;
        let nOffset = new Date(_online).getTimezoneOffset() * GameBuilder._minuteInMillis;

        GameBuilder._gameStarted = new Date(_online + nOffset).getTime();
        GameBuilder._timeStarted = new Date().getTime();
        GameBuilder.onCalcTime();
        setInterval(GameBuilder.onCalcTime, GameBuilder._minuteInMillis); /* every minute */
    },
    
    onCalcTime : function()
    {
        /* total milliseconds since the game has started */
        let lDiff = (new Date().getTime() - GameBuilder._timeStarted) + GameBuilder._gameStarted;
        let pDate = new Date(lDiff);
        
        let lHours = pDate.getHours();
        let lMins = pDate.getMinutes();
        
        let sVal = lHours < 10 ? "0" : "";
        sVal += lHours + ":";
        
        if (lMins < 10)
            sVal += "0";
        
        document.getElementById("game_time").innerHTML = sVal + lMins;
    },

    alreadyInHand: function(uuid)
    {
        return document.getElementById("card_icon_nr_" + uuid) !== null;
    },

    onClearHandVisitor : function()
    {
        const list = document.getElementsByClassName("visitor-hand-view");
        if (list === null || list.length === 0)
            return;

        for (let elem of list)
            DomUtils.removeAllChildNodes(elem);
    },

    onDrawCardVisitor : function(playerid, cardCode, uuid, type)
    {
        if (uuid === "" || type === "" || GameBuilder.alreadyInHand(uuid))
            return;
        
        const _code = GameBuilder.CardList.getSafeCode(cardCode);
        const _img = GameBuilder.CardList.getImage(cardCode);

        const container = document.getElementById("playercard_hand_container_" + playerid);
        if (container !== null)
        {
            container.appendChild(GameBuilder.createHtmlElement(_code, _img, uuid, type));
            GameBuilder.CardPreview.addHover("card_icon_nr_" + uuid, false, true);
        }
    },

    onDrawCard : function(cardCode, uuid, type)
    {
        if (uuid === "" || type === "" || GameBuilder.alreadyInHand(uuid))
            return;
        
        const _code = GameBuilder.CardList.getSafeCode(cardCode);
        const _img = GameBuilder.CardList.getImage(cardCode);

        GameBuilder.addToHandContainer(GameBuilder.createHtmlElement(_code, _img, uuid, type));
        GameBuilder.CardPreview.addHover("card_icon_nr_" + uuid, false, true);
        GameBuilder.HandCardsDraggable.initDragEventsForHandCard("card_icon_nr_", uuid, type);
    },

    onRestoreHand: function(cards)
    {
        const container = document.getElementById("playercard_hand");
        if (container === null)
            return;

        const hand = document.getElementById("playercard_hand_container");
        if (hand !== null)
        {
            DomUtils.removeAllChildNodes(hand);
            for (let card of cards)
                this.onDrawCard(card.code, card.uuid, card.type);    
        }
    },
    
    onAttachCardToCompanySite : function(companyId, code, cardUuid, _state, reveal, owner)
    {                   
        const card = [{
            code : code,
            type: "hazard",
            state: 0,
            revealed : reveal,
            uuid : cardUuid,
            owner: owner
        }];
        GameBuilder.CompanyManager.onAttachCardToCompanySites(companyId, card, true);
    },

    restoreBoard : function(jData)
    {
        for (let company of jData.player.companies)
            GameBuilder.CompanyManager.drawCompany(true, company);

        GameBuilder.CompanyManager.onRemoveEmptyCompanies();

        for (let _data of jData.player.stage_hazards)
            GameBuilder.onAddCardToStagingArea(true, _data.code, _data.uuid, _data.type, _data.state, _data.revealed, _data.turn, _data.token, _data.secondary);
        
        for (let _data of jData.player.stage_resources)
            GameBuilder.onAddCardToStagingArea(true, _data.code, _data.uuid, _data.type, _data.state, _data.revealed, _data.turn, _data.token, _data.secondary);

        for (let _data of jData.opponent.companies)
            GameBuilder.CompanyManager.drawCompany(false, _data);
        
        for (let _data of jData.opponent.stage_hazards)
            GameBuilder.onAddCardToStagingArea(false, _data.code, _data.uuid, _data.type, _data.state, _data.revealed, _data.turn, _data.token, _data.secondary);
        
        for (let _data of jData.opponent.stage_resources)
            GameBuilder.onAddCardToStagingArea(false, _data.code, _data.uuid, _data.type, _data.state, _data.revealed, _data.turn, _data.token, _data.secondary);
        
        setTimeout(() => {

            DomUtils.removeNode(document.getElementById("lidles-eye"));
            document.body.dispatchEvent(new CustomEvent("meccg-api-connected", { "detail": true }));
            document.body.dispatchEvent(new CustomEvent("meccg-sfx-ready", { "detail": true }));
            
        }, 500);
    },
    
    onAddCardToStagingArea : function(bIsMe, cardCode, uuid, type, state, revealed, turn, token, secondary)
    {
        const cardId = GameBuilder.Stagingarea.onAddCardToStagingArea(bIsMe, uuid, cardCode, type, state, revealed, turn, token, secondary);
        if (cardId === "")
            return false;
        else if (bIsMe)
            GameBuilder.HandCardsDraggable.initCardInStagingArea(cardId, "", type);
        
        return true;
    },

    onResolveHandNotification : function(sPhase)
    {
        switch(sPhase)
        {
            case "organisation":
            case "site":
            case "eotdiscard":
                GameBuilder.resolveHandNotification(sPhase);
                break;

            default:
                break;
        }
    },

    resolveHandNotification : function(sPhase)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-check-handsize", { "detail": sPhase }));
    },

    initRestEndpoints : function()
    {            
        document.getElementById("draw_card").onclick = (e) =>
        {
            MeccgApi.send("/game/card/draw/single");
            e.stopPropagation();
            return false;
        };

        MeccgApi.addListener("/game/card/draw", function(bIsMe, jData)
        {
            if (bIsMe)
                GameBuilder.onDrawCard(jData.code, jData.uuid, jData.type);
            else if (GameBuilder.isVisitor())
                GameBuilder.onDrawCardVisitor(jData.playerid, jData.code, jData.uuid, jData.type);

            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "drawcard" }));
        });

        MeccgApi.addListener("/game/watch/hand", function(_bIsMe, jData)
        {
            if (!GameBuilder.isVisitor())
                return;

            GameBuilder.onClearHandVisitor();
            for (let card of jData.cards)
                GameBuilder.onDrawCardVisitor(card.owner, card.code, card.uuid, card.type);
        });

        MeccgApi.addListener("/game/card/hand", function(bIsMe, jData)
        {
            if (bIsMe)
                GameBuilder.onRestoreHand(jData.cards);
        });

        
        MeccgApi.addListener("/game/sfx", (_bIsMe, jData) => document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": jData.type })));

        MeccgApi.addListener("/game/discardopenly", () => { /** fallback */ });

        MeccgApi.addListener("/game/add-onguard", function(_bIsMe, jData)
        {
            GameBuilder.onAttachCardToCompanySite(jData.company, jData.code, jData.uuid, jData.state, jData.revealed, jData.owner);
        });


        MeccgApi.addListener("/game/view-cards/list", function(bIsMe, jData)
        {
            if (bIsMe)
                g_Game.TaskBarCards.onShow(bIsMe, jData);
        });
        
        MeccgApi.addListener("/game/view-cards/reveal/list", (bIsMe, jData) => g_Game.TaskBarCards.onShowOnOffer(bIsMe, jData));
        MeccgApi.addListener("/game/view-cards/list/close", () => g_Game.TaskBarCards.hideOffer());
        
        MeccgApi.addListener("/game/view-cards/reveal/reveal", function(bIsMe, jData)
        {
            if (!bIsMe)
                g_Game.TaskBarCards.onShowOnOfferReveal(jData.uuid);
        });
        
        MeccgApi.addListener("/game/view-cards/reveal/remove", function(bIsMe, jData)
        {
            if (!bIsMe)
                g_Game.TaskBarCards.onShowOnOfferRemove(jData.uuid);
        });
                   
        MeccgApi.addListener("/game/state/save/receive", () => { /** fallback */});
        MeccgApi.addListener("/game/state/save/current", () => { /** fallback */});
        
        MeccgApi.addListener("/game/player/set-current", function(bIsMe, jData)
        {
            if (bIsMe)
            {
                document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "yourturn" }));
                document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "It is your turn now." }));
                return;
            }
            
            let sName = jData.displayname;
            if (typeof sName === "undefined" || sName.indexOf(">") !== -1 || sName.indexOf("<") !== -1)
                return;
            else if (sName.length > 40)
                sName = sName.substring(0, 39);
            
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": sName + " is the active player." }));

        });
        
        MeccgApi.addListener("/game/lobby/request", function()
        {
            if (GamePreferences.autoOpenLobby())
                document.getElementById("lobby-wrapper").dispatchEvent(new Event('click'));
            else
                document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "A player is in the lobby" }));
        });

        MeccgApi.addListener("/game/dices/roll", function(bIsMe, jData)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-dice-rolled", { "detail": {
                isme : bIsMe,
                user : jData.user,
                first : jData.first,
                second : jData.second,
                total : jData.total,
                dice : jData.dice
            } }));

            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "dice" }));
        });
        
        MeccgApi.addListener("/game/card/state/set-site", function(_bIsMe, jData)
        {
            const ownerId = jData.ownerId;
            const code = jData.code;
           
            if (!jData.tapped)
                GameBuilder.CompanyManager.onMenuActionReadySite(ownerId, code);
            else
                GameBuilder.CompanyManager.onMenuActionTapSite(ownerId, code);
        });
        
        
        MeccgApi.addListener("/game/card/token", function(_bIsMe, jData)
        {
            const uuid = jData.uuid === undefined ? "" : jData.uuid;
            const count = jData.count === undefined ? 0 : jData.count;
            const elem = document.querySelector('div.card[data-uuid="' + uuid + '"]');
            if (elem !== null)
            {
                if (count > 0)
                    elem.setAttribute("data-token", count);
                else if (elem.hasAttribute("data-token"))
                    elem.removeAttribute("data-token");
            }
        });
        
        MeccgApi.addListener("/game/card/state/set", function(_bIsMe, jData)
        {
            const uuid = jData.uuid;
            const code = jData.code;
            const nState = jData.state;
            
            if (nState === 0)
                GameBuilder.CompanyManager.onMenuActionReady(uuid, code);
            else if (nState === 90)
                GameBuilder.CompanyManager.onMenuActionTap(uuid, code, false);
            else if (nState === 91)
                GameBuilder.CompanyManager.onMenuActionTap(uuid, code, true);
            else if (nState === 180)
                GameBuilder.CompanyManager.onMenuActionWound(uuid, code);
            else if (nState === 270)
                GameBuilder.CompanyManager.onMenuActionRot270(uuid, code);
        });
        

        /* Remove cards from board */
        MeccgApi.addListener("/game/card/remove", function(bIsMe, list)
        {
            if (!bIsMe)
                GameBuilder.CompanyManager.onRemoveCardsFromGame(list);
            
            GameBuilder.CompanyManager.onRemoveEmptyCompanies();
        });

        MeccgApi.addListener("/game/card/reveal", (_bIsMe, jData) => GameBuilder.CompanyManager.onMenuActionRevealCard(jData.uuid, jData.reveal));          
        MeccgApi.addListener("/game/card/state/glow", (_bIsMe, jData) =>GameBuilder.CompanyManager.onMenuActionGlow(jData.uuid));
        MeccgApi.addListener("/game/card/state/highlight", (_bIsMe, jData) => GameBuilder.CompanyManager.onMenuActionHighlight(jData.uuid));

        MeccgApi.addListener("/game/add-to-staging-area", (bIsMe, jData) => GameBuilder.onAddCardToStagingArea(bIsMe, jData.code, jData.uuid, jData.type, jData.state, jData.revealed, jData.turn, jData.token, jData.secondary));

        MeccgApi.addListener("/game/update-deck-counter/player/generics", function(bIsMe, playload)
        {
            if (bIsMe)
            {
                const div = document.getElementById("card_counter");
                div.querySelector("a.discardpile span").innerHTML = playload.discard;
                div.querySelector("a.sideboard span").innerHTML = playload.sideboard;
                div.querySelector("a.playdeck span").innerHTML = playload.playdeck;
                div.querySelector("a.victory span").innerHTML = playload.victory;
                div.querySelector("a.hand span").innerHTML = playload.hand;
            }
            
            GameBuilder.CompanyManager.updateHandSize(playload.player, playload.hand, playload.playdeck);
        });
        
        MeccgApi.addListener("/game/update-deck-counter/player/hand", function(bIsMe, jData)
        { 
            if (bIsMe)
            {
                document.getElementById("icon_hand").querySelector("span").innerText = jData.hand;
                GameBuilder.HandCardsDraggable.checkReDeckNoteForPlayer(jData.playdeck);
            }
            
            GameBuilder.CompanyManager.updateHandSize(jData.player, jData.hand, jData.playdeck);
        });
        
        MeccgApi.addListener("/game/remove-card-from-hand", function(bIsMe, jData)
        {
            const _uuid = jData;
            if (_uuid !== "" && (bIsMe || GameBuilder.isVisitor()))
                DomUtils.removeAllChildNodes(document.getElementById("card_icon_nr_" + _uuid));
        });

        MeccgApi.addListener("/game/time", (_bIsMe, jData) => GameBuilder.onGameTime(jData));

        MeccgApi.addListener("/game/remove-card-from-board", function(_bIsMe, jData)
        {
            const _uuid = jData;
            if (_uuid === "")
                return;
            
            DomUtils.removeAllChildNodes(document.getElementById("stagecard_" + _uuid));
            DomUtils.removeAllChildNodes(document.getElementById("ingamecard_" + _uuid));
            DomUtils.removeAllChildNodes(document.getElementById("card_icon_nr_" + _uuid));
        });

        MeccgApi.addListener("/game/player/draw/company", (bIsMe, jData) => GameBuilder.CompanyManager.drawCompany(bIsMe, jData));
        MeccgApi.addListener("/game/player/indicator", (_bIsMe, jData) => GameBuilder.CompanyManager.updateLastSeen(jData.userid, jData.connected));
        MeccgApi.addListener("/game/player/remove", (_bIsMe, jData) => GameBuilder.CompanyManager.removePlayerIndicator(jData.userid));
        
        MeccgApi.addListener("/game/remove-empty-companies", (_bIsMe, jData) => GameBuilder.CompanyManager.removeEmptyCompanies(jData));
        
        MeccgApi.addListener("/game/player/draw/locations", function(_bIsMe, jData)
        {
            let company = jData.company;
            let start = jData.start;
            let target = jData.target;
            let regions = jData.regions;
            
            if (start === undefined)
                start = "";

            if (target === undefined)
                target = "";

            if (regions === undefined)
                regions = [];

            if (company === undefined)
                company = "";
                
            GameBuilder.CompanyManager.drawLocations(company, start, regions, target, jData.revealed, jData.attached, jData.current_tapped, jData.target_tapped, jData.revealStart);
        });

        
        MeccgApi.addListener("/game/set-turn", (_bIsMe, jData) => document.getElementById("game_turns").innerHTML = jData.turn);

        MeccgApi.addListener("/game/set-phase", function(bIsMe, jData)
        {
            const sPhase = jData.phase;
            const sCurrent = jData.currentplayer;
            
            const jTaskbar = document.querySelector(".taskbar");
            if (bIsMe)
                jTaskbar.classList.remove("turn-opponent");
            else if (!jTaskbar.classList.contains("turn-opponent"))
                jTaskbar.classList.add("turn-opponent");
            
            let list = jTaskbar.querySelectorAll("a");
            for (let elem of list)
                elem.classList.remove("act");

            /** maybe notify on hand size */
            GameBuilder.onResolveHandNotification(sPhase);

            switch(sPhase)
            {
                case "start":
                    if (bIsMe)
                        document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "It is your turn now" }));

                    GameBuilder.CompanyManager.onEnterStartPhase(bIsMe);
                    break;
                case "organisation":

                    GameBuilder.CompanyManager.onEnterOrganisationPhase(sCurrent, bIsMe);

                    break;
                case "movement":
                    GameBuilder.CompanyManager.onEnterMovementHazardPhase(bIsMe);
                    break;
                case "site":
                    GameBuilder.CompanyManager.onEnterSitePhase(sCurrent, bIsMe);
                    break;
                case "longevent":
                case "eotdiscard":
                case "eot":
                    break;

                default:
                    return false;
            }

            
            GameBuilder.CompanyManager.setCurrentPlayer(sCurrent, bIsMe);

            if (sPhase !== "start" && !GameBuilder._hiddenStartPhase)
            {
                GameBuilder._hiddenStartPhase = true;
                DomUtils.removeNode(document.getElementById("startphase_turn"));
            }
            
            /**
             * update links in taskbar
             */
            list = document.querySelectorAll(".taskbar .taskbar-turn");
            for (let jThis of list)
            {
                if (jThis.getAttribute("data-phase") === sPhase)
                {
                    jThis.classList.add("act");
                    document.querySelector(".area.area-player").setAttribute("data-turn-phase", sPhase);
                }
            }

            if (bIsMe)
                document.body.dispatchEvent(new CustomEvent("meccg-event-phase", { "detail": sPhase }));

        });

        MeccgApi.addListener("/game/company/arrive", function(_bIsMe, jData)
        {
            GameBuilder.CompanyManager.onCompanyArrivesAtDestination(jData.company, true);
            GameBuilder.resolveHandNotification();
        });

        MeccgApi.addListener("/game/company/highlight", (_bIsMe, jData) => GameBuilder.CompanyManager.onCompanyArrivesAtDestination(jData.company, false));
        MeccgApi.addListener("/game/company/location/reveal", (_bIsMe, jData) => GameBuilder.CompanyManager.revealLocations(jData.company));
        
        MeccgApi.addListener("/game/score/show", function(bIsMe, jData)
        {
            if (bIsMe)
                GameBuilder.Scoring.showScoreSheet(jData);
        });

        MeccgApi.addListener("/game/score/watch", function(_bIsMe, jData)
        {
            GameBuilder.Scoring.showScoreSheetWatch(jData);
        });

        MeccgApi.addListener("/game/score/show-pile", function(bIsMe, jData)
        {
            if (bIsMe)
                GameBuilder.Scoring.showScoreSheetCards(jData);
        });

        MeccgApi.addListener("/game/score/final", function(_bIsMe, jData)
        {
            MeccgApi.disconnect();                    
            GameBuilder.Scoring.showFinalScore(jData.score, jData.stats);
            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "endgame" }));
        });
        
        MeccgApi.addListener("/game/rejoin/immediately", (_bIsMe, jData) => GameBuilder.restoreBoard(jData));

        MeccgApi.addListener("/game/notification", (_bIsMe, jData) => 
        {
            if (jData.type === "warning")
                document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": jData.message }));
            else if (jData.type === "error")
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": jData.message }));
            else if (jData.type === "success")
                document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": jData.message }));
        });

        MeccgApi.addListener("/game/hand/clear", () => DomUtils.removeAllChildNodes(document.getElementById("playercard_hand_container")));
    },
                            
    queryConnectionStatus : function()
    {
        GameBuilder.CompanyManager.clearLastSeen();
        MeccgApi.send("/game/player/time", {});
    },
    
    onDisconnected : () => GameBuilder.CompanyManager.updateLastSeen(MeccgPlayers.getChallengerId(), false),
    onConnected : () => GameBuilder.CompanyManager.updateLastSeen(MeccgPlayers.getChallengerId(), true),
    onError : (error) => console.error('There has been a problem with your fetch operation:', error)
};

