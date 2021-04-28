

function createCompanyManager(_CardList, _MeccgApi, _CardPreview, _HandCardsDraggable, _ContextMenu)
{
    const CardList = _CardList;
    const CardPreview = _CardPreview;
    const MeccgApi = _MeccgApi;
    const HandCardsDraggable = _HandCardsDraggable;
    const ContextMenu = _ContextMenu;

    const CARDID_PREFIX = "ingamecard_";

    function createCompanyHtml(companyId, id)
    {
        let jDiv = jQuery("<div>", {
            class: "company tableCell hiddenVisibility nonEmptyContainer",
            id: id
        });

        jDiv.attr("data-company-id", companyId);
        jDiv.html(  `<div class="company-site-list pos-rel">
                        <div class="location-icon-image location-icon location-select hiddenToOpponent" title="Organise movement">&nbsp;</div>
                        <div class="location-icon-image location-reveal hide hiddenToOpponent" title="Reveal movement">&nbsp;</div>
                        <div class="sites">
                            <div class="site-container site-current fl"></div>
                            <div class="site-container site-regions fl"></div>
                            <div class="site-container site-target fl"></div>
                            <div class="site-container site-onguard fl"></div>
                            <div class="clear"></div>
                        </div>
                    </div>
                    <div class="clear"></div>
                    <div class="company-characters-add fl"></div>
                    <div class="company-characters fl"></div>
                    <div class="clear"></div>`);
        return jDiv;
    }
 
    function createOpponentContainer(sHexPlayerCode)
    {
        let jContainer = jQuery(document.getElementById("opponent_table"));

        /* check if the container already exists  */
        let jTarget = jContainer.find("[data-player='" + sHexPlayerCode + "']");
        if (jTarget.length === 1)
            return jTarget;

        /* create new container for opponent */
        let sTpl = `<div class="col90 companies center-text" id="companies_opponent_${sHexPlayerCode}" data-player="${sHexPlayerCode}">
                        <div class="company tableCell emptyContainer create-new-company hiddenToOpponent" id="create_new_company_opponent_${sHexPlayerCode}">
                            <div class="clear"></div>
                        </div>
                    </div>`;

        jContainer.append(sTpl);
        return jContainer.find("[data-player='" + sHexPlayerCode + "']");
    }

    function insertNewcontainer(bIsPlayer, sPlayerName, sHexPlayerCode, companyId)
    {
        var id = "company_" + companyId;
        var sHtml = createCompanyHtml(companyId, id);

        if (bIsPlayer)
            jQuery(document.getElementById("create_new_company")).before(sHtml);
        else
            jContainer = createOpponentContainer(sHexPlayerCode).append(sHtml);

        return document.getElementById(id);
    }

    function createCharacterHtml(jsonCard, id)
    {
        var uuid = jsonCard.uuid;
        if (uuid === "" || id === "")
            return null;

        let jDiv = jQuery("<div>", {
            class: "company-character pos-rel fl character-is-company-host",
            id: id
        });
        jDiv.attr("data-character-uuid", uuid);

        let jCharContainer = jQuery("<div>", {
            class: "company-character-container pad10 pos-rel"
        });

        {
            let jChar1 = jQuery("<div>", {
                class: "company-character-host"
            });
            jChar1.append(createNewCard(jsonCard));
            jCharContainer.append(jChar1);
        }

        {
            let jChar1 = jQuery("<div>", {
                class: "company-character-reosurces company-character-reosurces-empty"
            });
            jCharContainer.append(jChar1);
        }
        
        jDiv.append(jCharContainer);
        jDiv.append(jQuery("<div>", {
            class: "company-character-influenced pad10"
        }));      

        return jDiv;
    }

    function getCardStateCss(nState)
    {
        if (nState === 0)
            return "state_ready";
        else if (nState === 90)
            return "state_tapped";
        else if (nState === 91)
            return "state_tapped_fixed";
        else if (nState === 180)
            return "state_wounded";
        else if (nState === 270)
            return "state_rot270";
        else
            return "";
    }

    function createNewCard(card)
    {
        if (card.uuid === "")
            return "";

        let jImage = jQuery("<img>", {
            class: "card-icon",
            src: "/media/assets/images/cards/backside.jpg"
        });

        jImage.attr("data-image-backside", "/media/assets/images/cards/backside.jpg");
        jImage.attr("data-image-path", "");
        jImage.attr("decoding", "async");
        jImage.attr("data-uuid", card.uuid);
        jImage.attr("data-img-image", CardList.getImage(card.code));
        if (typeof card.owner === "undefined" || card.owner === "")
            jImage.attr("data-owner", "");
        else
        {
            let bIsMyCard = card.owner === MeccgApi.getMyId() ? "" : "other";
            jImage.attr("data-owner", bIsMyCard);
        }
            
        jImage.attr("data-revealed", card.revealed === true ? "true" : "false");

        let jDiv = jQuery("<div>", {
            class: "card " + getCardStateCss(card.state),
            id: CARDID_PREFIX + card.uuid
        });

        jDiv.attr("data-uuid", card.uuid);
        jDiv.attr("data-card-code", CardList.getSafeCode(card.code));
        jDiv.attr("data-card-type", card.type);
        jDiv.attr("draggable", "true");
        jDiv.attr("data-revealed", card.revealed === true ? "true" : "false");
        jDiv.append(jImage);

        return jDiv;
    }

    function createLocationCard(code, img, bIsPlayer)
    {
        let sOwner = bIsPlayer ? "" : "other";
        return `<div class="card padR5 fl" draggable="false" data-card-code="${code}">
                <img src="/media/assets/images/cards/backside-region.jpeg" data-owner="${sOwner}" class="card-icon" data-img-image="${img}"  data-image-path="" data-image-backside="/media/assets/images/cards/backside.jpg">
        </div>`;
    }

    /**
     * Insert a new character container
     * @param {json} jsonCard character card
     * @param {jQuery} jTargetContainer
     * @param {boolean} bInsertBefore insert before given element (of append otherwise)
     * @param {boolean} bIsHosting Is hosting character
     * @param {boolean} isRevealed
     * @returns {jQuery} new inserted container
     */
    function insertNewCharacter(jsonCard, jTargetContainer, bInsertBefore, bIsHosting)
    {
        const id = "character_" + jsonCard.uuid;
        let jHtml = createCharacterHtml(jsonCard, id);
        if (jHtml == null)
            return jQuery("#test");

        if (!bIsHosting)
        {
            jHtml.removeClass("character-is-company-host");
            jHtml.addClass("character-is-company-follower");
        }

        if (bInsertBefore)
            jTargetContainer.before(jHtml);
        else
            jTargetContainer.append(jHtml);

        return jQuery("#" + id);
    }

    const _playerSelector = new PlayerSelector();

    var INSTANCE = {

        updateLastSeen : function(username, isOnline)
        {
            _playerSelector.updateLastSeen(username, isOnline)
        },
        
        updateHandSize : function(username, nCount, nCountPlaydeck)
        {
            _playerSelector.updateHandSize(username, nCount, nCountPlaydeck);
        },
        
        clearLastSeen : function()
        {
            _playerSelector.clearLastSeen();
        },

        character: {

            /**
             * Remove a character container from table
             * 
             * @param {string} uuid
             * @returns {void}
             */
            removeExistingCharacter: function (uuid)
            {
                let elem = document.getElementById("character_" + uuid);
                if (elem !== null)
                    jQuery(elem).remove();
            },

            addResources: function (vsList, jContainer)
            {
                if (vsList.length === 0)
                    return 0;

                for (var i = 0; i < vsList.length; i++)
                    jContainer.append(createNewCard(vsList[i]));

                return vsList.length;
            },

            addInfluenced: function (vsList, jContainer)
            {
                if (vsList.length === 0)
                    return 0;

                for (var i = 0; i < vsList.length; i++)
                    INSTANCE.character.add(vsList[i], jContainer, false, false);

                return vsList.length;
            },

            /**
             * add a character to a given company if not already existent
             * @param {json} jsonCharacter
             * @param {jQuery} jqTarget
             * @param {boolean} bInsertBeforeTarget insert before given element (of append otherwise)
             * @param {boolean} bIsHosting is hosting character
             * @returns {jQuery} Container
             */
            add(jsonCharacter, jqTarget, bInsertBeforeTarget, bIsHosting)
            {
                // remove, if the character is in the company. It is easier to redraw than to match which items are new etc.
                INSTANCE.character.removeExistingCharacter(jsonCharacter.character.uuid);

                let jCharacter = insertNewCharacter(jsonCharacter.character, jqTarget, bInsertBeforeTarget, bIsHosting);

                const jContainerResources = jCharacter.find(".company-character-reosurces");
                
                let nAdded = 0;
                nAdded += this.addResources(jsonCharacter.resources, jContainerResources);
                nAdded += this.addResources(jsonCharacter.hazards, jContainerResources);

                if (nAdded === 0)
                    jContainerResources.addClass("hosts_nothing");
                else
                    jContainerResources.removeClass("hosts_nothing");

                this.addInfluenced(jsonCharacter.influenced, jCharacter.find(".company-character-influenced"));
                
                jCharacter.find("img.card-icon").each(function ()
                {
                    var img = jQuery(this);
                    if (img.attr("data-revealed") === "true")
                        img.attr("src", img.attr("data-image-path") + img.attr("data-img-image"));
                });

                return jCharacter;
            }
        },

        removeCompany: function (sId)
        {
            const company = document.getElementById("company_" + sId);
            if (company !== null)
                jQuery(company).remove();
        },

        removeEmptyCompanies: function (vsIds)
        {
            for (var i = 0; i < vsIds.length; i++)
                this.removeCompany(vsIds[i]);
        },

        player2Hex: function (sInput)
        {
            return _playerSelector.player2Hex(sInput);
        },
        
        /**
         * Attach a hazard to companies site
         * 
         * @param {String} companyId
         * @param {String} code
         * @param {String} cardUuid
         * @param {String} state
         * @param {String} reveal
         * @return {void}
         */
        onAttachCardToCompanySites : function(companyId, cardList, bAllowContextMenu)
        {
            if (cardList.length === 0)
                return;

            let companyElement = document.getElementById("company_" + companyId);
            if (companyElement === null)
                return;
    
            let jCompanyContainer = jQuery(companyElement);
            let jOnGuardContainer = jCompanyContainer.find(".site-onguard");
            if (jOnGuardContainer.length === 0)
                return;

            let isPlayersCompany = this.isPlayersCompany(jCompanyContainer);
            let pCheckForCardsPlayed = new CheckForCardsPlayed("ingamecard_");
            pCheckForCardsPlayed.loadBefore(jOnGuardContainer);

            for (var i = 0; i < cardList.length; i++)
                this.onAttachCardToCompanySitesElement(jOnGuardContainer, cardList[i], bAllowContextMenu, isPlayersCompany);

            pCheckForCardsPlayed.loadAfter(jOnGuardContainer);
            pCheckForCardsPlayed.mark();
        },
        
        onAttachCardToCompanySitesElement : function(jOnGuardContainer, card, bAllowContextMenu, isPlayersCompany)
        {
            jOnGuardContainer.append(createNewCard(card));
            
            let jCard = jOnGuardContainer.find("#" + CARDID_PREFIX + card.uuid);
            if (jCard.length === 0)
                return;

            if (isPlayersCompany)
                CardPreview.init(jCard, true, true);
            else
                CardPreview.initOnGuard(jCard, true, false);

            INSTANCE.initSingleCardEvent(jCard, isPlayersCompany);
            
            if (bAllowContextMenu)
                ContextMenu.initContextMenuGeneric(jCard.get(0));
            
            if (card.revealed || typeof card.revealed === "undefined")
                INSTANCE.revealCard(jCard.find("img"));
        },
        
        tapSite : function(playerId, code, bIsTapped)
        {
            var sHexPlayerCode = this.player2Hex(playerId);
            if (sHexPlayerCode === "")
                return;
            
            let sId = MeccgApi.isMe(playerId) ? "#player_companies" : "#opponent_table .companies[data-player='" + this.player2Hex(playerId) + "']";
            if (!bIsTapped)
            {
                jQuery(sId + " .company").each(function ()
                {
                    var jCompany = jQuery(this);
                    jCompany.find(".site-container").each(function ()
                    {
                        jQuery(this).find('div[data-card-code="' + code + '"]').removeClass("state_tapped");
                    });
                });
            }
            else
            {
                jQuery(sId + " .company").each(function ()
                {
                    var jCompany = jQuery(this);
                    jCompany.find(".site-container").each(function ()
                    {
                        jQuery(this).find('div[data-card-code="' + code + '"]').addClass("state_tapped");
                    });
                });
            }
        },

        onDoubleClickCompany : function(e)
        {
            let sCompanyId = jQuery(this).attr("data-company-id");
            MeccgApi.send("/game/company/highlight", {company: sCompanyId});
        },
        
        /**
         * draw a company on screen
         * 
         * @param {json} jsonCompany The Company JSON object
         * @returns {Boolean} success state
         */
        drawCompany: function (bIsMe, jsonCompany)
        {
            if (typeof jsonCompany !== "object")
                return false;

            if (typeof jsonCompany.id === "undefined" || typeof jsonCompany.characters === "undefined")
                return false;

            if (jsonCompany.characters.length === 0)
                return false;

            var sHexPlayerCode = this.player2Hex(jsonCompany.playerId);
            if (sHexPlayerCode === "")
                console.log("cannot obtain player hex code.");
                
            let pCheckForCardsPlayed = new CheckForCardsPlayedCompany("ingamecard_");
            var id = jsonCompany.id;
            var vsCharacters = jsonCompany.characters;
            var elemContainer = null;

            /** check if this company is my own (i.e. non-opponent) */
            bIsMe = MeccgApi.isMe(jsonCompany.playerId);
            
            let pElemContainer = document.getElementById("company_" + id);
            const existsAlready =  pElemContainer !== null;
            if (existsAlready)
            {
                elemContainer = jQuery(pElemContainer);
                pCheckForCardsPlayed.loadBefore(elemContainer);
                elemContainer.find(".company-characters").empty();
            }
            else
                elemContainer = jQuery(insertNewcontainer(bIsMe, jsonCompany.playerId, sHexPlayerCode, id));

            let elemList = elemContainer.find(".company-characters");
            for (var i = 0; i < vsCharacters.length; i++)
                this.character.add(vsCharacters[i], elemList, false, true);

            this.drawLocations(id, jsonCompany.sites.current, jsonCompany.sites.regions, jsonCompany.sites.target, jsonCompany.sites.revealed, jsonCompany.sites.attached, jsonCompany.sites.current_tapped, jsonCompany.sites.target_tapped);

            if (!bIsMe)
            {
                elemContainer.find(".card").each(function()
                {
                    let jThis = jQuery(this);
                    let sType = jThis.attr("data-card-type");
                    if (typeof sType !== "undefined" && sType !== "hazard")
                        jThis.attr("draggable", "false");
                });
            }

            elemList.find(".card").each(function ()
            {
                let jCardDiv = jQuery(this);

                if (bIsMe)
                    CardPreview.initOnGuard(jCardDiv, true, bIsMe);
                else
                    CardPreview.init(jCardDiv, true, bIsMe);

                INSTANCE.initSingleCardEvent(jCardDiv, bIsMe);
            });

            if (!existsAlready && bIsMe)
            {
                HandCardsDraggable.initOnCompany(elemContainer);
                let _tmp = elemContainer.get(0);
                if (_tmp !== null)
                    _tmp.ondblclick = INSTANCE.onDoubleClickCompany;
            }

            elemList.find("div.card").each(function ()
            {
                ContextMenu.initContextMenuGeneric(this);
            });

            elemContainer.removeClass("hiddenVisibility");

            pCheckForCardsPlayed.loadAfter(elemContainer);
            pCheckForCardsPlayed.mark();
            
            elemList = null;
            elemContainer = null;
            vsCharacters = null;

            return true;
        },

        initSingleCardEvent : function(jCardDiv, bIsMe)
        {
            let isCharacter = jCardDiv.attr("data-card-type") === "character";
            
            jCardDiv.attr("data-location", "inplay");
            if (!isCharacter)
                _HandCardsDraggable.initOnCardResource(jCardDiv);
            else
                _HandCardsDraggable.initOnCardCharacter(jCardDiv);
        },

        revealCard : function(jImage)
        {
            const src = jImage.attr("data-image-path") + jImage.attr("data-img-image");
            jImage.attr("src", src);
        },

        revealLocation: function (jImage)
        {
            this.revealCard(jImage);
        },

        revealLocations: function (company)
        {
            var companyElem = document.getElementById("company_" + company);
            if (companyElem === null)
                return;

            var jSiteContaienr = jQuery(companyElem).find(".sites");
            jSiteContaienr.find(".site-regions .card-icon").each(function ()
            {
                INSTANCE.revealLocation(jQuery(this));
            });

            jSiteContaienr.find(".site-target .card-icon").each(function ()
            {
                INSTANCE.revealLocation(jQuery(this));
            });

            jQuery(companyElem).find(".company-site-list .location-reveal").addClass("hide");
        },

        isPlayersCompany : function(jCompany)
        {
            return jCompany.parent(".companies").attr("id") === "player_companies";
        },

        drawLocations: function (company, start, regions, target, isRevealed, attached, current_tapped, target_tapped)
        {
            var code, img;
            var companyElem = document.getElementById("company_" + company);
            if (companyElem === null)
                return;

            var elemContainer = jQuery(companyElem);
            let bIsPlayer = this.isPlayersCompany(elemContainer);
            elemContainer.find(".site-container").empty();

            if (start === undefined)
                start = "";

            if (target === undefined)
                target = "";

            if (regions === undefined)
                regions = [];

            if (isRevealed === undefined)
                isRevealed = false;

            if (start !== "")
            {
                code = CardList.getSafeCode(start);
                img = CardList.getImageSite(start);
                elemContainer.find(".site-current").append(createLocationCard(code, img, bIsPlayer));

                elemContainer.find(".site-current img.card-icon").each(function ()
                {
                    var img = jQuery(this);
                    img.attr("src", img.attr("data-image-path") + img.attr("data-img-image"));
                });
                
                if (current_tapped)
                    elemContainer.find(".site-current .card").addClass("state_tapped");
                
                if (bIsPlayer)
                    ContextMenu.initContextMenuSite(elemContainer.find(".site-current img.card-icon").get(0), code);
            }

            if (target !== "")
            {
                code = CardList.getSafeCode(target);
                img = CardList.getImageSite(target);
                
                var jContainerTarget = elemContainer.find(".site-target");
                jContainerTarget.append(createLocationCard(code, img, bIsPlayer));
                
                if (!bIsPlayer)
                    ContextMenu.initContextMenuSiteArrive(company, jContainerTarget.find("img"));
                else
                    ContextMenu.initContextMenuSite(jContainerTarget.find(".card img").get(0), code);
                
                if (target_tapped)
                    jContainerTarget.find(".card").addClass("state_tapped");

                elemContainer.find(".location-reveal").removeClass("hide");
            }
            else
                elemContainer.find(".location-reveal").addClass("hide");
            
            if (attached.length > 0)
                this.onAttachCardToCompanySites(company, attached, true);

            var jContainerReg = elemContainer.find(".site-regions");
            for (var _reg of regions)
            {
                code = CardList.getSafeCode(_reg);
                img = CardList.getImageRegion(_reg);
                jContainerReg.append(createLocationCard(code, img, bIsPlayer));
            }

            if (target !== "" && isRevealed)
                this.revealLocations(company);

            if (!bIsPlayer)
            {
                this.allowOnGuard(company, elemContainer.find(".site-current"), false);
                this.allowOnGuardRegion(company, elemContainer.find(".site-regions"), true);
                this.allowOnGuard(company, elemContainer.find(".site-target"), false);
            }

            elemContainer.find(".site-container").each(function()
            {
                let _tempCont = jQuery(this);
                let _isOnGuard = _tempCont.hasClass("site-onguard");
                _tempCont.find("div").each(function ()
                {
                    if ((bIsPlayer && !_isOnGuard) || (!bIsPlayer && _isOnGuard))
                        CardPreview.initOnGuard(jQuery(this), true, bIsPlayer);
                    else
                        CardPreview.init(jQuery(this), true, bIsPlayer);
                });
            });
        },

        onDropOnGuard: function (companyUuid, jCard, bRevealOnDrop)
        {
            if (jCard.attr("data-location") !== "hand")
                return false;

            const uuid = jCard.attr("data-uuid");
            unbindAndRemove(jCard);
            MeccgApi.send("/game/company/location/attach", {uuid: uuid, companyUuid: companyUuid, reveal: bRevealOnDrop});
            return false;
        },
        
        /**
         * 
         * @param {String} companyUuid
         * @param {jQuery} jSiteTarget
         * @param {boolean} bAutoReveal
         * @return {void}
         */
        allowOnGuard: function (companyUuid, jSiteTarget, bAutoReveal)
        {
            const sCompanyUuid = companyUuid;
            const bRevealOnDrop = bAutoReveal;
            jSiteTarget.droppable(
            {
                tolerance: "pointer",
                classes: {"ui-droppable-hover": "on-drag-over", addClasses: false},
                accept: function (elem)
                {
                    return elem.attr("data-location") === "hand";
                },
                drop: function (event, ui)
                {
                    INSTANCE.onDropOnGuard(sCompanyUuid, ui.draggable, bRevealOnDrop);
                    return false;
                }
            });
        },
        /**
         * 
         * @param {String} companyUuid
         * @param {jQuery} jSiteTarget
         * @param {boolean} bAutoReveal
         * @return {void}
         */
        allowOnGuardRegion: function (companyUuid, jSiteTarget, bAutoReveal)
        {
            const sCompanyUuid = companyUuid;
            const bRevealOnDrop = bAutoReveal;
            jSiteTarget.droppable(
            {
                tolerance: "pointer",
                classes: {"ui-droppable-hover": "on-drag-over", addClasses: false},
                accept: function (elem)
                {
                    return elem.attr("data-location") === "hand" && elem.attr("data-card-type") === "hazard";
                },
                drop: function (event, ui)
                {
                    INSTANCE.onDropOnGuard(sCompanyUuid, ui.draggable, bRevealOnDrop);
                    return false;
                }
            });
        },

        onEnterStartPhase: function (bIsMe)
        {
            jQuery(".taskbar .startphase").addClass("act");
        },
        
        readyCardsInContainer : function(jContainer)
        {
            jContainer.find(".company-character div.card").each(function ()
            {
                var jImage = jQuery(this);
                if (jImage.hasClass("state_tapped"))
                    jImage.removeClass("state_tapped");
            });
        },

        onEnterOrganisationPhase: function (sCurrent, bIsMe)
        {
            if (bIsMe)
                INSTANCE.readyCardsInContainer(jQuery("#player_companies"));
            else
                INSTANCE.readyCardsInContainer(jQuery("#opponent_table .companies[data-player='" + this.player2Hex(sCurrent) + "']"));
        },

        onEnterMovementHazardPhase: function (bIsMe)
        {

        },

        onArriveAtTarget: function (jSites)
        {
            var jTarget = jSites.find(".site-target div");
            if (jTarget.length === 0)
                return;

            var jCurrent = jSites.find(".site-current");
            jCurrent.empty();

            jTarget.appendTo(jCurrent);
            jSites.find(".site-regions").empty();
        },

        onEnterSitePhase: function (sCurrent, bIsMe)
        {
            if (bIsMe)
            {
                jQuery("#player_companies .company-site-list .sites").each(function ()
                {
                    INSTANCE.onArriveAtTarget(jQuery(this));
                });
            }
            else
            {
                jQuery("#opponent_table .companies[data-player='" + this.player2Hex(sCurrent) + "']").find(".company-site-list .sites").each(function ()
                {
                    INSTANCE.onArriveAtTarget(jQuery(this));
                });
            }
        },
        
        onCompanyArrivesAtDestination: function (sCompanyId, bReduceSites)
        {
            if (typeof bReduceSites === "undefined" || bReduceSites)
            {
                let jCompany = jQuery(".company[data-company-id='" + sCompanyId + "']");
                jCompany.find(".company-site-list .sites").each(function ()
                {
                    INSTANCE.onArriveAtTarget(jQuery(this));
                });
            }
            
            document.body.dispatchEvent(new CustomEvent("meccg-highlight", { "detail": sCompanyId }));
        },

        onMenuActionClear: function (jElem)
        {
            jElem.removeClass("state_ready");
            jElem.removeClass("state_tapped");
            jElem.removeClass("state_tapped_fixed");
            jElem.removeClass("state_rot270");
            jElem.removeClass("state_wounded");
            return jElem;
        },
        onMenuActionReadySite: function (ownerId, code)
        {
            INSTANCE.tapSite(ownerId, code, false);
        },
        onMenuActionTapSite: function (ownerId, code)
        {
            INSTANCE.tapSite(ownerId, code, true);
        },
        
        onMenuActionReady: function (uuid, code)
        {
            this.onMenuActionClear(jQuery('div.card[data-uuid="' + uuid + '"]'));
        },

        onMenuActionTap: function (uuid, code, bForced)
        {
            this.onMenuActionClear(jQuery('div.card[data-uuid="' + uuid + '"]')).addClass(bForced ? "state_tapped_fixed" : "state_tapped");
        },

        onMenuActionWound: function (uuid, code)
        {
            this.onMenuActionClear(jQuery('div.card[data-uuid="' + uuid + '"]')).addClass("state_wounded");
        },

        onMenuActionRot270: function (uuid, code)
        {
            this.onMenuActionClear(jQuery('div.card[data-uuid="' + uuid + '"]')).addClass("state_rot270");
        },
                 
        /**
         * Add players to the player indicator box 
         * @param {list} vsPlayersIds
         * @return {void}
         */
        addPlayers: function (sMyId, jMap)
        {
            _playerSelector.addPlayers(sMyId, jMap);
        },
        
        /**
         * Set the current player (player turn!)
         * @param {String} sPlayerId
         * @param {boolean} bIsMe
         * @return {void}
         */
        setCurrentPlayer : function(sPlayerId, bIsMe)
        {
            _playerSelector.setCurrentPlayer(sPlayerId, bIsMe);
        },

        onMenuActionGlow: function (uuid)
        {
            var jElem = jQuery('div.card[data-uuid="' + uuid + '"]').find("img.card-icon");
            if (jElem.hasClass("glowing"))
                jElem.removeClass("glowing");
            else
                jElem.addClass("glowing");
        },

        onMenuActionHighlight:  function (uuid)
        {
            var jElem = jQuery('div.card[data-uuid="' + uuid + '"]').find("img.card-icon");
            if (!jElem.hasClass("card-highlight"))
                jElem.addClass("card-highlight");
        },

        onMenuActionRevealCard: function (uuid, reveal)
        {
            if (uuid === "")
                return;

            const jImage = jQuery('div.card[data-uuid="' + uuid + '"] img.card-icon');
            var src;
            if (reveal)
                src = jImage.attr("data-image-path") + jImage.attr("data-img-image");
            else
                src = jImage.attr("data-image-backside");

            if (src !== "")
                jImage.attr("src", src);
        },

        onRemoveCardsFromGame: function (listUuid)
        {
            for (var i = 0; i < listUuid.length; i++)
                unbindAndRemove(jQuery('div.card[data-uuid="' + listUuid[i] + '"]'));
        },

        onRemoveEmptyCompanies: function ()
        {
            jQuery(".company").each(function ()
            {
                if (jQuery(this).attr("id") !== "create_new_company")
                    INSTANCE.onRemoveEmptyCompaniesCheckChars(jQuery(this).find(".company-characters"));
            });

            jQuery("#player_companies .company-character-reosurces").each(function ()
            {
                let jThis = jQuery(this);
                if (!jThis.hasClass("hosts_nothing") && jThis.find(".card").length === 0)
                    jThis.addClass("hosts_nothing");
            });
        },

        onRemoveEmptyCompaniesCheckChars: function (jCompany)
        {
            if (jCompany.find(".card").length === 0)
                unbindAndRemove(jCompany.closest(".company"));
        }

    };

    return INSTANCE;
}
