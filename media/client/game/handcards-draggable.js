
function createHandCardsDraggable(_CardPreview, _MeccgApi, _Scoring)
{
    const CardPreview = _CardPreview;
    const MeccgApi = _MeccgApi;
    const Scoring = _Scoring;
    
    {
        const JBody = jQuery("body");
        JBody.attr("data-class", JBody.attr("class"));
    }

    const taskbar_icon = {
        discardpile: function() { return document.getElementById("icon_bar_discardpile"); },
        sideboard: function() { return  document.getElementById("icon_bar_sideboard"); },
        playdeck: function() { return  document.getElementById("icon_bar_playdeck"); },
        hand: function() { return  document.getElementById("icon_hand"); },
        victory: function() { return  document.getElementById("icon_bar_victory"); }
    };

    const companyarea = {
        /*
        opponent: document.getElementById("companies_opponent"),
        player: document.getElementById("player_companies"),
        */
        player_addnew: function() { return document.getElementById("create_new_company"); }
    };

    const stagingarea = {

        opponent: {
            resources: function() { return document.getElementById("staging_area_resources_opponent"); },
            hazards: function() { return document.getElementById("staging_area_hazards_opponent"); }
        },

        player: {
            droparea : function() { return document.getElementById("staging-area-player"); },
            resources: function() { return document.getElementById("staging_area_resources_player"); },
            hazards: function() { return document.getElementById("staging_area_hazards_player"); }
        }
    };
    
    function clearTargets(sDraggableCardType)
    {
        let jBody = jQuery("body");
        jBody.removeClass("on-drag-event-generic");
        jBody.removeClass("on-drag-event-" + sDraggableCardType);
        CardPreview.hideAll();
    }
    
    function initTargets(sDraggableCardType)
    {
        let jBody = jQuery("body");
        jBody.addClass("on-drag-event-" + sDraggableCardType);
        jBody.addClass("on-drag-event-generic");
        CardPreview.hideAll();
    }



    function removeDraggableInContainer(jElem)
    {
        jElem.find(".ui-draggable").each(function()
        {
            jQuery(this).removeClass('ui-draggable').draggable("destroy");
        });
        
        jElem.find(".ui-droppable").each(function()
        {
            jQuery(this).removeClass("ui-droppable").droppable('destroy');
        });
        
        unbindAndRemove(jElem);
    }
    

    /**
     * 
     * @param {type} jElem
     * @return {undefined}
     */
    function removeDraggable(jElem)
    {
        /* threadding may cause problems. so just have try-catch block here */
        
        var dragElem = jQuery(jElem);
        
        try
        {
            if (dragElem.hasClass("ui-draggable"))
                dragElem.removeClass('ui-draggable').draggable("destroy");

            if (dragElem.hasClass("ui-droppable"))
                dragElem.removeClass('ui-droppable').droppable('destroy');
        }
        catch(e)
        {
            console.log(e);
        }

        unbindAndRemove(jElem);
    }
    
    const DropFunctions = {
        
        /**
         * Drop card on discard pile
         */
        dropOnDiscard : function( event, ui ) 
        {
            const uuid = ui.draggable.attr("data-uuid");
            const src = ui.draggable.attr("data-location");
            
            if (ui.draggable.attr("data-location") === "hand" || ui.draggable.attr("data-card-type") !== "character")
                removeDraggable(ui.draggable);
            else
                removeDraggableInContainer(ui.draggable.closest(".company-character"));
            
            MeccgApi.send("/game/card/move", {uuid: uuid, target: "discardpile", source: src, drawTop : false});

            /** 
             * usually, this would also have to be checked for every card that gets removed,
             * however, the basic idea is really that you can see what has been discarded from the hand, so 
             * this should suffice for now
             */
            if (Preferences.discardOpenly())
                MeccgApi.send("/game/discardopenly", {uuid: uuid });

            return false;
        },
        
        dropOnVicotry : function( event, ui ) 
        {
            const uuid = ui.draggable.attr("data-uuid");
            const code = ui.draggable.attr("data-card-code");
            removeDraggable(ui.draggable);
            
            MeccgApi.send("/game/card/store", { uuid: uuid });
            Scoring.scoreCard(code);
            return false;
        },
        
        dropOnSideboard : function( event, ui ) 
        {
            const uuid = ui.draggable.attr("data-uuid");
            const src = ui.draggable.attr("data-location");
            if (ui.draggable.attr("data-location") === "hand" || ui.draggable.attr("data-card-type") !== "character")
                removeDraggable(ui.draggable);
            else
                removeDraggableInContainer(ui.draggable.closest(".company-character"));
            
            MeccgApi.send("/game/card/move", {uuid: uuid, target: "sideboard", source: src, drawTop : false});
            return false;
        },
        
        dropOnPlaydeck : function( event, ui ) 
        {
            const uuid = ui.draggable.attr("data-uuid");
            const src = ui.draggable.attr("data-location");
            
            if (ui.draggable.attr("data-location") === "hand" || ui.draggable.attr("data-card-type") !== "character")
                removeDraggable(ui.draggable);
            else
                removeDraggable(ui.draggable.closest(".company-character"));
            
            MeccgApi.send("/game/card/move", {uuid: uuid, target: "playdeck", source: src, drawTop : false});
            return false;
        },
        
        dropOnHand : function( event, ui ) 
        {
            if (ui.draggable.attr("data-location") !== "hand")
            {
                const uuid = ui.draggable.attr("data-uuid");
                const src = ui.draggable.attr("data-location");

                if (ui.draggable.attr("data-card-type") !== "character")
                    removeDraggable(ui.draggable);
                else
                    removeDraggable(ui.draggable.closest(".company-character"));
                
                MeccgApi.send("/game/card/move", {uuid: uuid, target: "hand", source: src, drawTop : true});
            }
            
            return false;
        },
        
        dropOnStageArea : function( event, ui ) 
        {
            if (ui.draggable.attr("data-location") === "hand")
            {
                const uuid = ui.draggable.attr("data-uuid");
                removeDraggable(ui.draggable);
                HandCardsDraggable.onAddGenericCardToStagingArea(uuid, true);
            }
            
            return false;
        },
        
        dropOnAddNew : function( event, ui ) 
        {
            if (ui.draggable.attr("data-card-type") !== "character")
                return false;
            
            const uuid = ui.draggable.attr("data-uuid");
            const source = ui.draggable.attr("data-location");
            
            if (source === "hand")
                removeDraggable(ui.draggable);

            HandCardsDraggable.onCreateNewCompany(uuid, source);
            return false;
        },
        
        dropOnAddCompanyCharacter :  function( event, ui, companyUuid ) 
        {
            const jCard = ui.draggable;
            if (jCard.attr("data-card-type") !== "character")
                return false;

            const source = jCard.attr("data-location");
            const uuid = jCard.attr("data-uuid");
            if (source === "hand")
                unbindAndRemove(jCard);

            HandCardsDraggable.onJoinCompany(uuid, source, companyUuid);
            MeccgApi.send("/game/draw/company", companyUuid);
            return false;
        }
    };

    

    var HandCardsDraggable = {

        _locationMessageId : 0,
        
        /**
         * Get the company path
         * 
         * @param {String} jCardContainer
         * @returns {createHandCardsDraggable.HandCardsDraggable.getCompanyPath.handcards-draggableAnonym$0}
         */
        getCompanyPath : function(jCardContainer)
        {
            var jCompanyCharacter = jCardContainer.closest(".company-character");
            
            /**
             * this character is either host or influenced
             * @type Boolean
             */
            const isHostCharacter = jCompanyCharacter.hasClass("character-is-company-host");

            /**
             * This characters company ID
             * @type String
             */
            const companySourceId = jCardContainer.closest(".company").attr("data-company-id");
            
            var parentCharacterUuid = "";
            if (!isHostCharacter)
            {
                jCompanyCharacter = jCompanyCharacter.parent().closest(".company-character");
                if (jCompanyCharacter.length !== 0)
                    parentCharacterUuid = jCompanyCharacter.attr("data-character-uuid");
            }

            return {
                character_uuid : jCompanyCharacter.attr("data-character-uuid"),
                company_uuid : companySourceId,
                is_host : isHostCharacter,
                parent_character_uuid : parentCharacterUuid
            };
        },

        _requireMessageId : function()
        {
            HandCardsDraggable._locationMessageId++;
            return HandCardsDraggable._locationMessageId;
        },
        
        onLocationSelectClick : function(sCode, companyUuid)
        {
            const data = {
                company : companyUuid,
                code : sCode,
                id : HandCardsDraggable._requireMessageId()
            };

            document.body.dispatchEvent(new CustomEvent("meccg-map-show", { "detail":  data }));
        },
        
        onLocationRevealClick : function(jThis, companyUuid)
        {
            if (jThis.closest(".company-site-list").find(".site-target img").length === 0)
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Please organize movement first." }));
            else /*if (!resolveHandSizeFirst())*/
                MeccgApi.send("/game/company/location/reveal", {companyUuid: companyUuid});
        },
        
        /**
         * Init Company events (add host character)
         * 
         * @param {Object} jCompany
         * @returns {void}
         */
        initOnCompany : function(jCompany)
        {
            const companyUuid = jCompany.attr("data-company-id");
            
            jCompany.find(".company-characters-add").each(function()
            {
                jQuery(this).droppable(
                {
                    classes: HandCardsDraggable.droppableParams,
                    accept: HandCardsDraggable.droppableAcceptCharacter,
                    drop: function(event, ui)
                    {
                        DropFunctions.dropOnAddCompanyCharacter(event, ui, companyUuid);
                    }
                });
            });
            
            jCompany.find(".location-select").each(function () {

                let jThis = jQuery(this);
                jThis.attr("data-company-uuid", companyUuid);
                jThis[0].onclick = (e) => 
                {
                    const _this = jQuery(this);
                    const _companyUuid = _this.attr("data-company-uuid");
                    const sCode = HandCardsDraggable.getStartingLocation(_this.closest(".company-site-list"))
                    HandCardsDraggable.onLocationSelectClick(sCode, _companyUuid);
                    e.stopPropagation();
                    return false;
                }
            });
            
            jCompany.find(".location-reveal").each( function() 
            {
                let jThis = jQuery(this);
                jThis.attr("data-company-uuid", companyUuid);
                jThis[0].onclick = (e) => 
                {
                    const _this = jQuery(this);
                    const _companyUuid = _this.attr("data-company-uuid");
                    HandCardsDraggable.onLocationRevealClick(_this, _companyUuid);
                    e.stopPropagation();
                    return false;
                };

            });
        },
        
        getStartingLocation : function(jCompany)
        {
            const jSite = jCompany.find(".site-current .card");
            if (jSite.length === 0)
                return "";
            else
                return jSite.attr("data-card-code");
        },
        
        initOnCardCharacter : function(jCardContainer)
        {
            if (this.getCompanyPath(jCardContainer).is_host) // if this character is a host, he/she may accept characters under direct influence
            {
                jCardContainer.droppable(
                {
                    tolerance: "pointer",
                    classes: HandCardsDraggable.droppableParams,
                    accept: HandCardsDraggable.droppableAccept,
                    
                    drop: function(event, ui ) 
                    {
                        const jCard = ui.draggable;
                        const source = jCard.attr("data-location");
                        const receivingCharacter = HandCardsDraggable.getCompanyPath(jQuery(this));
                        receivingCharacter.character_uuid = jQuery(this).attr("data-uuid");
                        
                        var redrawReceivingCompanyId = receivingCharacter.company_uuid;
                        var redrawDonatingCompanyId = "";
                        
                        if (jCard.attr("data-card-type") === "character")
                        {
                            var donatingCharacter;
                            if (source === "hand")
                                donatingCharacter = { character_uuid : jCard.attr("data-uuid"), company_uuid : "" };
                            else
                                donatingCharacter = HandCardsDraggable.getCompanyPath(ui.draggable);

                            if (donatingCharacter.company_uuid !== receivingCharacter.company_uuid)
                                redrawDonatingCompanyId = donatingCharacter.company_uuid;
                            
                            const params = {
                                    uuid : jCard.attr("data-uuid"),
                                    targetcharacter: receivingCharacter.character_uuid,
                                    companyId : receivingCharacter.company_uuid,
                                    fromHand : source === "hand"
                            };
                              
                            removeDraggable(jCard);
                            MeccgApi.send("/game/character/join/character", params, true);
                        }
                        else if (source === "hand" || source === "stagingarea")
                        {
                            removeDraggable(jCard);
                            HandCardsDraggable.onAddResourcesToCharacter(jCard.attr("data-uuid"), jQuery(this), true);
                        }
                        else 
                        {
                            var donatingCharacter = HandCardsDraggable.getCompanyPath(jCard);
                            donatingCharacter.character_uuid = jCard.attr("data-uuid");
                            
                            if (donatingCharacter.character_uuid === receivingCharacter.character_uuid) // oneself cannot be the target
                                return;

                            if (donatingCharacter.company_uuid !== receivingCharacter.company_uuid)
                                redrawDonatingCompanyId = donatingCharacter.company_uuid;
                            
                            if (jCard.attr("data-card-type") === "resource")
                            {
                                removeDraggable(jCard);
                                HandCardsDraggable.onAddResourceToCharacter(jCard.attr("data-uuid"), jQuery(this), false);
                            }
                            else if (jCard.attr("data-card-type") === "hazard")
                            {   
                                removeDraggable(jCard);
                                HandCardsDraggable.onAddHazardsToCharacter(jCard.attr("data-uuid"), jQuery(this), source === "hand");
                            }
                        }

                        if (redrawReceivingCompanyId !== "")
                            MeccgApi.send("/game/draw/company", redrawReceivingCompanyId);
                        
                        if (redrawDonatingCompanyId !== "")
                            MeccgApi.send("/game/draw/company", redrawDonatingCompanyId);
                    }
                    
                });
            }
            else /* influenced character */
            {
                jCardContainer.droppable(
                {
                    tolerance: "pointer",
                    classes: HandCardsDraggable.droppableParams,
                    accept: HandCardsDraggable.droppableAcceptResrouceAndHazards,
                    drop: function(event, ui ) 
                    {
                        const jCard = jQuery(ui.draggable);
                        const source = jCard.attr("data-location");
                        const receivingCharacter = HandCardsDraggable.getCompanyPath(jQuery(this));
                        receivingCharacter.character_uuid = jQuery(this).attr("data-uuid");
                        
                        //const character_uuid = receivingCharacter.company_uuid;
                        var drawReceivingCompanyId = receivingCharacter.company_uuid;
                        var drawDonatingCompanyId = "";
                        
                        if (jCard.attr("data-card-type") === "character")
                            return;
 
                        if (source === "hand" || source === "stagingarea")
                        {
                            removeDraggable(jCard);
                            HandCardsDraggable.onAddHazardsToCharacter(jCard.attr("data-uuid"), jQuery(this), true);
                        }
                        else
                        {
                            var donatingCharacter = HandCardsDraggable.getCompanyPath(jCard);
                            if (receivingCharacter.character_uuid === donatingCharacter.character_uuid) // oneself cannot be the target
                                return;
                            else if (receivingCharacter.company_uuid !== donatingCharacter.character_uuid)
                                drawDonatingCompanyId = donatingCharacter.character_uuid;

                            if (jCard.attr("data-card-type") === "resource")
                            {
                                removeDraggable(jCard);
                                HandCardsDraggable.onAddResourceToCharacter(jCard.attr("data-uuid"), jQuery(this), false);
                                    //HandCardsDraggable.onTransferResourceBetweenCharacters(jCard.attr("data-uuid"), donatingCharacter.character_uuid, character_uuid);
                            }
                            else if (jCard.attr("data-card-type") === "hazard")
                            {
                                removeDraggable(jCard);
                                HandCardsDraggable.onAddHazardsToCharacter(jCard.attr("data-uuid"), jQuery(this), true);
                            }
                            else
                                return;
                        }
                        
                        

                        if (drawReceivingCompanyId !== "")
                            MeccgApi.send("/game/draw/company", drawReceivingCompanyId);
                        
                        if (drawDonatingCompanyId !== "")
                            MeccgApi.send("/game/draw/company", drawDonatingCompanyId);
                    }
                });
            }
            
            HandCardsDraggable.initDraggableCard(jCardContainer);
        },
        
        /**
         * Init a jquery draggable event
         * @param {jQuery} jCardContainer
         * @return {void}
         */
        initDraggableCard : function(jCardContainer)
        {
            let sAllow = jCardContainer.attr("draggable");
            if (sAllow !== "true")
                return;
            
            jCardContainer.draggable(
            {
                cursor: 'move',
                revert: true,
                opacity: 0.5,
                revertDuration : 200,
                
                start: function() 
                {
                    initTargets(jQuery(this).attr("data-card-type"));
                },
                
                stop: function() 
                {
                    clearTargets(jQuery(this).attr("data-card-type"));
                }
            });
        },
        
        /**
         * Setup drag event for resource card in play
         * @param {Object} jCardContainer Card Container of card in play
         * @returns {void}
         */
        initOnCardResource: function (jCardContainer)
        {
            HandCardsDraggable.initDraggableCard(jCardContainer);
        },

        /**
         * Add a card to the staging area
         * 
         * @param {String} cardId Card Container Id
         * @param {String} target
         * @param {String} type
         * @returns {void}
         */
        initCardInStagingArea: function (cardId, target, type)
        {
            if (cardId === "")
                return;

            var isResource;
            if (type === "hazard")
                isResource = false;
            else if (type === "resource")
                isResource = true;
            else
                return;

            var elemDiv = document.getElementById(cardId);
            if (elemDiv === null)
            {
                console.log("Cannot find card container " + cardId);
                return;
            }
            
            const jCard = jQuery(elemDiv);
            jCard.attr("data-location", "stagingarea");
            HandCardsDraggable.initDraggableCard(jCard);
        },

        /**
         * visualize drag area for a new company
         * @param {String} idPrefix
         * @param {String} uuid
         * @param {String} type
         * @returns {void}
         */
        initDragEventsForHandCard: function (idPrefix, uuid, type)
        {
            var jCardContainer = jQuery(document.getElementById(idPrefix + uuid));
            jCardContainer.attr("data-location", "hand");
            HandCardsDraggable.initDraggableCard(jCardContainer);
        },

        onAddGenericCardToStagingArea: function (_uuid, bPlayer)
        {
            if (_uuid === "")
                return;
            
            MeccgApi.send("/game/stagingarea/add/card", {
                uuid: _uuid,
                resource : true,
                target: bPlayer ? "player" : "opponent"
            });
        },
        

        onAddResourcesToStagingArea: function (_uuid, bPlayer)
        {
            this.onAddGenericCardToStagingArea(_uuid, bPlayer);
        },
        
        /**
         * Add a hazard to the staging area
         * @param {String} _uuid card uui
         * @param {boolean} bPlayer is host_players staging area
         * @return {void}
         */
        onAddHazardsToStagingArea: function (_uuid, bPlayer)
        {
            this.onAddGenericCardToStagingArea(_uuid, bPlayer);
        },
        
        /**
         * Transfer a resource between characters
         * 
         * @param {String} cardUuid
         * @param {String} owningCharacerUuid
         * @param {String} targetCharacterUuid
         * @returns {Boolean}
         */
        onTransferResourceBetweenCharacters : function(cardUuid, owningCharacerUuid, targetCharacterUuid)
        {
            console.log("---deprecated");
        },
        
        /**
         * Add a resource to a given character
         * 
         * @param {String} uuid Card UUID
         * @param {Object} elementCharacterCard
         * @param {Boolean} bFromHand From hand (true) or staging area (false)
         * @returns {undefined|Boolean}
         */
        onAddResourceToCharacter : function (uuid, elementCharacterCard, bFromHand)
        {
            this.onAddHazardsToCharacter(uuid, elementCharacterCard, bFromHand);
        },

        /**
         * Add a hazard to a given character
         * 
         * @param {String} uuid Card UUID
         * @param {Object} elementCharacterCard
         * @param {Boolean} bFromHand From hand (true) or staging area (false)
         * @returns {undefined|Boolean}
         */
        onAddHazardsToCharacter: function (uuid, elementCharacterCard, bFromHand)
        {
            if (uuid === "")
                return false;

            var jHost = jQuery(elementCharacterCard).closest(".company-character");
            var companyId = jHost.closest(".company").attr("data-company-id");
            var characterUuid = jHost.attr("data-character-uuid");
            
            MeccgApi.send("/game/character/host-card", {uuid: uuid, companyId: companyId, characterUuid: characterUuid, fromHand: bFromHand }, true);
        },

        /**
         * Add a resource to a given character
         * 
         * @param {String} uuid Card UUID
         * @param {Object} elementCharacterCard
         * @param {Boolean} bFromHand From hand (true) or staging area (false)
         * @returns {undefined|Boolean}
         */
        onAddResourcesToCharacter: function (uuid, elementCharacterCard, bFromHand)
        {
            if (uuid === "")
                return false;

            var jThis = jQuery(elementCharacterCard);
            var jHost = jThis.closest(".company-character");
            var companyId = jHost.closest(".company").attr("data-company-id");
            var characterUuid = jHost.attr("data-character-uuid");

            MeccgApi.send("/game/character/host-card", {uuid: uuid, companyId: companyId, characterUuid: characterUuid, fromHand: bFromHand}, true);
        },

        /**
         * Create a new company 
         * @param {String} _uuid Character card uuid
         * @param {String} source "hand" or "inplay"
         * @returns {void}
         */
        onCreateNewCompany: function (_uuid, source)
        {
            if (_uuid !== "" && source !== "")
                MeccgApi.send("/game/company/create", {source: source, uuid: _uuid});
        },
        
        removeEmptyCompaniesFromBoard : function()
        {
            
        },

        /**
         * Join a company from hand
         * @param {String} _joiningCharacterUuid
         * @param {String} source
         * @param {String} targetCompanyId
         * @returns {Boolean}
         */
        onJoinCompany: function (_joiningCharacterUuid, source, targetCompanyId)
        {
            if (_joiningCharacterUuid === "")
                console.log("no uuid");
            else if (targetCompanyId === "" || typeof targetCompanyId === "undefined")
                console.log("no target company found ");
            else
                MeccgApi.send("/game/character/join/company", {source: source, uuid: _joiningCharacterUuid, companyId: targetCompanyId});
        },
        /**
         * Join a character under direct influence from hand
         * @param {type} ev
         * @param {type} pContainer
         * @returns {Boolean}
         */
        onJoinCharacter: function (ev, pContainer)
        {
            var _uuid = getUUidFromPartDelimitedEvent(ev);
            if (_uuid === "")
            {
                console.log("no uuid");
                return false;
            }

            var _characterId = jQuery(pContainer).attr("data-uuid");
            var _companyId = jQuery(pContainer).closest(".company").attr("data-company-id");

            if (_companyId === "" || typeof _companyId === "undefined")
            {
                console.log("no target company found " + _companyId);
                return false;
            }
            else if (_characterId === "" || typeof _characterId === "undefined")
            {
                console.log("no target character found ");
                return false;
            }

            MeccgApi.send("/game/character/join/character", {formHand: true, uuid: _uuid, targetcharacter: _characterId, companyId: _companyId});
        },
        
        droppableParams : {
            "ui-droppable-hover": "on-drag-over",
            addClasses: false
        },
        
        droppableAccept : function(elem)
        {
            return true;
        },
        
        droppableAcceptResrouceAndHazards : function(elem)
        {
            let sType = elem.attr("data-card-type");
            return sType === "resource" || sType === "hazard";
        },
        
        droppableAcceptCharacter : function(elem)
        {
            return elem.attr("data-card-type") === "character";
        },
        
        droppableAcceptStagingArea : function(elem)
        {
            let sAttr = elem.attr("data-card-type");
            return sAttr === "resource" || sAttr === "hazard";
        }
    };

    jQuery(taskbar_icon.discardpile()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        drop: DropFunctions.dropOnDiscard
    });
    
    jQuery(taskbar_icon.victory()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        drop: DropFunctions.dropOnVicotry
    });

    jQuery(taskbar_icon.sideboard()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        drop: DropFunctions.dropOnSideboard
    });

    jQuery(taskbar_icon.playdeck()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        drop: DropFunctions.dropOnPlaydeck
    });
    
    jQuery(taskbar_icon.hand()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        drop: DropFunctions.dropOnHand
    });
    
    jQuery(stagingarea.player.droparea()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        drop: DropFunctions.dropOnStageArea,
        accept: HandCardsDraggable.droppableAcceptStagingArea
    });
    
    jQuery(companyarea.player_addnew()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        drop: DropFunctions.dropOnAddNew,
        accept: HandCardsDraggable.droppableAcceptCharacter
    });

    function onHandSizeLimitUpdate(nAdd)
    {
        try
        {
            let pElem = document.getElementById("card-hand-size-limit");
            const nAllowed = parseInt(pElem.innerHTML.trim()) + nAdd;
            pElem.innerHTML = nAllowed;
        }
        catch (err)
        {

        }
    }

    jQuery("#playercard_hand .card-hands-sizer-plus")[0].onclick = (e) =>
    {
        onHandSizeLimitUpdate(1);
        e.stopPropagation();
        return false;
    };
    
    jQuery("#playercard_hand .card-hands-sizer-minus")[0].onclick = (e) =>
    {
        onHandSizeLimitUpdate(-1);
        e.stopPropagation();
        return false;
    };

    return HandCardsDraggable;
}

