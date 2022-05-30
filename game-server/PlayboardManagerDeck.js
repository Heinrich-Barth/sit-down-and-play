const PlayboardManagerBase = require("./PlayboardManagerBase");
const DeckManagerDefault = require("./DeckManagerDefault");

class PlayboardManagerDeck extends PlayboardManagerBase {


    constructor(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer)
    {
        super(_eventManager);
        
        this.decks = this.requireDeckManager(isSinglePlayer);
        this.gameCardProvider = _gameCardProvider;
        this.agents = _listAgents === undefined ? [] : _listAgents;
    }

    requireDeckManager(_isSinglePlayer)
    {
        return new DeckManagerDefault();
    }

    getDecks()
    {
        return this.decks;
    }
    
    reset()
    {
        super.reset();
        
        if (this.decks !== null)
            this.decks.reset();
    }

    UpdateOwnership(playerId, pCard)
    {
        if (pCard !== null && playerId !== undefined && playerId !== "")
            pCard.owner = playerId;
    }
    /**
     * Get the top X cards
     * @param {String} playerId
     * @param {Integer} nCount
     * @returns {Array} List or empty list
     */
    GetTopCards(playerId, nCount)
    {
        let res = [];

        let _card;
        let list = this.getDecks().getCards().hand(playerId);
        for (let i = 0; i < list.length && i < nCount; i++)
        {
            _card = this.getDecks().getFullPlayerCard(list[i]);
            
            if (_card !== null)
            {
                this.UpdateOwnership(playerId, _card);
                res.push({uuid:_card.uuid,code:_card.code, type:_card.type, status:_card.status, owner: _card.owner});
            }
        }

        return res;
    }

    _drawCard(playerId, bOnlyGetTopCard)
    {
        let _uuid = "";
        if (bOnlyGetTopCard)
        {
            const list = this.getDecks().getCards().hand(playerId);
            if (list.length > 0)
                _uuid = list[0];
        }
        else
        {
            const pDeck = this.getPlayerDeck(playerId);
            if (pDeck !== null)
            {
                if (pDeck.isEmptyPlaydeck())
                    this.getDecks().clearPlayerSites(playerId);

                _uuid = pDeck.draw();
            }
        }

        return _uuid;
    }

    DrawCard(playerId, bOnlyGetTopCard)
    {
        let _uuid = this._drawCard(playerId, bOnlyGetTopCard);
        if (_uuid === "")
            return null;

        const _card = this.getDecks().getFullPlayerCard(_uuid);
        if (_card === null)
            return null;
        else
        {
            _card.owner = playerId;
            return { uuid:_uuid,code:_card.code, type:_card.type, status:_card.status, owner: _card.owner };
        }
    }


    /**
     * Add a player deck to the game 
     * @param {String} playerId
     * @param {String} jsonDeck
     * @returns {Boolean}
     */
    AddDeck(playerId, jsonDeck)
    {
        this.getDecks().addDeck(playerId, jsonDeck, this.agents, this.gameCardProvider);
        return true;
    }

    /**
     * Save current game state
     * @returns Object
     */
    Save()
    {
        let data = super.Save();
        data.decks = this.getDecks().save();
        return data;
    }
 
    Restore(playboard)
    {
        super.Restore(playboard);
        this.getDecks().restore(playboard.decks);
     }

    readyCard(uuid)
    {
        if (this.getDecks().isStateTapped(uuid))
            this.getDecks().readyCard(uuid);
    }

    FlipCard(uuid)
    {
        return this.getDecks().flipCard(uuid);
    }
    
    SetSiteState(playerId, code, nState)
    {
        if (nState === 0)
            this.getDecks().readySite(playerId, code);
        else if (nState === 90)
            this.getDecks().tapSite(playerId, code);
    }
    
    IsSiteTapped(playerId, code)
    {
        return this.getDecks().siteIsTapped(playerId, code);
    }

    GetTappedSites(playerId)
    {
        return this.getDecks().getTappedSites(playerId);
    }
    
    SetCardState(uuid, nState)
    {
        if (nState === 0)
            this.getDecks().readyCard(uuid);
        else if (nState === 90)
            this.getDecks().tapCard(uuid);
        else if (nState === 91)
            this.getDecks().tapCardFixed(uuid);
        else if (nState === 180)
            this.getDecks().woundCard(uuid);
        else if (nState === 270)
            this.getDecks().triceTapCard(uuid);
    }

    Size(playerId)
    {
        return this.getDecks().size(playerId);
    }

    DumpDeck()
    {
        /** deprecated */
    }

    ShufflePlaydeck(playerId)
    {
        const deck = this.getPlayerDeck(playerId);
        if (deck !== null)
            deck.shuffle();
    }

    ShuffleDiscardpile(playerId)
    {
        const deck = this.getPlayerDeck(playerId);
        if (deck !== null)
            deck.shuffleDiscardpile();
    }

    GetCardsInSideboard(playerId)
    {
        return this.getCardList(this.getDecks().getCards().sideboard(playerId));
    }

    GetCardsInDiscardpile(playerId)
    {
        return this.getCardList(this.getDecks().getCards().discardpile(playerId));
    }

    GetCardsInPlaydeck(playerId)
    {
        return this.getCardList(this.getDecks().getCards().playdeck(playerId));
    }
    GetCardsInVictory(playerId)
    {
        return this.getCardList(this.getDecks().getCards().victory(playerId));
    }

    GetCardsInHand(playerId)
    {
        return this.getCardList(this.getDecks().getCards().hand(playerId));
    }

    GetCardsInVictoryShared()
    {
        return this.getCardList(this.getDecks().getCards().sharedVicory());
    }

    GetCardsInOutOfPlay()
    {
        return this.getCardList(this.getDecks().getCards().outofplay());
    }
    /**
     * Get full card detais of a card by its uuid
     * 
     * @param {String} uuid Card UUID
     * @returns {Object} JSON or NULL
     */
    GetCardByUuid(uuid)
    {
        return this.getDecks().getFullPlayerCard(uuid);
    }


    getCardList(vsList)
    {
        if (vsList === null || vsList === undefined)
            return [];
            
        let _newList = [];
        for (let _uuid  of vsList)
        {
            const _card = this.getDecks().getFullPlayerCard(_uuid);
            if (_card !== null && _card.code !== "")
                _newList.push({uuid:_uuid,code:_card.code, type:_card.type, status:_card.status,owner: _card.owner});
        }

        return _newList;
    }

    /**
     * Get Player deck
     * @param {String} playerId 
     * @returns 
     */
    getPlayerDeck(playerId)
    {
        const pDeck = this.getDecks().getPlayerDeck(playerId);
        if (pDeck === null)
            console.log("Cannot get player deck " + playerId);

        return pDeck;
    }

    /**
     * Check if there is a deck available
     * @param {String} playerId
     * @return {Boolean}
     */
    HasDeck(playerId)
    {
        return this.getPlayerDeck(playerId) !== null;
    }

    getCardCode(uuid, sDefault)
    {
        const card = this.GetCardByUuid(uuid);
        return card !== null ? card.code : sDefault;
    }

    AddToPile(uuid, owner, type)
    {
        const pDeck = this.getPlayerDeck(owner);
        if (pDeck === null)
            return false;

        if (type === "victory")
            return pDeck.push().toVictory(uuid);
        else if (type === "discard")
            return pDeck.push().toDiscardpile(uuid);
        else
            return false;
    }

    toCardList(listUuids)
    {
        if (typeof listUuids === "undefined")
            return [];

        let res = [];
        for (let uuid of listUuids)
        {
            const _card = this.GetCardByUuid(uuid);
            if (_card !== null)
                res.push(_card);
        }

        return res;
    }

    /**
      * Move a single card from anywhere to ...
      * 
      * @param {String} uuid
      * @param {String} pDeck
      * @param {String} target "sideboard, discardpile, playdeck, hand"&&
      * @returns {Boolean}
      */
     moveCardToDeckPile(uuid, pDeck, target)
     {
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

            case "outofplay":
                return pDeck.push().toOutOfPlay(uuid);

            case "hand":
                {
                    const _card = this.GetCardByUuid(uuid);
                    if (_card !== null)
                    {
                        if (_card.agent === true)
                            _card.revealed = false;
                    }
                }
                
                return pDeck.push().toHand(uuid);

            default:
                console.log("Unknown target " + target);
                break;
        }

        return false;
    }

    moveCard(cardUuid, target)
    {
        const jCard = this.GetCardByUuid(cardUuid);
        if (jCard === null)
            return false;

        const pDeck = this.getPlayerDeck(jCard.owner);
        if (pDeck === null)
            return false;
        
        /* a tapped nazgul event shoud not be tapped if re-played again */
        this.getDecks().readyCard(cardUuid);
        
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

    /**
     * Remove a card from the hand/deck or onboard company
     * 
     * @param {String} playerId
     * @param {String} uuid
     * @returns {Boolean}
     */
    removeCardFromDeckOrCompany(playerId, uuid)
    {
        const pDeck = this.getPlayerDeck(playerId);
        return pDeck !== null && pDeck.pop().fromAnywhere(uuid); // remove chard from deck 
    }
 
     
    /**
     * Add cards to the sideboard of a given player DURING the game!
     * @param {String} playerId
     * @param {String} jsonDeck
     * @returns {Number} Number of cards added or -1
     */
    AddDeckCardsToSideboard(playerId, jsonDeck)
    {
        return this.getDecks().addCardsToSideboardDuringGame(playerId, jsonDeck, this.agents, this.gameCardProvider);
    }

    /**
     * Add a card to the hand of a given player DURING the game!
     * 
     * @param {String} playerId Target player
     * @param {String} code Card Code
     * @param {Boolean} bAsCharacter Consider this card as a character OR a ressource
     * @returns {Number} Number of cards added or -1
     */
    ImportCardsToHand(playerId, code, bAsCharacter)
    {
        return this.getDecks().importCardsToHand(playerId, code, bAsCharacter, this.gameCardProvider);
    }
    
    isValidTarget(target)
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

    /**
      * Remove a card form owners hand
      * 
      * @param {String} _uuid
      * @return {card}
      */
    PopCardFromHand(_uuid)
    {
        const card = this.GetCardByUuid(_uuid);
        if (card === null)
            return null;

        const pDeck = this.getPlayerDeck(card.owner);
        if (pDeck === null)
            return null;
        else
        {
            pDeck.pop().fromHand(_uuid);
            return card;
        }
    }
}

module.exports = PlayboardManagerDeck;