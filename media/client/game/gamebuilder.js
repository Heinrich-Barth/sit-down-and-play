    
function createGameBuilder(_CardList, _CardPreview, _HandCardsDraggable, _MeccgApi, _CompanyManager, _Stagingarea, _Scoring)
{
    const CardList = _CardList;
    const CardPreview = _CardPreview;
    const HandCardsDraggable = _HandCardsDraggable;
    const MeccgApi = _MeccgApi;
    const CompanyManager = _CompanyManager;
    const Stagingarea = _Stagingarea;
    const Scoring = _Scoring;

    var _drawCardTpl = jQuery("#card-hand-tpl").html();
    
    function addToHandContainer(html)
    {
        if (html !== "")
            jQuery("#playercard_hand_container").append(html);
    }

    /**
     * Creates a Card DIV when drawn
     * @param {String} _code
     * @param {String} _img
     * @param {String} _uuid
     * @param {String} _type
     * @return {String}
     */
    function createHtmlElement(_code, _img, _uuid, _type)
    {
        return _drawCardTpl.replace("/media/assets/images/black.png", _img)
                           .replace("{card-code}", _code)
                           .replace("{uuid1}", _uuid)
                           .replace("{uuid2}", _uuid)
                           .replace("{type}", _type);
    }
    
    const GameBuilder = {
        
        _minuteInMillis : 60 * 1000,
        _gameStarted : 0,
        _timeStarted : 0,
        _question : null,
        _hiddenStartPhase : false,
        
        onGameTime : function(jData)
        {
            let _online = typeof jData === "undefined" || jData.time < 0 ? 0 : jData.time;
            let nOffset = new Date(_online).getTimezoneOffset() * GameBuilder._minuteInMillis;

            GameBuilder._gameStarted = new Date(_online + nOffset).getTime();
            GameBuilder._timeStarted = new Date().getTime();
            GameBuilder.onCalcTime();
            setInterval(GameBuilder.onCalcTime, GameBuilder._minuteInMillis); // every minute
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
            
            jQuery("#game_time").html(sVal + lMins);
        },

        onDrawCard : function(cardCode, uuid, type)
        {
            if (uuid === "" || type === "")
                return false;
            
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

            for (var i = 0; i < jData.player.stage_hazards.length; i++)
            {
                _data = jData.player.stage_hazards[i];
                GameBuilder.onAddCardToStagingArea(true, _data.code, _data.uuid, "", _data.type, _data.state, _data.revealed, _data.owner);
            }
            
            for (var i = 0; i < jData.player.stage_resources.length; i++)
            {
                _data = jData.player.stage_resources[i];
                GameBuilder.onAddCardToStagingArea(true, _data.code, _data.uuid, "", _data.type, _data.state, _data.revealed, _data.owner);
            }
                

            for (var i = 0; i < jData.opponent.companies.length; i++)
                CompanyManager.drawCompany(false, jData.opponent.companies[i]);
            
            for (var i = 0; i < jData.opponent.stage_hazards.length; i++)
            {
                _data = jData.opponent.stage_hazards[i];
                GameBuilder.onAddCardToStagingArea(false, _data.code, _data.uuid, "", _data.type, _data.state, _data.revealed, _data.owner);
            }
            
            for (var i = 0; i < jData.opponent.stage_resources.length; i++)
            {
                _data = jData.opponent.stage_resources[i];
                GameBuilder.onAddCardToStagingArea(false, _data.code, _data.uuid, "", _data.type, _data.state, _data.revealed, _data.owner);
            }

            GameBuilder._question = createQuestionBox(function()
            {
                GameBuilder._question.remove();
                GameBuilder._question = null;

                window.open('https://meet.jit.si/' + g_sRoom, "_blank");

            }, 
            "Do you want to join the audio chat?", 
            "The chat will open in a new window and you have to actively confirm to join the meeting there.<br><br>You can join via the main menu as well anytime later.", 
            "Join audio", 
            "Do not join",
            "question-voice-icon");
            
            setTimeout(function()
            { 
                jQuery("#lidles-eye").remove(); 
                GameBuilder._question.show("");

            }, 1500);
        },
        
        onAddCardToStagingArea : function(bIsMe, cardCode, uuid, target, type, state, revealed)
        {
            if (uuid === "" || cardCode === "" || type === "")
            {
                console.log("invalid card data");
                return false;
            }
            
            var cardId = Stagingarea.onAddCardToStagingArea(bIsMe, uuid, "", cardCode, type, state, revealed);
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
                    GameBuilder.resolveHandNotification();
                    break;

                default:
                    break;
            }
        },

        resolveHandNotification : function()
        {
            document.body.dispatchEvent(new CustomEvent("meccg-check-handsize", { "detail": "" }));
        },

        initRestEndpoints : function()
        {            
            
            jQuery("#draw_card")[0].onclick = (e) =>
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
            
            MeccgApi.addListener("/game/view-cards/reveal/list", function(bIsMe, jData)
            {
                g_Game.TaskBarCards.onShowOnOffer(bIsMe, jData);
            });

            MeccgApi.addListener("/game/view-cards/list/close", function(bIsMe, jData)
            {
                g_Game.TaskBarCards.hideOffer();
            });
            
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
                       
            MeccgApi.addListener("/game/state/save/receive", function(bIsMe, jData)
            {
            });
                       
            MeccgApi.addListener("/game/state/save/current", function(bIsMe, jData)
            {
            });
            
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
                if (Preferences.autoOpenLobby())
                    jQuery("#lobby-wrapper").click();
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
            
            MeccgApi.addListener("/game/card/reveal", function(bIsMe, jData)
            {
                g_Game.CompanyManager.onMenuActionRevealCard(jData.uuid, jData.reveal);
            });

            /* Remove cards from board */
            MeccgApi.addListener("/game/card/remove", function(bIsMe, list)
            {
                if (!bIsMe)
                    g_Game.CompanyManager.onRemoveCardsFromGame(list);
                
                g_Game.CompanyManager.onRemoveEmptyCompanies();
            });

            
            MeccgApi.addListener("/game/card/state/glow", function(bIsMe, jData)
            {
                g_Game.CompanyManager.onMenuActionGlow(jData.uuid);
            });

            MeccgApi.addListener("/game/card/state/highlight", function(bIsMe, jData)
            {
                g_Game.CompanyManager.onMenuActionHighlight(jData.uuid);
            });

            MeccgApi.addListener("/game/add-to-staging-area", function(bIsMe, jData)
            {
                GameBuilder.onAddCardToStagingArea(bIsMe, jData.code, jData.uuid, "", jData.type, jData.state, jData.revealed, jData.owner);
            });

            MeccgApi.addListener("/game/update-deck-counter/player/generics", function(bIsMe, playload)
            {
                if (bIsMe)
                {
                    var div = jQuery("#card_counter");
                    div.find("a.discardpile span").html(playload.discard);
                    div.find("a.sideboard span").html(playload.sideboard);
                    div.find("a.playdeck span").html(playload.playdeck);
                    div.find("a.victory span").html(playload.victory);
                    div.find("a.hand span").html(playload.hand);
                }
                
                CompanyManager.updateHandSize(playload.player, playload.hand);
            });
            
            MeccgApi.addListener("/game/update-deck-counter/player/hand", function(bIsMe, jData)
            { 
                if (bIsMe)
                    jQuery("#icon_hand span").html(jData.hand);
                
                CompanyManager.updateHandSize(jData.player, jData.hand, jData.playdeck);
            });
            
            MeccgApi.addListener("/game/remove-card-from-hand", function(bIsMe, jData)
            {
                var _uuid = jData;
                if (_uuid === "")
                    return;

                if (bIsMe)
                {
                    var elem = document.getElementById("card_icon_nr_" + _uuid);
                    if (elem !== null)
                        unbindAndRemove(jQuery(elem));
                }
            });
            MeccgApi.addListener("/game/set-current-player", function(bIsMe, jData)
            {
                console.log("---- deprecated");
            });
            
            MeccgApi.addListener("/game/time", function(bIsMe, jData)
            {
                GameBuilder.onGameTime(jData);
            });

            MeccgApi.addListener("/game/remove-card-from-board", function(bIsMe, jData)
            {
                var _uuid = jData;
                if (_uuid === "")
                    return;
                
                var elem;
                elem = document.getElementById("stagecard_" + _uuid);
                if (elem !== null)
                    unbindAndRemove(jQuery(elem));
                
                elem = document.getElementById("ingamecard_" + _uuid);
                if (elem !== null)
                    unbindAndRemove(jQuery(elem));
                
                elem = document.getElementById("card_icon_nr_" + _uuid);
                if (elem !== null)
                    unbindAndRemove(jQuery(elem));
            });

            MeccgApi.addListener("/game/player/draw/company", function(bIsMe, jData)
            {
                CompanyManager.drawCompany(bIsMe, jData);
            });

            MeccgApi.addListener("/game/player/indicator", function(bIsMe, jData)
            {
                CompanyManager.updateLastSeen(jData.userid, jData.connected);
            });
            
            MeccgApi.addListener("/game/remove-empty-companies", function(bIsMe, jData)
            {
                CompanyManager.removeEmptyCompanies(jData);
            });
            
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
            
            MeccgApi.addListener("/game/set-phase", function(bIsMe, jData)
            {
                const sPhase = jData.phase;
                const sCurrent = jData.currentplayer;
                
                const jTaskbar = jQuery(".taskbar");
                if (bIsMe)
                    jTaskbar.removeClass("turn-opponent");
                else if (!jTaskbar.hasClass("turn-opponent"))
                    jTaskbar.addClass("turn-opponent");
                
                jTaskbar.find("a").removeClass("act");

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
                        MeccgApi.send("/game/state/save/current", {});
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
                    jQuery("#startphase_turn").remove();
                }
                
                /**
                 * update links in taskbar
                 */
                jQuery(".taskbar .taskbar-turn").each(function()
                {
                    var jThis = jQuery(this);
                    if (jThis.attr("data-phase") === sPhase)
                    {
                        jThis.addClass("act");
                        jQuery(".area area-player").attr("data-turn-phase", sPhase);
                    }
                });
            });
            
            MeccgApi.addListener("/game/company/arrive", function(bIsMe, jData)
            {
                CompanyManager.onCompanyArrivesAtDestination(jData.company, true);
                GameBuilder.resolveHandNotification();
            });

            MeccgApi.addListener("/game/company/highlight", function(bIsMe, jData)
            {
                CompanyManager.onCompanyArrivesAtDestination(jData.company, false);
            });

            MeccgApi.addListener("/game/company/location/reveal", function(bIsMe, jData)
            {
                CompanyManager.revealLocations(jData.company);
            });
            
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
            
            MeccgApi.addListener("/game/rejoin/immediately", function(bIsMe, jData)
            {
                GameBuilder.restoreBoard(jData);
            });

        },
        
                                
        queryConnectionStatus : function()
        {
            CompanyManager.clearLastSeen();
            MeccgApi.send("/game/player/time", {});
        },
        
        onDisconnected : function()
        {
            CompanyManager.updateLastSeen(MeccgApi.getMyId(), false);
        },
        
        onConnected : function()
        {
            CompanyManager.updateLastSeen(MeccgApi.getMyId(), true);
        },

        onError : function(error)
        {
            console.error('There has been a problem with your fetch operation:', error);
        }
    };

    MeccgApi.onPlayerListReceived = function(sMyId, jNameMap)
    {
        CompanyManager.addPlayers(sMyId, jNameMap);
        Scoring.addPlayers(sMyId, jNameMap);
        
        document.body.dispatchEvent(new CustomEvent("meccg-dice-players", { "detail": jNameMap }));
    };

    MeccgApi.onAddPlayer = function(sMyId, jNameMap)
    {
        CompanyManager.addPlayers(sMyId, jNameMap);
        Scoring.addPlayers(sMyId, jNameMap);
        
        document.body.dispatchEvent(new CustomEvent("meccg-dice-players", { "detail": jNameMap }));
    };

    MeccgApi.setOnReconnectAttempt(GameBuilder.onDisconnected);
    MeccgApi.setOnConnected(GameBuilder.onConnected);

    GameBuilder.initRestEndpoints();

    return {

        _instance : GameBuilder
    };
}
