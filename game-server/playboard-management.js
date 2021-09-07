

function isValidTarget(target)
{
    switch(target)
    {
        case "victory":
        case "sideboard":
        case "discardpile":
        case "discard":
        case "playdeck":
        case "hand":
            return true;

        default:
            console.log("Invalid target " + target);
            break;
    }

    return false;
}


function removeFromList(uuid, _list)
{
    if (typeof _list === "undefined")
        return false;

    for (let y = _list.length - 1; y >= 0; y--)
    {
        if (_list[y] === uuid)
        {
            _list.splice(y, 1);
            return true;
        }
    }

    return false;
}


let PlayBoardManagement = function(_Decks, _listAgents, _eventManager, _gameCardProvider)
{
    if (_listAgents === undefined)
        _listAgents = [];

    var PLAYBOARD_MANAGER = { };

    PLAYBOARD_MANAGER.decks = _Decks;
    PLAYBOARD_MANAGER.gameCardProvider = _gameCardProvider;
    PLAYBOARD_MANAGER.agents = _listAgents;

    PLAYBOARD_MANAGER.companies = { };
    PLAYBOARD_MANAGER.characters = { };
    PLAYBOARD_MANAGER.stagingareas = { };
    PLAYBOARD_MANAGER.data = { };
    PLAYBOARD_MANAGER._eventManager = _eventManager;

    PLAYBOARD_MANAGER._eventManager.trigger("setup-new-game", PLAYBOARD_MANAGER.data);

    PLAYBOARD_MANAGER.reset = function()
    {
        PLAYBOARD_MANAGER.companies = { };
        PLAYBOARD_MANAGER.characters = { };
        PLAYBOARD_MANAGER.stagingareas = { };
        PLAYBOARD_MANAGER.data = { };
        PLAYBOARD_MANAGER._counter = 0;

        if (PLAYBOARD_MANAGER.decks !== null)
            PLAYBOARD_MANAGER.decks.reset();

        PLAYBOARD_MANAGER._eventManager.trigger("setup-new-game", PLAYBOARD_MANAGER.data);
    };

    /**
     * Get the data object (see plugins)
     * 
     * @returns Object
     */
    PLAYBOARD_MANAGER.GetData = function()
    {
        return PLAYBOARD_MANAGER.data;
    };
    
    PLAYBOARD_MANAGER.Save = function()
    {
        return {
            decks: PLAYBOARD_MANAGER.decks.save(),
            companies : PLAYBOARD_MANAGER.companies,
            characters : PLAYBOARD_MANAGER.characters,
            stagingarea : PLAYBOARD_MANAGER.stagingareas,
            counter : PLAYBOARD_MANAGER._counter
        };
    };

    /** 
     * Restore a saved game
     * @param {json} jData
     * @return {boolean} success state
     */
    PLAYBOARD_MANAGER.RestoreSavedGame = function(jBoard)
    {
        PLAYBOARD_MANAGER.companies = jBoard.companies;
        PLAYBOARD_MANAGER.characters = jBoard.characters;
        PLAYBOARD_MANAGER.stagingareas = jBoard.stagingarea;
        PLAYBOARD_MANAGER._counter = jBoard.counter;
        
        return PLAYBOARD_MANAGER.decks.restoreSavedGame(jBoard.decks);
    };
    
    PLAYBOARD_MANAGER.characterExists = function(uuid)
    {
        return typeof PLAYBOARD_MANAGER.characters[uuid] !== "undefined";
    };

    PLAYBOARD_MANAGER.companyExists = function(uuid)
    {
        return PLAYBOARD_MANAGER.companies[uuid] !== "undefined";
    };

    /**
     * Get a character by its uid
     * @param {String} uuid
     * @return {json} json or null
     */
    PLAYBOARD_MANAGER.getCharacterByUuid = function(uuid)
    {
        if (uuid !== "" && PLAYBOARD_MANAGER.characterExists(uuid))
            return PLAYBOARD_MANAGER.characters[uuid];
        else
            return null;
    };

    /**
     * Get a character card by its uid
     * @param {String} uuid
     * @return {json} json or null
     */
    PLAYBOARD_MANAGER.GetCharacterCardByUuid = function(uuid)
    {
        let pChar = PLAYBOARD_MANAGER.getCharacterByUuid(uuid);
        if (pChar === null || typeof pChar.uuid === "undefined")
            return null;
        else
            return PLAYBOARD_MANAGER.GetCardByUuid(pChar.uuid);
    };


    /**
     * JSON to String
     * @param {JSON} content
     * @returns {String} String value
     */
    PLAYBOARD_MANAGER.toString = function(content)
    {
        return JSON.stringify(content, null, '\t');
    };

    PLAYBOARD_MANAGER._counter = 0;

    /**
     * Create a new company id
     * 
     * @param {String} playerId Player ID
     * @returns {String}
     */
    PLAYBOARD_MANAGER.obtainUniqueCompanyId = function(playerId)
    {
        PLAYBOARD_MANAGER._counter++;
        return "company_" + PLAYBOARD_MANAGER._counter;
    };

    /**
     * Add a player deck to the game 
     * @param {String} playerId
     * @param {String} jsonDeck
     * @returns {Boolean}
     */
    PLAYBOARD_MANAGER.AddDeck = function(playerId, jsonDeck)
    {
        PLAYBOARD_MANAGER.decks.addDeck(playerId, jsonDeck, PLAYBOARD_MANAGER.agents, PLAYBOARD_MANAGER.gameCardProvider);

        PLAYBOARD_MANAGER.stagingareas[playerId] = {
            resources : [],
            hazards : []
        };

        PLAYBOARD_MANAGER._eventManager.trigger("on-deck-added", playerId, jsonDeck, PLAYBOARD_MANAGER.decks)
        return true;
    };

    /**
     * Add cards to the sideboard of a given player DURING the game!
     * @param {String} playerId
     * @param {String} jsonDeck
     * @returns {Number} Number of cards added or -1
     */
    PLAYBOARD_MANAGER.AddDeckCardsToSideboard = function(playerId, jsonDeck)
    {
        return PLAYBOARD_MANAGER.decks.addCardsToSideboardDuringGame(playerId, jsonDeck, PLAYBOARD_MANAGER.agents, PLAYBOARD_MANAGER.gameCardProvider);
    };

    PLAYBOARD_MANAGER.GetCardsInHand = function(playerId)
    {
        var pDeck = PLAYBOARD_MANAGER.decks.getCards().hand(playerId);
        if (pDeck === null)
            return [];
        else
            return pDeck.getCardsInHand();
    };

    PLAYBOARD_MANAGER.UpdateOwnership = function(playerId, pCard)
    {
        if (pCard !== null && playerId !== undefined && playerId !== "")
            pCard.owner = playerId;
    };

    /**
     * Get the top X cards
     * @param {String} playerId
     * @param {Integer} nCount
     * @returns {Array} List or empty list
     */
    PLAYBOARD_MANAGER.GetTopCards = function(playerId, nCount)
    {
        var res = [];

        var _card;
        var list = PLAYBOARD_MANAGER.decks.getCards().hand(playerId);
        for (var i = 0; i < list.length && i < nCount; i++)
        {
            _card = PLAYBOARD_MANAGER.decks.getFullPlayerCard(list[i]);
            if (_card !== null)
            {
                PLAYBOARD_MANAGER.UpdateOwnership(playerId, _card);
                res.push({uuid:_card.uuid,code:_card.code, type:_card.type, status:_card.status, owner: _card.owner});
            }
        }

        return res;
    };

    PLAYBOARD_MANAGER.DrawCard = function(playerId, bOnlyGetTopCard)
    {
        let _uuid = "";
        if (bOnlyGetTopCard)
        {
            const list = PLAYBOARD_MANAGER.decks.getCards().hand(playerId);
            if (list.length > 0)
                _uuid = list[0];
        }
        else
        {
            var pDeck = PLAYBOARD_MANAGER.decks.getPlayerDeck(playerId);
            if (pDeck !== null)
            {
                if (pDeck.isEmptyPlaydeck())
                    PLAYBOARD_MANAGER.decks.clearPlayerSites(playerId);

                _uuid = pDeck.draw();
            }
        }

        if (_uuid === "")
            return null;

        const _card = PLAYBOARD_MANAGER.decks.getFullPlayerCard(_uuid);
        if (_card === null)
            return null;
        else
        {
            _card.owner = playerId;
            return { uuid:_uuid,code:_card.code, type:_card.type, status:_card.status, owner: _card.owner };
        }
    };

    PLAYBOARD_MANAGER.Size = {

        hand : function(playerId)
        {
            return PLAYBOARD_MANAGER.decks.getCards().hand(playerId).length;
        },

        playdeck : function(playerId)
        {
            return PLAYBOARD_MANAGER.decks.getCards().playdeck(playerId).length;
        },

        sideboard : function(playerId)
        {
            return PLAYBOARD_MANAGER.decks.getCards().sideboard(playerId).length;
        },

        discard : function(playerId)
        {
            return PLAYBOARD_MANAGER.decks.getCards().discardpile(playerId).length;
        },

        victory : function(playerId)
        {
            return PLAYBOARD_MANAGER.decks.getCards().victory(playerId).length;
        }
    };

    PLAYBOARD_MANAGER.getCardList = function(vsList)
    {
        if (vsList === null || vsList === undefined)
            return [];
            
        var _newList = [ ];

        for (var i = 0; i < vsList.length; i++)
        {
            var _uuid = vsList[i];
            var _card = this.decks.getFullPlayerCard(_uuid);

            if (_card !== null && _card.code !== "")
                _newList.push({uuid:_uuid,code:_card.code, type:_card.type, status:_card.status,owner: _card.owner});
        }

        return _newList;
    };

    PLAYBOARD_MANAGER.DumpDeck = function(playerId)
    {
        PLAYBOARD_MANAGER.decks.dumpCards(playerId);
    };

    PLAYBOARD_MANAGER.ShufflePlaydeck = function(playerId)
    {
        var deck = PLAYBOARD_MANAGER.decks.getPlayerDeck(playerId);
        if (deck !== null)
            deck.shuffle();
    };

    PLAYBOARD_MANAGER.ShuffleDiscardpile = function(playerId)
    {
        var deck = PLAYBOARD_MANAGER.decks.getPlayerDeck(playerId);
        if (deck !== null)
            deck.shuffleDiscardpile();
    };

    PLAYBOARD_MANAGER.GetCardsInSideboard = function(playerId)
    {
        return this.getCardList(PLAYBOARD_MANAGER.decks.getCards().sideboard(playerId));
    };

    PLAYBOARD_MANAGER.GetCardsInDiscardpile = function(playerId)
    {
        return this.getCardList(PLAYBOARD_MANAGER.decks.getCards().discardpile(playerId));
    };

    PLAYBOARD_MANAGER.GetCardsInPlaydeck = function(playerId)
    {
        return this.getCardList(PLAYBOARD_MANAGER.decks.getCards().playdeck(playerId));
    };
    PLAYBOARD_MANAGER.GetCardsInVictory = function(playerId)
    {
        return this.getCardList(PLAYBOARD_MANAGER.decks.getCards().victory(playerId));
    };

    PLAYBOARD_MANAGER.GetCardsInHand = function(playerId)
    {
        return this.getCardList(PLAYBOARD_MANAGER.decks.getCards().hand(playerId));
    };

    /**
     * Get full card detais of a card by its uuid
     * 
     * @param {String} uuid Card UUID
     * @returns {Object} JSON or NULL
     */
    PLAYBOARD_MANAGER.GetCardByUuid = function(uuid)
    {
        return PLAYBOARD_MANAGER.decks.getFullPlayerCard(uuid);
    };

    /**
     * Get the company ids belonging to a given player id
     * 
     * @param {String} playerId
     * @returns {Array}
     */
    PLAYBOARD_MANAGER.GetCompanyIds = function(playerId)
    {
        var list = [];

        for (var key in PLAYBOARD_MANAGER.companies) 
        {
            if (playerId !== "" && PLAYBOARD_MANAGER.companies[key].playerId === playerId)
                list.push(key);
        }

        return list;
    },

    PLAYBOARD_MANAGER.GetCompanyAttachedLocationCards = function(companyId)
    {
        let res = {
            current: "",
            current_tapped : false,
            regions: [],
            target: "",
            target_tapped : false,
            attached : [],
            revealed : false
        };

        if (companyId === "" || typeof PLAYBOARD_MANAGER.companies[companyId] === "undefined")
            return res;

        let sOwnerId = PLAYBOARD_MANAGER.companies[companyId].playerId;
        let jSites = PLAYBOARD_MANAGER.companies[companyId].sites;
        let _list = [];
        
        for (var i = 0; i < jSites.attached.length; i++)
        {
            let _card = PLAYBOARD_MANAGER.GetCardByUuid(jSites.attached[i]);
            if (_card !== null)
                _list.push(_card);
        }

        res.current = jSites.current;
        res.regions = jSites.regions;
        res.target = jSites.target;
        res.revealed = jSites.revealed;
        res.attached = _list;
        res.current_tapped = PLAYBOARD_MANAGER.IsSiteTapped(sOwnerId, jSites.current);
        res.target_tapped = PLAYBOARD_MANAGER.IsSiteTapped(sOwnerId, jSites.target);
                
        return res;
    };

    PLAYBOARD_MANAGER.GetFullCompanyByCompanyId = function(companyId)
    {
        if (companyId === "" || typeof PLAYBOARD_MANAGER.companies[companyId] === "undefined")
        {
            console.log("Cannot find company by its id " + companyId + " (GetFullCompanyByCompanyId)");
            return null;
        }

        function addGeneric(listUuids, targetList)
        {
            if (typeof listUuids === "undefined" || typeof targetList === "undefined")
                return;

            for (var i = 0; i < listUuids.length; i++)
            {
                var _card = PLAYBOARD_MANAGER.GetCardByUuid(listUuids[i]);
                if (_card !== null)
                    targetList.push(_card);
                else
                    console.log("Cannot find card by its uuid " + listUuids[i]);
            }
        }

        function addCharacter(jsonChar, targetList)
        {
            if (typeof jsonChar === "undefined" || typeof jsonChar.uuid === "undefined")
                return;

            var _card = PLAYBOARD_MANAGER.GetCardByUuid(jsonChar.uuid);
            if (_card === null)
            {
                console.log("Cannot get card from " + jsonChar.uuid);
                return;
            }

            var pChar = PLAYBOARD_MANAGER.getCharacterByUuid(jsonChar.uuid);
            if (pChar === null)
                return;

            var elem = {
                    character : _card,
                    resources : [],
                    hazards : [],
                    influenced : [] // in itself a list of characters (i.e. this elem field)
            };

            if (pChar.resources !== "undefined" && pChar.resources.length > 0)
                addGeneric(pChar.resources, elem.resources);

            if (pChar.hazards !== "undefined" && pChar.hazards.length > 0)
                addGeneric(pChar.hazards, elem.hazards);

            if (typeof jsonChar.influenced !== "undefined")
            {
                for (var i = 0; i < jsonChar.influenced.length; i++)
                   addCharacter({uuid : jsonChar.influenced[i], influenced : []}, elem.influenced);
            }

            targetList.push(elem);
        }

        var company = {
            id : companyId,
            characters : [],
            sites : PLAYBOARD_MANAGER.GetCompanyAttachedLocationCards(companyId),
            playerId : PLAYBOARD_MANAGER.companies[companyId].playerId
        };

        var vsChars = PLAYBOARD_MANAGER.companies[companyId].characters;
        for (var i = 0; i < vsChars.length; i++)
            addCharacter(vsChars[i], company.characters);

        return company;
    };
    
    /**
     * Get the first company character card by company id
     * @param {String} companyId
     * @return json or null
     */
    PLAYBOARD_MANAGER.GetFirstCompanyCharacterCardByCompanyId = function(companyId)
    {
        if (companyId === "" || typeof PLAYBOARD_MANAGER.companies[companyId] === "undefined")
        {
            console.log("Cannot find company by its id " + companyId + " (GetFirstCompanyCharacterCardByCompanyId)");
            return null;
        }

        var vsChars = PLAYBOARD_MANAGER.companies[companyId].characters;
        for (var i = 0; i < vsChars.length; i++)
            return PLAYBOARD_MANAGER.GetCardByUuid(vsChars[i].uuid);

        return null;
    };

    /**
     * Transfer a RESOURCE/HAZARD between characters
     * 
     * @param {String} sourceCharacter
     * @param {String} targetCharacter
     * @param {String} cardUuid
     * @param {String} playerId
     * @returns {Boolean}
     */
    PLAYBOARD_MANAGER.CharacterTransferCard = function(sourceCharacter, targetCharacter, cardUuid, playerId)
    {
        var pTargetChar = PLAYBOARD_MANAGER.characters[targetCharacter];
        if (typeof pTargetChar === "undefined")
        {
            console.log("Undefinied target character "+ targetCharacter);
            return false;
        }

        var pCard = PLAYBOARD_MANAGER.GetCardByUuid(cardUuid);
        if (pCard === null)
        {
            console.log("Cannot find card " + cardUuid);
            return false;
        }
        else if (pCard.type !== "hazard" && pCard.type !== "resource")
        {
            console.log("Can only transfer hazards or resources");
            return false;
        }
        else if (!PLAYBOARD_MANAGER.removeCardFromDeckOrCompany(playerId, cardUuid))
        {
            console.log("Cannot remove card form source owner");
            return false;
        }

        if (pCard.type === "hazard")
            pTargetChar.hazards.push(cardUuid);
        else // ist klar wg. IF type check ;; if (pCard.type === "resource")
            pTargetChar.resources.push(cardUuid);

        return true;
    };

    /**
     * Remove a card from the hand/deck or onboard company
     * 
     * @param {String} playerId
     * @param {String} uuid
     * @returns {Boolean}
     */
    PLAYBOARD_MANAGER.removeCardFromDeckOrCompany = function(playerId, uuid)
    {
        var pDeck = PLAYBOARD_MANAGER.decks.getPlayerDeck(playerId);
        if (pDeck === null)
        {
            console.log("Cannot find player deck" + playerId);
            return false;
        }

        // remove chard from deck 
        if (pDeck.pop().fromAnywhere(uuid))
            return true;

        var i;
        for (i in PLAYBOARD_MANAGER.characters)
        {
            if (removeFromList(uuid, PLAYBOARD_MANAGER.characters[i].resources) || removeFromList(uuid, PLAYBOARD_MANAGER.characters[i].hazards))
                return true;
        }

        for (i in PLAYBOARD_MANAGER.stagingareas)
        {
            if (removeFromList(uuid, PLAYBOARD_MANAGER.stagingareas[i].resources) || removeFromList(uuid, PLAYBOARD_MANAGER.stagingareas[i].hazards))
                return true;
        }
        
        /* at last, it might be an onguard card */
        return PLAYBOARD_MANAGER.PopOnGuardCard(uuid);
    };

    PLAYBOARD_MANAGER.PopOnGuardCard = function(cardUuid)
    {
        let _list, count, _uuid;
        for (let key in PLAYBOARD_MANAGER.companies) 
        {
            _list = PLAYBOARD_MANAGER.companies[key].sites.attached;
            count = _list.length;
            for (let i = count - 1; i >= 0; i--)
            {
                _uuid = _list[i];
                if (_uuid === cardUuid)
                {
                    _list.splice(i, 1);
                    return true;
                }
            }
        }

        return false;
    };
    
    /**
     * Check if there is a deck available
     * @param {String} playerId
     * @return {Boolean}
     */
    PLAYBOARD_MANAGER.HasDeck = function(playerId)
    {
        return PLAYBOARD_MANAGER.decks.getPlayerDeck(playerId) !== null;
    };
    
    /**
     * Let a character host a card from hand or stage
     * 
     * @param {String} company Company Id
     * @param {String} character Target Character Id
     * @param {String} uuid Card Uuid
     * @param {String} playerId
     * @param {Boolean} bFromHand
     * @returns {Boolean}
     */
    PLAYBOARD_MANAGER.CharacterHostCard = function(company, character, uuid, bFromHand, playerId)
    {
        var pCard = PLAYBOARD_MANAGER.GetCardByUuid(uuid);
        if (pCard === null)
        {
            console.log("Cannot find card " + uuid);
            return false;
        }

        playerId = pCard.owner;

        var pDeck = PLAYBOARD_MANAGER.decks.getPlayerDeck(playerId);
        if (pDeck === null)
        {
            console.log("Cannot get player deck " + playerId);
            return false;
        }

        // remove chard from deck, character or staging area
        if (!PLAYBOARD_MANAGER.removeCardFromDeckOrCompany(playerId, uuid))
        {
            console.log("Could not remove card " + uuid);
            return false;
        }

        if (pCard.type === "hazard")
            PLAYBOARD_MANAGER.characters[character].hazards.push(uuid);
        else
            PLAYBOARD_MANAGER.characters[character].resources.push(uuid);

        return true;
    };

    /**
     * Move a card to the staging area from a players HAND
     * @param {String} uuid
     * @param {String} playerSourceId
     * @param {String} playerTagetId
     * @returns {boolean}
     */
    PLAYBOARD_MANAGER.MoveCardToStagingArea = function(uuid, playerSourceId, playerTagetId)
    {
        var pCard = PLAYBOARD_MANAGER.GetCardByUuid(uuid);
        if (pCard === null)
            return false;

        if (!PLAYBOARD_MANAGER.removeCardFromDeckOrCompany(playerSourceId, uuid))
        {
            console.log("Could not remove card " + uuid + " from deck of company/staging area");
            return false;
        }

        var pStagingArea = typeof PLAYBOARD_MANAGER.stagingareas[playerTagetId] === "undefined" ? null : PLAYBOARD_MANAGER.stagingareas[playerTagetId];
        if (pStagingArea === null)
            return false;

        if (pCard.type === "hazard")
            pStagingArea.hazards.push(uuid);
        else
            pStagingArea.resources.push(uuid);

        return true;
    },

    PLAYBOARD_MANAGER.GetStagingCards = function(playerId, isResources)
    {
        if (PLAYBOARD_MANAGER.stagingareas[playerId] === "undefined")
            return [];
        else if (isResources)
            return PLAYBOARD_MANAGER.stagingareas[playerId].resources;
        else
            return PLAYBOARD_MANAGER.stagingareas[playerId].hazards;
    };

    PLAYBOARD_MANAGER.GetFullCompanyCharacter = function(companyId, uuid)
    {
        function addGeneric(listUuids)
        {
            if (typeof listUuids === "undefined")
                return [];

            var res = [];
            for (var i = 0; i < listUuids.length; i++)
            {
                var _card = PLAYBOARD_MANAGER.GetCardByUuid(listUuids[i]);
                if (_card !== null)
                    res.push(_card);
            }

            return res;
        }

        function getParent(uuid)
        {
            var pCard = PLAYBOARD_MANAGER.GetCardByUuid(uuid);
            if (pCard === null)
                return "";
            else
                return pCard.code;
        }

        if (companyId === "" || !PLAYBOARD_MANAGER.companyExists(companyId))
        {
            console.log("Cannot find company by its id " + companyId + " (GetFullCompanyCharacter)");
            return null;
        }

        var pCharacter = PLAYBOARD_MANAGER.getCharacterByUuid(uuid);
        if (pCharacter === null)
        {
            console.log("Character " + uuid + " does not exist.");
            return null;
        }

        return {
            companyId : pCharacter.companyId,
            parent : getParent(pCharacter.parentUuid),
            character : PLAYBOARD_MANAGER.GetCardByUuid(uuid),
            resources : addGeneric(pCharacter.resources),
            hazards : addGeneric(pCharacter.hazards),
            influenced : []
        };
    };

    /**
     * Create a new character entry
     * 
     * @param {String} companyId
     * @param {String} characterUuid
     * @returns {Object}
     */
    function createNewCharacter(companyId, characterUuid)
    {
        return {
            companyId : companyId,
            character : characterUuid,
            uuid : characterUuid,
            parentUuid : "",
            resources : [],
            hazards : []
        }; 
    }

    function linearizeCompanyCharacter(companyCharacter)
    {
        var list = [];

        if (typeof companyCharacter.influenced === "undefined" || typeof companyCharacter.uuid === "undefined" )
            return list;

        for (var y = 0; y < companyCharacter.influenced.length; y++)
            list.push(companyCharacter.influenced[y]);

        list.push(companyCharacter.uuid);
        return list;
    }

    /**
     * Add a company character to a given target company. It does not check if the company character is already in this company!
     * 
     * @param {String} targetCompanyId
     * @param {String} hostingCharacterUuid ID or empty (=general influence)
     * @param {JSON} companyCharacter
     * @returns {Boolean}
     */
    function addCompanyCharacterToCompany(targetCompanyId, hostingCharacterUuid, companyCharacter)
    {
        var targetCompany = PLAYBOARD_MANAGER.companies[targetCompanyId];
        if (typeof targetCompany === "undefined")
        {
            console.log("Target company does not exist: " + targetCompanyId);
            return false;
        }

        var listAdded = [];

        if (hostingCharacterUuid === "") /* add to target company list */
        {
            targetCompany.characters.push(companyCharacter);
            listAdded.push(companyCharacter.uuid);
        }
        else
        {
            var _host;

            listAdded = linearizeCompanyCharacter(companyCharacter);
            for (var i = 0; i < targetCompany.characters.length; i++)
            {
                _host = targetCompany.characters[i];
                if (_host.uuid === hostingCharacterUuid)
                {
                    for (var y = 0; y < listAdded.length; y++)
                        _host.influenced.push(listAdded[y]);

                    break;
                }
            }
        }

        for (var y = 0; y < listAdded.length; y++)
        {
            var _uuid = listAdded[y];
            PLAYBOARD_MANAGER.characters[_uuid].companyId = targetCompanyId;
            PLAYBOARD_MANAGER.characters[_uuid].parentUuid = hostingCharacterUuid;
        }

        return true;
    }


    /**
     * Create a new company character which can be added to a company
     * 
     * @param {type} uuid
     * @param {type} listInfluencedUUids
     * @returns {nm$_playboard-management.createCompanyCharacter.playboard-managementAnonym$2}
     */
    function createCompanyCharacter(uuid, listInfluencedUUids)
    {
        var list = [];
        for (var i = 0; i < listInfluencedUUids.length; i++)
            list.push(listInfluencedUUids[i]);

        return {
            uuid : uuid,
            influenced : list
        };
    }

    function createNewCompanyWithCharacter(companyId, playerId, hostUuid, listInfluencedUUids, startingLocation)
    {
        var list = [];
        for (var i = 0; i < listInfluencedUUids.length; i++)
            list.push(listInfluencedUUids[i]);

        return {
                id : companyId,
                playerId : playerId,
                characters : [ createCompanyCharacter(hostUuid,listInfluencedUUids) ],
                sites: {
                    current: startingLocation,
                    regions: [],
                    target: "",
                    attached : []
                }
        };
    }

    /**
     * Get a characters current location
     * @param {String} uuid
     * @return {String} Location Code
     */
    function getCharactersCurrentLocation(uuid)
    {
        var _list, _companyCharacter, _found;
        for (var key in PLAYBOARD_MANAGER.companies)
        {
            _list = PLAYBOARD_MANAGER.companies[key].characters;
            for (var i = 0; i < _list.length; i++)
            {
                _found = false;
                _companyCharacter = PLAYBOARD_MANAGER.companies[key].characters[i];
                if (_companyCharacter.uuid === uuid)
                    _found = true;
                else /* check influenced characters */
                {
                    for (var y = 0; y < _companyCharacter.influenced.length; y++)
                    {
                        if (_companyCharacter.influenced[y] === uuid)
                            _found = true;
                    }
                }

                if (_found)
                    return PLAYBOARD_MANAGER.companies[key].sites.current;
            }
        }

        return "";
    }


    /**
     * Remove a character from a company
     * 
     * @param {String} uuid Character UUID
     * @returns {json} { uuid: uuid, sourceCompany : "", influenced : [] }
     */
    function popCompanyCharacter(uuid)
    {
        /**
         * Remove a character (and its influenced characters) form its company
         * @param {String} uuid
         * @returns {json} { uuid: uuid, sourceCompany : "", influenced : [] }
         */
        function doPop(uuid)
        {
            var card = {
                uuid: uuid,
                sourceCompany : "",
                influenced : []
            };

            var _list, _companyCharacter;
            for (var key in PLAYBOARD_MANAGER.companies)
            {
                card.sourceCompany = key;

                _list = PLAYBOARD_MANAGER.companies[key].characters;
                for (var i = 0; i < _list.length; i++)
                {
                    _companyCharacter = PLAYBOARD_MANAGER.companies[key].characters[i];
                    if (_companyCharacter.uuid === uuid)
                    {
                        /* pop character and all influenced characters */
                        card.uuid = _companyCharacter.uuid;
                        for (var y = 0; y < _companyCharacter.influenced.length; y++)
                            card.influenced.push(_companyCharacter.influenced[y]);

                        _list.splice(i, 1);
                        return card;
                    }
                    else /* check influenced characters */
                    {
                        for (var y = 0; y < _companyCharacter.influenced.length; y++)
                        {
                            if (_companyCharacter.influenced[y] === uuid)
                            {
                                _companyCharacter.influenced.splice(y, 1);
                                return card;
                            }
                        }
                    }
                }
            }

            console.log("Character has not yet been in any other company.");
            return card;
        }

        return doPop(uuid);
    }

    /**
     * Remove all onguard cards for a given company
     * @param {String} companyUuid
     * @return {void}
     */
    PLAYBOARD_MANAGER.discardCompanyOnGuardCards = function(companyUuid)
    {
        if (!PLAYBOARD_MANAGER.companyExists(companyUuid))
            return;

        var _uuid, jCard, pDeck;
        var vsSites = PLAYBOARD_MANAGER.companies[companyUuid].sites.attached;
        for (var i = 0; i < vsSites.length; i++)
        {
            _uuid = vsSites[i];
            jCard = PLAYBOARD_MANAGER.GetCardByUuid(_uuid);
            pDeck = jCard === null ? null : PLAYBOARD_MANAGER.decks.getPlayerDeck(jCard.owner);
            if (pDeck !== null)
                pDeck.push().toDiscardpile(_uuid);
        }

        PLAYBOARD_MANAGER.companies[companyUuid].sites = [];
    };

    /**
     * Remove a single card from site onguard list
     * @param {String} uuid
     * @param {String} companyUuid
     * @return {Boolean} success
     */
    PLAYBOARD_MANAGER.discardCompanyOnGuardCard = function(uuid, companyUuid)
    {
        if (!PLAYBOARD_MANAGER.companyExists(companyUuid))
            return false;

        let _uuid, jCard, pDeck;
        let vsSites = PLAYBOARD_MANAGER.companies[companyUuid].sites.attached;
        for (let i = vsSites.length - 1; i >= 0; i--)
        {
            _uuid = vsSites[i];
            if (_uuid !== uuid)
                continue;

            jCard = PLAYBOARD_MANAGER.GetCardByUuid(_uuid);
            pDeck = jCard === null ? null : PLAYBOARD_MANAGER.decks.getPlayerDeck(jCard.owner);
            if (pDeck !== null)
            {
                pDeck.push().toDiscardpile(_uuid);
                vsSites.splice(i, 1);
                return true;
            }
        }

        return false;
    };

    /**
     * Remove empty companies 
     * @returns {Array|String} List of company ids removed 
     */
    PLAYBOARD_MANAGER.removeEmptyCompanies = function()
    {
        var keys = [];
        for (var key in PLAYBOARD_MANAGER.companies)
        {
            if (PLAYBOARD_MANAGER.companies[key].characters.length === 0)
            {
                PLAYBOARD_MANAGER.discardCompanyOnGuardCards(key);
                keys.push(key);
            }
        }

        for (var i = 0; i < keys.length; i++)
        {
            console.log("Company " + key + " is empty and will be removed.");
            delete PLAYBOARD_MANAGER.companies[keys[i]];
        }

        return keys;
    };

    /**
     * Create a new company
     * 
     * @param {type} uuid Character UUID
     * @param {type} source 
     * @param {type} playerId
     * @returns {String} Company Id
     */
    PLAYBOARD_MANAGER.CreateNewCompany = function(uuid, source, playerId)
    {
        if (uuid === "" || source === "" || playerId === "")
            return "";

        const pDeck = PLAYBOARD_MANAGER.decks.getPlayerDeck(playerId);
        if (pDeck === null)
            return "";

        let vsInfluenced = [];
        let currentLocation = "";

        const companyId = PLAYBOARD_MANAGER.obtainUniqueCompanyId(playerId);
        if (source === "hand")
        {
            pDeck.pop().fromHand(uuid);
        }
        else
        {
            currentLocation = getCharactersCurrentLocation(uuid);
            vsInfluenced = popCompanyCharacter(uuid).influenced;
        }

        PLAYBOARD_MANAGER.companies[companyId] = createNewCompanyWithCharacter(companyId, playerId, uuid, vsInfluenced, currentLocation);

        if (PLAYBOARD_MANAGER.characters[uuid] === undefined)
            PLAYBOARD_MANAGER.characters[uuid] = createNewCharacter(companyId, uuid);

        PLAYBOARD_MANAGER.characters[uuid].parentUuid = "";
        PLAYBOARD_MANAGER.characters[uuid].companyId = companyId;

        return companyId;
    };

    /**
     * Join a company
     * 
     * @param {String} uuid Character to join
     * @param {String} source 
     * @param {String} companyId target company
     * @param {String} playerId player id
     * @returns {Boolean} Success state
     */
    PLAYBOARD_MANAGER.JoinCompany = function(uuid, source, companyId, playerId)
    {
        var pDeck = PLAYBOARD_MANAGER.decks.getPlayerDeck(playerId);
        if (pDeck === null)
        {
            console.log("Cannot find player deck");
            return false;
        }

        if (source === "hand")
        {
            pDeck.pop().fromHand(uuid);

            PLAYBOARD_MANAGER.companies[companyId].characters.push({ uuid: uuid, influenced : [] });
            PLAYBOARD_MANAGER.characters[uuid] = createNewCharacter(companyId, uuid);
        }
        else
        {
            var card = popCompanyCharacter(uuid);
            if (!addCompanyCharacterToCompany(companyId, "", card))
            {
                console.log("Character " + uuid + " cannot join company " + companyId);
                return false;
            }
        }

        return true;
    };

    /**
     * Join another character -- only possible if character does not theirself has
     * other characters under direct influence
     * 
     * @param {String} uuid Character to join
     * @param {String} targetcharacter target host character
     * @param {String} targetCompany target company
     * @param {String} playerId player id
     * @returns {String} Company Id
     */
    PLAYBOARD_MANAGER.JoinCharacter = function(uuid, targetcharacter, targetCompany, playerId)
    {
        function getCardCode(uuid, sDefault)
        {
            var card = PLAYBOARD_MANAGER.GetCardByUuid(uuid);
            return card !== null ? card.code : sDefault;
        }

        /* create character card info if necessary (e.g. if played from hand) */
        if (typeof PLAYBOARD_MANAGER.characters[uuid] === "undefined")
            PLAYBOARD_MANAGER.characters[uuid] = createNewCharacter(targetCompany, uuid);

        var card = popCompanyCharacter(uuid);
        if (!addCompanyCharacterToCompany(targetCompany, targetcharacter, card))
        {
            let sNew = getCardCode(uuid, "Unknown character");
            console.log("Character " + sNew + " cannot join company " + targetCompany);
            return false;
        }
        else
        {
            let sNew = getCardCode(uuid, "Unknown character");
            let sHost = getCardCode(targetcharacter, "unknown host");
            console.log("Character " + sNew + " joined " + sHost + " under direct influence in company " + targetCompany);
            return true;
        }
    };

    PLAYBOARD_MANAGER.AddToPile = function(uuid, owner, type)
    {
        var pDeck = PLAYBOARD_MANAGER.decks.getPlayerDeck(owner);
        if (pDeck === null)
            return false;

        if (type === "victory")
            return pDeck.push().toVictory(uuid);
        else if (type === "discard")
            return pDeck.push().toDiscardpile(uuid);
        else
            return false;
    };

    /**
     * Move a single card from anywhere to ...
     * 
     * @param {String} uuid
     * @param {String} playerId
     * @param {String} target "sideboard, discardpile, playdeck, hand"&&
     * @returns {Boolean}
     */
    PLAYBOARD_MANAGER.MoveCardTo = function(uuid, playerId, target)
    {
        var jCard = PLAYBOARD_MANAGER.GetCardByUuid(uuid);
        if (jCard === null)
            return false;

        var pDeck = PLAYBOARD_MANAGER.decks.getPlayerDeck(playerId);
        if (pDeck === null)
            return false;

        if (!PLAYBOARD_MANAGER.removeCardFromDeckOrCompany(jCard.owner, uuid))
        {
            console.log("Could not remove card " + uuid + " from deck of company/staging area nor from location on guard lists");
            return false;
        } 

        jCard.owner = playerId;

        switch(target)
        {
            case "victory":
                return pDeck.push().toVictory(uuid);

            case "sideboard":
                return pDeck.push().toSideboard(uuid);

            case "discardpile":
            case "discard":
                return pDeck.push().toDiscardpile(uuid);

            case "playdeck":
                return pDeck.push().toPlaydeck(uuid);

            case "hand":
                {
                    let jCard = PLAYBOARD_MANAGER.GetCardByUuid(uuid);
                    if (jCard !== null)
                    {
                        if (jCard.agent === true)
                            jCard.revealed = false;
                    }
                }
                
                return pDeck.push().toHand(uuid);

            default:
                console.log("Unknown target " + target);
                break;
        }

        return false;
    };

    /**
     * Set the companies current location
     * @param {String} companyUuid
     * @param {String} sLocationCode
     * @returns {void} 
     */
    PLAYBOARD_MANAGER.SetCompanyStartSite = function(companyUuid, sStart, vsRegions, sTarget)
    {
        if (PLAYBOARD_MANAGER.companies[companyUuid] !== undefined)
        {
            let jCompanySites = PLAYBOARD_MANAGER.companies[companyUuid].sites;
            jCompanySites.current = sStart;
            jCompanySites.regions = vsRegions;
            jCompanySites.target = sTarget;
            jCompanySites.revealed = false;
        }
    };

    /**
     * Remove a card form owners hand
     * 
     * @param {String} _uuid
     * @return {PLAYBOARD_MANAGER.PopCardFromHand.card|nm$_playboard-management.PLAYBOARD_MANAGER.PopCardFromHand.card}
     */
    PLAYBOARD_MANAGER.PopCardFromHand = function(_uuid)
    {
        const card = PLAYBOARD_MANAGER.GetCardByUuid(_uuid);
        if (card === null)
            return null;

        const pDeck = PLAYBOARD_MANAGER.decks.getPlayerDeck(card.owner);
        if (pDeck === null)
            return null;

        pDeck.pop().fromHand(_uuid);
        return card;
    };

    /**
     * Add a hazard to a company location
     * @param {String} cardUuid
     * @param {String} companyUuid
     * @returns {success state} 
     */
    PLAYBOARD_MANAGER.AddHazardToCompanySite = function(cardUuid, companyUuid)
    {
        if (!PLAYBOARD_MANAGER.companyExists(companyUuid))
        {
            console.log("Cannot find company " + companyUuid);
            return false;
        }

        let vsSites = PLAYBOARD_MANAGER.companies[companyUuid].sites.attached;
        for (let i = 0; i < vsSites.length; i++)
        {
            if (cardUuid === vsSites[i])
                return false;
        }

        vsSites.push(cardUuid);
        return true;
    };

    /**
     * Reveal company sites
     * @param {String} companyUuid
     * @returns {void} 
     */
    PLAYBOARD_MANAGER.RevealCompanyDestinationSite = function(companyUuid)
    {
        if (PLAYBOARD_MANAGER.companyExists(companyUuid))
            PLAYBOARD_MANAGER.companies[companyUuid].sites.revealed = true;
    };

    PLAYBOARD_MANAGER.CompanyArrivedAtDestination = function(companyUuid)
    {
        if (!PLAYBOARD_MANAGER.companyExists(companyUuid))
            return;
        
        var jCompanySites = PLAYBOARD_MANAGER.companies[companyUuid].sites;
        if (jCompanySites.target !== "")
        {
            jCompanySites.current = jCompanySites.target;
            jCompanySites.target = "";
        }

        jCompanySites.regions = [];
        jCompanySites.revealed = false;
    };

    PLAYBOARD_MANAGER.FlipCard = function(uuid)
    {
        return PLAYBOARD_MANAGER.decks.flipCard(uuid);
    };
    
    PLAYBOARD_MANAGER.SetSiteState = function(playerId, code, nState)
    {
        if (nState === 0)
            PLAYBOARD_MANAGER.decks.readySite(playerId, code);
        else if (nState === 90)
            PLAYBOARD_MANAGER.decks.tapSite(playerId, code);
    };
    PLAYBOARD_MANAGER.IsSiteTapped = function(playerId, code)
    {
        return PLAYBOARD_MANAGER.decks.siteIsTapped(playerId, code);
    };

    PLAYBOARD_MANAGER.GetTappedSites = function(playerId)
    {
        return PLAYBOARD_MANAGER.decks.getTappedSites(playerId);
    };
    
    PLAYBOARD_MANAGER.SetCardState = function(uuid, nState)
    {
        if (nState === 0)
            PLAYBOARD_MANAGER.decks.readyCard(uuid);
        else if (nState === 90)
            PLAYBOARD_MANAGER.decks.tapCard(uuid);
        else if (nState === 91)
            PLAYBOARD_MANAGER.decks.tapCardFixed(uuid);
        else if (nState === 180)
            PLAYBOARD_MANAGER.decks.woundCard(uuid);
        else if (nState === 270)
            PLAYBOARD_MANAGER.decks.triceTapCard(uuid);
    };


    PLAYBOARD_MANAGER.ReadyCompanyCards = function(companyUuid)
    {
        function readyCard(uuid)
        {
            if (PLAYBOARD_MANAGER.decks.isStateTapped(uuid))
                PLAYBOARD_MANAGER.decks.readyCard(uuid);
        }

        function readyResources(uuid)
        {
            if (!PLAYBOARD_MANAGER.characterExists(uuid))
            {
                console.log("character does not exist: " + uuid);
                return;
            }

            var _companyCharacter = PLAYBOARD_MANAGER.characters[uuid];
            for (var i = 0; i < _companyCharacter.resources.length; i++)
                readyCard(_companyCharacter.resources[i]);
        }

        if (!PLAYBOARD_MANAGER.companyExists(companyUuid))
        {
            console.log("Company does not exist.");
            return;
        }

        var _companyCharacter, _characterInfuenced;
        var _list = PLAYBOARD_MANAGER.companies[companyUuid].characters;
        for (var i = 0; i < _list.length; i++)
        {
            _companyCharacter = _list[i];

            readyCard(_companyCharacter.uuid);
            readyResources(_companyCharacter.uuid);

            for (var y = 0; y < _companyCharacter.influenced.length; y++)
            {
                _characterInfuenced = _companyCharacter.influenced[y];

                readyCard(_characterInfuenced);
                readyResources(_characterInfuenced);
            }
        }
    };

    /**
     * Move a CHARACTER card from anywhere to ...
     * 
     * @param {String} characterUuid
     * @param {String} playerId
     * @param {String} target "sideboard, discardpile, playdeck, hand"
     * @returns {List} list of cards moved
     */
    PLAYBOARD_MANAGER.MoveCardCharacterTo = function(characterUuid, playerId, target)
    {
        function moveCard(cardUuid, target)
        {
            const jCard = PLAYBOARD_MANAGER.GetCardByUuid(cardUuid);
            if (jCard === null)
                return false;

            var pDeck = PLAYBOARD_MANAGER.decks.getPlayerDeck(jCard.owner);
            if (pDeck === null)
                return false;
            
            /* a tapped nazgul event shoud not be tapped if re-played again */
            PLAYBOARD_MANAGER.decks.readyCard(cardUuid);
            
            switch(target)
            {
                case "victory":
                    return pDeck.push().toVictory(cardUuid);

                case "sideboard":
                    return pDeck.push().toSideboard(cardUuid);

                case "discardpile":
                case "discard":
                    return pDeck.push().toDiscardpile(cardUuid);

                case "playdeck":
                    return pDeck.push().toPlaydeck(cardUuid);

                case "hand":
                    return pDeck.push().toHand(cardUuid);

                default:
                    console.log("Unknown target " + target);
                    break;
            }

            return false;
        }

        if (!isValidTarget(target))
            return [];

        var list = PLAYBOARD_MANAGER.PopCharacterAndItsCards(characterUuid);
        for (var i = 0; i  < list.length; i++)
            moveCard(list[i], target);
        
        if (PLAYBOARD_MANAGER.PopOnGuardCard(characterUuid))
        {
            moveCard(characterUuid, target);
            if (list.length === 0)
                list = [characterUuid];
            else if (!list.includes(characterUuid))
                list.push(characterUuid);
        }
        
        return list;
    };

    /**
     * Move a CHARACTER card from anywhere to ...
     * 
     * @param {String} characterUuid
     * @param {String} playerId
     * @param {String} target "sideboard, discardpile, playdeck, hand"
     * @returns {List} list of cards moved
     */
    PLAYBOARD_MANAGER.PopCharacterAndItsCards = function(characterUuid, target)
    {
        function popCharacterCards(characterUuid)
        {
            var pCharacter = PLAYBOARD_MANAGER.getCharacterByUuid(characterUuid);
            if (pCharacter === null)
            {
                /** 
                 * Character has not been found, i.e. is to be popped from hand.
                 * Anyway, we are done here
                 */
                return [];
            }

            var vsCards = [];
            for (var i = 0; i < pCharacter.resources.length; i++)
                vsCards.push(pCharacter.resources[i]);

            for (var i = 0; i < pCharacter.hazards.length; i++)
                vsCards.push(pCharacter.hazards[i]);

            vsCards.push(characterUuid);

            pCharacter.resources = [];
            pCharacter.hazards = [];

            return vsCards;
        }

        function popCards(characterUuid)
        {
            // get the list of affected company characters
            var character = popCompanyCharacter(characterUuid); // { uuid: uuid, sourceCompany : "", influenced : [] }

            var cardList = popCharacterCards(characterUuid);
            if (cardList.length === 0)
                return [];

            for (var i = 0; i < character.influenced.length; i++)
            {
                var list = popCharacterCards(character.influenced[i]);
                if (list.length !== 0)
                {
                    //console.log("delete influenced character " + character.influenced[i]);
                    delete PLAYBOARD_MANAGER.characters[character.influenced[i]];
                    for (var y = 0; y < list.length; y++)
                        cardList.push(list[y]);
                }
            }

            if (typeof PLAYBOARD_MANAGER.characters[character.uuid] !== "undefined")
                delete PLAYBOARD_MANAGER.characters[character.uuid];

            return cardList;
        }
        
        return popCards(characterUuid);
    };
    
    return PLAYBOARD_MANAGER;
}

const DeckManagerDefault = require("./deckmanager-default");
const DeckManagerArda = require("./deckmanager-arda");

const newDeckManagerInstance = function(isArda, isSinglePlayer)
{
    return isArda || isSinglePlayer ? new DeckManagerArda(isSinglePlayer) : new DeckManagerDefault();
}

/**
 * Create a new Game
 * @param {Array} _agentList 
 * @returns 
 */
 exports.setup = function(_agentList, _eventManager, _gameCardProvider, isArda, isSinglePlayer) 
 {
     const pDeckManager = newDeckManagerInstance(isArda, isSinglePlayer);
     return new PlayBoardManagement(pDeckManager, _agentList, _eventManager, _gameCardProvider);
 };