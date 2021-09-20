    
function createGameBuilder(_CardList, _CardPreview, _HandCardsDraggable, _CompanyManager, _Stagingarea, _Scoring)
{
    const CardList = _CardList;
    const CardPreview = _CardPreview;
    const HandCardsDraggable = _HandCardsDraggable;
    const CompanyManager = _CompanyManager;
    const Stagingarea = _Stagingarea;
    const Scoring = _Scoring;
    
    function addToHandContainer(pElement)
    {
        document.getElementById("playercard_hand_container").appendChild(pElement);    
    }

    /**
     * Creates a Card DIV when drawn
     * @param {String} _code
     * @param {String} _img
     * @param {String} _uuid
     * @param {String} _type
     * @return {Object} DOM Element
     */
    function createHtmlElement(_code, _img, _uuid, _type)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "card-hand");
        div.setAttribute("id", "card_icon_nr_" + _uuid);
        div.setAttribute("data-uuid", _uuid);
        div.setAttribute("data-card-type", _type);
        div.setAttribute("draggable", "true");
        div.innerHTML = `<img decoding="async" src="${_img}" data-id="${_code}" class="card-icon">`;

        return div;
    }
    
    const GameBuilder = {
        
        _minuteInMillis : 60 * 1000,
        _gameStarted : 0,
        _timeStarted : 0,
        _hiddenStartPhase : false,
        _saved : { },

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
            const cont = document.getElementById("playercard_hand_container")
            const id = "card_icon_nr_" + uuid;
            return cont !== null && cont.querySelector("#" + id) !== null;
        },

        onDrawCard : function(cardCode, uuid, type)
        {
            if (uuid === "" || type === "")
                return false;
            
            if (GameBuilder.alreadyInHand(uuid))
                return;
            
            var _code = CardList.getSafeCode(cardCode);
            var _img = CardList.getImage(cardCode);

            addToHandContainer(createHtmlElement(_code, _img, uuid, type));
            
            CardPreview.addHover("card_icon_nr_" + uuid, false, true);
            
            HandCardsDraggable.initDragEventsForHandCard("card_icon_nr_", uuid, type);
            
            return true;
        },
        
        onAttachCardToCompanySite : function(companyId, code, cardUuid, state, reveal, owner)
        {                   
            let card = [{
                code : code,
                type: "hazard",
                state: 0,
                revealed : reveal,
                uuid : cardUuid,
                owner: owner
            }];
            CompanyManager.onAttachCardToCompanySites(companyId, card, true);
        },

        restoreBoard : function(jData)
        {
            var _data;
            for (var i = 0; i < jData.player.companies.length; i++)
                CompanyManager.drawCompany(true, jData.player.companies[i]);

            CompanyManager.onRemoveEmptyCompanies();

            for (var i = 0; i < jData.player.stage_hazards.length; i++)
            {
                _data = jData.player.stage_hazards[i];
                GameBuilder.onAddCardToStagingArea(true, _data.code, _data.uuid, "", _data.type, _data.state, _data.revealed, _data.owner, _data.turn);
            }
            
            for (var i = 0; i < jData.player.stage_resources.length; i++)
            {
                _data = jData.player.stage_resources[i];
                GameBuilder.onAddCardToStagingArea(true, _data.code, _data.uuid, "", _data.type, _data.state, _data.revealed, _data.owner, _data.turn);
            }
                

            for (var i = 0; i < jData.opponent.companies.length; i++)
                CompanyManager.drawCompany(false, jData.opponent.companies[i]);
            
            for (var i = 0; i < jData.opponent.stage_hazards.length; i++)
            {
                _data = jData.opponent.stage_hazards[i];
                GameBuilder.onAddCardToStagingArea(false, _data.code, _data.uuid, "", _data.type, _data.state, _data.revealed, _data.owner, _data.turn);
            }
            
            for (var i = 0; i < jData.opponent.stage_resources.length; i++)
            {
                _data = jData.opponent.stage_resources[i];
                GameBuilder.onAddCardToStagingArea(false, _data.code, _data.uuid, "", _data.type, _data.state, _data.revealed, _data.owner, _data.turn);
            }

            
            setTimeout(() => {

                DomUtils.removeNode(document.getElementById("lidles-eye"))
                document.body.dispatchEvent(new CustomEvent("meccg-api-connected", { "detail": true }));
                
            }, 1500);
        },
        
        onAddCardToStagingArea : function(bIsMe, cardCode, uuid, target, type, state, revealed, owner, turn)
        {
            if (uuid === "" || cardCode === "" || type === "")
            {
                MeccgUtils.logWarning("invalid card data");
                return false;
            }

            if (turn === undefined)
                turn = 1;
            
            var cardId = Stagingarea.onAddCardToStagingArea(bIsMe, uuid, "", cardCode, type, state, revealed, turn);
            if (bIsMe)
                HandCardsDraggable.initCardInStagingArea(cardId, "", type);
            
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
            });

            MeccgApi.addListener("/game/discardopenly", function(bIsMe, jData) 
            {
                if (bIsMe)
                    return;


                /* TODO
                jData.code;
                jData.owner;
                jData.uuid;
                */
            });

            MeccgApi.addListener("/game/add-onguard", function(bIsMe, jData)
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
                       
            MeccgApi.addListener("/game/state/save/receive", () => {});
            MeccgApi.addListener("/game/state/save/current", () => {});
            
            MeccgApi.addListener("/game/player/set-current", function(bIsMe, jData)
            {
                if (bIsMe)
                {
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

            MeccgApi.addListener("/game/roll-dices", function(bIsMe, jData)
            {
                document.body.dispatchEvent(new CustomEvent("meccg-dice-rolled", { "detail": {
                    isme : bIsMe,
                    user : jData.user,
                    first : jData.first,
                    second : jData.second,
                    total : jData.total
                } }));
            });
            
            MeccgApi.addListener("/game/card/state/set-site", function(bIsMe, jData)
            {
                var ownerId = jData.ownerId;
                var code = jData.code;
               
                if (!jData.tapped)
                    g_Game.CompanyManager.onMenuActionReadySite(ownerId, code);
                else
                    g_Game.CompanyManager.onMenuActionTapSite(ownerId, code);
            });
            
            
            MeccgApi.addListener("/game/card/state/set", function(bIsMe, jData)
            {
                var uuid = jData.uuid;
                var code = jData.code;
                var nState = jData.state;
                
                if (nState === 0)
                    g_Game.CompanyManager.onMenuActionReady(uuid, code);
                else if (nState === 90)
                    g_Game.CompanyManager.onMenuActionTap(uuid, code, false);
                else if (nState === 91)
                    g_Game.CompanyManager.onMenuActionTap(uuid, code, true);
                else if (nState === 180)
                    g_Game.CompanyManager.onMenuActionWound(uuid, code);
                else if (nState === 270)
                    g_Game.CompanyManager.onMenuActionRot270(uuid, code);
            });
            

            /* Remove cards from board */
            MeccgApi.addListener("/game/card/remove", function(bIsMe, list)
            {
                if (!bIsMe)
                    g_Game.CompanyManager.onRemoveCardsFromGame(list);
                
                g_Game.CompanyManager.onRemoveEmptyCompanies();
            });

            MeccgApi.addListener("/game/card/reveal", (bIsMe, jData) => g_Game.CompanyManager.onMenuActionRevealCard(jData.uuid, jData.reveal));          
            MeccgApi.addListener("/game/card/state/glow", (bIsMe, jData) =>g_Game.CompanyManager.onMenuActionGlow(jData.uuid));
            MeccgApi.addListener("/game/card/state/highlight", (bIsMe, jData) => g_Game.CompanyManager.onMenuActionHighlight(jData.uuid));

            MeccgApi.addListener("/game/add-to-staging-area", (bIsMe, jData) => GameBuilder.onAddCardToStagingArea(bIsMe, jData.code, jData.uuid, "", jData.type, jData.state, jData.revealed, jData.owner, jData.turn));

            MeccgApi.addListener("/game/update-deck-counter/player/generics", function(bIsMe, playload)
            {
                if (bIsMe)
                {
                    var div = document.getElementById("card_counter");
                    div.querySelector("a.discardpile span").innerHTML = playload.discard;
                    div.querySelector("a.sideboard span").innerHTML = playload.sideboard;
                    div.querySelector("a.playdeck span").innerHTML = playload.playdeck;
                    div.querySelector("a.victory span").innerHTML = playload.victory;
                    div.querySelector("a.hand span").innerHTML = playload.hand;
                }
                
                CompanyManager.updateHandSize(playload.player, playload.hand);
            });
            
            MeccgApi.addListener("/game/update-deck-counter/player/hand", function(bIsMe, jData)
            { 
                if (bIsMe)
                    document.getElementById("icon_hand").querySelector("span").innerHTML = jData.hand;
                
                CompanyManager.updateHandSize(jData.player, jData.hand, jData.playdeck);
            });
            
            MeccgApi.addListener("/game/remove-card-from-hand", function(bIsMe, jData)
            {
                var _uuid = jData;
                if (_uuid !== "" && bIsMe)
                    DomUtils.removeAllChildNodes(document.getElementById("card_icon_nr_" + _uuid));
            });

            MeccgApi.addListener("/game/time", (bIsMe, jData) => GameBuilder.onGameTime(jData));

            MeccgApi.addListener("/game/remove-card-from-board", function(bIsMe, jData)
            {
                var _uuid = jData;
                if (_uuid === "")
                    return;
                
                DomUtils.removeAllChildNodes(document.getElementById("stagecard_" + _uuid));
                DomUtils.removeAllChildNodes(document.getElementById("ingamecard_" + _uuid));
                DomUtils.removeAllChildNodes(document.getElementById("card_icon_nr_" + _uuid));
            });

            MeccgApi.addListener("/game/player/draw/company", (bIsMe, jData) => CompanyManager.drawCompany(bIsMe, jData));
            MeccgApi.addListener("/game/player/indicator", (bIsMe, jData) => CompanyManager.updateLastSeen(jData.userid, jData.connected));
            MeccgApi.addListener("/game/player/remove", (bIsMe, jData) => CompanyManager.removePlayerIndicator(jData.userid));
            
            MeccgApi.addListener("/game/remove-empty-companies", (bIsMe, jData) => CompanyManager.removeEmptyCompanies(jData));
            
            MeccgApi.addListener("/game/player/draw/locations", function(bIsMe, jData)
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
                    
                CompanyManager.drawLocations(company, start, regions, target, jData.revealed, jData.attached, jData.current_tapped, jData.target_tapped);
            });

            
            MeccgApi.addListener("/game/set-turn", (bIsMe, jData) => document.getElementById("game_turns").innerHTML = jData.turn);

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
                for (let i = 0; i < list.length; i++)
                    list[i].classList.remove("act");

                /** maybe notify on hand size */
                GameBuilder.onResolveHandNotification(sPhase);

                switch(sPhase)
                {
                    case "start":
                        if (bIsMe)
                            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "It is your turn now" }));

                        CompanyManager.onEnterStartPhase(bIsMe);
                        break;
                    case "organisation":

                        if (g_sLobbyToken !== "")
                            MeccgApi.send("/game/save", {});

                        CompanyManager.onEnterOrganisationPhase(sCurrent, bIsMe);
                        break;
                    case "movement":
                        CompanyManager.onEnterMovementHazardPhase(bIsMe);
                        break;
                    case "site":
                        CompanyManager.onEnterSitePhase(sCurrent, bIsMe);
                        break;
                    case "longevent":
                    case "eotdiscard":
                    case "eot":
                        break;

                    default:
                        return false;
                }

                
                CompanyManager.setCurrentPlayer(sCurrent, bIsMe);

                if (sPhase !== "start" && !GameBuilder._hiddenStartPhase)
                {
                    GameBuilder._hiddenStartPhase = true;
                    DomUtils.removeNode(document.getElementById("startphase_turn"));
                }
                
                /**
                 * update links in taskbar
                 */
                list = document.querySelectorAll(".taskbar .taskbar-turn");
                for (let i = 0; i < list.length; i++)
                {
                    var jThis = list[i];
                    if (jThis.getAttribute("data-phase") === sPhase)
                    {
                        jThis.classList.add("act");
                        document.querySelector(".area.area-player").setAttribute("data-turn-phase", sPhase);
                    }
                }
            });

            
            MeccgApi.addListener("/game/save", function(bIsMe, jData)
            {
                GameBuilder._saved = jData;
            });
            
            MeccgApi.addListener("/game/company/arrive", function(bIsMe, jData)
            {
                CompanyManager.onCompanyArrivesAtDestination(jData.company, true);
                GameBuilder.resolveHandNotification();
            });

            MeccgApi.addListener("/game/company/highlight", (bIsMe, jData) => CompanyManager.onCompanyArrivesAtDestination(jData.company, false));
            MeccgApi.addListener("/game/company/location/reveal", (bIsMe, jData) => CompanyManager.revealLocations(jData.company));
            
            MeccgApi.addListener("/game/score/show", function(bIsMe, jData)
            {
                if (bIsMe)
                    Scoring.showScoreSheet(jData);
            });

            MeccgApi.addListener("/game/score/show-pile", function(bIsMe, jData)
            {
                if (bIsMe)
                    Scoring.showScoreSheetCards(jData);
            });

            MeccgApi.addListener("/game/score/final", function(bIsMe, jData)
            {
                Scoring.showFinalScore(jData);
                MeccgApi.disconnect();                    
            });
            
            MeccgApi.addListener("/game/rejoin/immediately", (bIsMe, jData) => GameBuilder.restoreBoard(jData));

            MeccgApi.addListener("/game/notification", (bIsMe, jData) => 
            {
                if (jData.type === "warning")
                    document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": jData.message }));
                else if (jData.type === "error")
                    document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": jData.message }));
                else if (jData.type === "success")
                    document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": jData.message }));
            });
        },
                                
        queryConnectionStatus : function()
        {
            CompanyManager.clearLastSeen();
            MeccgApi.send("/game/player/time", {});
        },
        
        onDisconnected : () => CompanyManager.updateLastSeen(MeccgPlayers.getChallengerId(), false),
        onConnected : () => CompanyManager.updateLastSeen(MeccgPlayers.getChallengerId(), true),
        onError : (error) => console.error('There has been a problem with your fetch operation:', error)
    };

    MeccgApi.setOnReconnectAttempt(GameBuilder.onDisconnected);
    MeccgApi.setOnConnected(GameBuilder.onConnected);

    GameBuilder.initRestEndpoints();

    return GameBuilder;
}
