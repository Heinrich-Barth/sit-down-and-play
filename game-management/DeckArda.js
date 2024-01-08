const DeckDefault = require("./DeckDefault");
const Logger = require("../Logger");

/**
 * Arda deck. Besides the standard deck features, it has common
 * hands/piles for characters, MPs and minor items.
 * 
 * Multiple Arda deck instances share the ADMINs various arrays
 * by reference. 
 * 
 * The first Deck instance is usually the admin which other arda deck instances
 * reference from.
 */
class DeckArda extends DeckDefault {

    constructor(playerId)
    {
        super(playerId)
        
        this.playdeckMP = [];
        this.handCardsMP = [];
        this.discardPileMP = [];

        this.handCardsCharacters = [];
        this.discardPileCharacters = [];
        this.playdeckCharacters = [];

        this.handStage = [];
        this.playdeckStage = [];
        this.discardPileStage = [];

        this.handMinorItems = [];
        this.discardPileMinorItems = [];
        this.playdeckMinorItems = [];

        this.playDeckCharacters7 = [];

        this.typesCharacters = [];
        this.typesMinors = [];
        this.typesMPs = [];
        this.typeStage = [];
        this.listSpecialCharacters = [];
    }

    /**
     * Get the number of cards allowed in an arda deck to avoid pollution
     * @returns Number
     */
    getMaxDeckSize()
    {
        return 1000;
    }

    /**
     * Save this deck. Only admin decks store additional hands and piles.
     * 
     * @param {Boolean} isAdmin 
     * @returns JSON
     */
    save(isAdmin)
    {
        let data = super.save(isAdmin);
        
        data.handCardsMP = this.handCardsMP;

        if (isAdmin)
        {
            data.playdeckMP = this.playdeckMP;
            data.discardPileMP = this.discardPileMP;
            data.handCardsCharacters = this.handCardsCharacters;
            data.discardPileCharacters = this.discardPileCharacters;
            data.playdeckCharacters = this.playdeckCharacters;
            data.handMinorItems = this.handMinorItems;
            data.discardPileMinorItems = this.discardPileMinorItems;
            data.playdeckMinorItems = this.playdeckMinorItems;
            data.playDeckCharacters7 = this.playDeckCharacters7;
            data.typesCharacters = this.typesCharacters;
            data.typesMinors = this.typesMinors;
            data.typesMPs = this.typesMPs;
            data.listSpecialCharacters = this.listSpecialCharacters;

            data.handStage = this.handStage;
            data.playdeckStage = this.playdeckStage;
            data.discardPileStage = this.discardPileStage;
            data.typeStage = this.typeStage;
        }

        return data;
    }

    /**
     * Restore a saved deck (from savegame)
     * @param {JSON} deck 
     */
    restore(deck)
    {
        super.restore(deck);

        this.restoreList(this.handCardsMP, deck.handCardsMP);

        if (deck.ishost === true)
        {
            this.restoreList(this.playdeckMP, deck.playdeckMP);
            this.restoreList(this.discardPileMP, deck.discardPileMP);
            this.restoreList(this.handCardsCharacters, deck.handCardsCharacters);
            this.restoreList(this.discardPileCharacters, deck.discardPileCharacters);
            this.restoreList(this.playdeckCharacters, deck.playdeckCharacters);
            this.restoreList(this.handMinorItems, deck.handMinorItems);
            this.restoreList(this.discardPileMinorItems, deck.discardPileMinorItems);
            this.restoreList(this.playdeckMinorItems, deck.playdeckMinorItems);
            this.restoreList(this.playDeckCharacters7, deck.playDeckCharacters7);
            this.restoreList(this.typesCharacters, deck.typesCharacters);
            this.restoreList(this.typesMinors, deck.typesMinors);
            this.restoreList(this.typesMPs, deck.typesMPs);
            this.restoreList(this.listSpecialCharacters, deck.listSpecialCharacters);

            this.restoreList(this.handStage, deck.handStage);
            this.restoreList(this.playdeckStage, deck.playdeckStage);
            this.restoreList(this.discardPileStage, deck.discardPileStage);
            this.restoreList(this.typeStage, deck.typeStage);
        }
    }

    /**
     * Add a deck.
     * @param {JSON} jsonDeck Deck
     * @param {Array} listAgents Agent list
     * @param {Object} _cardMap Card map to save card uuids of this deck
     * @param {Object} gameCardProvider 
     */
    addDeck(jsonDeck, _cardMap)
    {
        super.addDeck(jsonDeck, _cardMap);

        let nSize = 0;

        this.#copyIdsOpeningHand(this.handCards, _cardMap);

        /** minor items will be drawn to hand on startup */
        nSize = this.add(jsonDeck["minors"], this.handMinorItems, _cardMap);
        this.#copyIds(this.handMinorItems, this.typesMinors);

        Logger.info("Added " + nSize + " minor items");
        
        nSize = this.add(jsonDeck["mps"], this.playdeckMP, _cardMap);
        this.#copyIds(this.playdeckMP, this.typesMPs);
        this.#shuffleAnyTimes(this.playdeckMP, 3);
        Logger.info("Added " + nSize + " marshalling points cards");

        nSize = this.add(jsonDeck["chars_mind7"], this.playDeckCharacters7, _cardMap);
        this.#copyIds(this.playDeckCharacters7, this.typesCharacters);
        this.#shuffleAnyTimes(this.playDeckCharacters7, 3);
        Logger.info("Added " + nSize + " characters with mind of 6+");

        nSize = this.add(jsonDeck["chars_others"], this.playdeckCharacters, _cardMap);
        this.#copyIds(this.playdeckCharacters, this.typesCharacters);
        this.#shuffleAnyTimes(this.playdeckCharacters, 3);
        Logger.info("Added " + nSize + " characters with mind of 5-");

        this.add(jsonDeck["chars_special"], this.listSpecialCharacters, _cardMap);

        this.add(jsonDeck["stage"], this.playdeckStage, _cardMap);
        this.#copyIds(this.playdeckStage, this.playdeckStage);
        this.#shuffleAnyTimes(this.playdeckStage, 3);
        Logger.info("Added " + this.typeStage.length + " stage resources");
    }
    
    /**
     * Check if given uuid is included in the given array
     * 
     * @param {String} uuid 
     * @param {Array} list 
     * @returns 
     */
    #isInTypeList(uuid, list)
    {
        return uuid !== "" && list.includes(uuid);
    }

    /**
     * Check if this id represents a character card
     * @param {String} uuid 
     * @returns boolean
     */
    #isTypeCharacter(uuid)
    {
        return this.#isInTypeList(uuid, this.typesCharacters);
    }

    /**
     * Check if this id represents a MP card
     * @param {String} uuid 
     * @returns boolean
     */
    #isTypeMPs(uuid)
    {
        return this.#isInTypeList(uuid, this.typesMPs);
    }

    /**
     * Check if this id is a STAGE card
     * @param {String} uuid 
     * @returns boolean
     */
    #isTypeStage(uuid)
    {
        return this.#isInTypeList(uuid, this.typeStage);
    }

    /**
     * Check if this id represents a minor item card
     * @param {String} uuid 
     * @returns boolean
     */
    #isTypeMinorItem(uuid)
    {
        return this.#isInTypeList(uuid, this.typesMinors);
    }

    /**
     * Add a source array to the target array.
     * 
     * @param {Array} listSource 
     * @param {Array} listTarget 
     */
    #copyIds(listSource, listTarget)
    {
        const nLen = listSource.length;
        for (let i = 0; i < nLen; i++)
            listTarget.push(listSource[i]);
    }

    /**
     * Shuffle given list various times
     * @param {Array} list List to shuffle
     * @param {Number} nTimes Number of times a list is to be shuffled
     */
    #shuffleAnyTimes(list, nTimes)
    {
        for (let i = 0; i < nTimes; i++)
            this.shuffleAny(list);
    }

    /**
     * Shuffle minor and MPs cards
     */
    shuffleCommons()
    {
        this.shuffleMinorItems();
        this.shuffleMPs();
        this.shuffleStageCards();
    }

    /**
     * Shuffle playdeck minor items
     */
    shuffleStageCards()
    {
        this.shuffleAny(this.playdeckStage);
    }

    /**
     * Shuffle playdeck minor items
     */
    shuffleMinorItems()
    {
        this.shuffleAny(this.playdeckMinorItems);
    }

    /**
     * Shuffle playdeck MPS
     */
    shuffleMPs()
    {
        this.shuffleAny(this.playdeckMP);
    }

    /**
     * Create card uuid
     */
    createNewCardUuid()
    {
        return "a" + super.createNewCardUuid();
    }

    /**
     * Draw MP card (reshuffles automatically if deck is exhausted)
     * @returns Card uuid
     */
    drawCardMarshallingPoints()
    {
        if (this.playdeckMP.length === 0 && this.discardPileMP.length > 0)
        {
            this.moveList(this.discardPileMP, this.playdeckMP);
            this.shuffleAny(this.playdeckMP);
        }

        return this.transferCard(this.playdeckMP, this.handCardsMP);
    }

    /**
     * Draw stage card (reshuffles automatically if deck is exhausted)
     * @returns Card uuid
     */
    drawCardStage()
    {
        if (this.playdeckStage.length === 0 && this.discardPileStage.length > 0)
        {
            this.moveList(this.discardPileStage, this.playdeckStage);
            this.shuffleAny(this.playdeckStage);
        }

        return this.transferCard(this.playdeckStage, this.handStage);
    }

    /**
     * Draw minor item card (reshuffles automatically if deck is exhausted)
     * @returns Card uuid
     */
    drawCardMinorItems()
    {
        if (this.playdeckMinorItems.length === 0 && this.discardPileMinorItems.length > 0)
        {
            this.moveList(this.discardPileMinorItems, this.playdeckMinorItems);
            this.shuffleAny(this.playdeckMinorItems);
        }

        return this.transferCard(this.playdeckMinorItems, this.handMinorItems);
    }

    /**
     * Draw character card (reshuffles automatically if deck is exhausted)
     * @returns Card uuid
     */
    drawCardCharacter()
    {
        if (this.playdeckCharacters.length === 0 && this.discardPileCharacters.length > 0)
        {
            this.moveList(this.discardPileCharacters, this.playdeckCharacters);
            this.shuffleAny(this.playdeckCharacters);
        }

        return this.transferCard(this.playdeckCharacters, this.handCardsCharacters);
    }

    /**
     * Move all minor items from hands and discard piles into the playdeck and
     * reshuffle
     */
    recycleMinorItems()
    {
        this.moveList(this.discardPileMinorItems, this.playdeckMinorItems);
        this.moveList(this.handMinorItems, this.playdeckMinorItems);
        this.shuffleAny(this.playdeckMinorItems);
    }

    /**
     * Move all characters from hands and discard piles into the playdeck and
     * reshuffle
     */
    recycleCharacter()
    {
        this.moveList(this.discardPileCharacters, this.playdeckCharacters);
        this.moveList(this.handCardsCharacters, this.playdeckCharacters);
        this.shuffleAny(this.playdeckCharacters);
    }

    /**
     * Store character uuid list
     */
    addSpecialCharacers()
    {
        this.moveList(this.listSpecialCharacters, this.playdeckCharacters);
    }

    /**
     * Shuffle character playdeck
     */
    shuffleCharacterDeck()
    {
        this.shuffleAny(this.playdeckCharacters);
    }

    /**
     * Get stage cards in hand
     * @returns Array of Strings
     */
    getHandStage()
    {
        return this.handStage;
    }

    /**
     * Get character hand list
     * @returns Array of Strings
     */
    getHandCharacters()
    {
        return this.handCardsCharacters;
    }

    /**
     * Get minor item hand list
     * @returns Array of Strings
     */
    getHandMinorItems()
    {
        return this.handMinorItems;
    }

    /**
     * Move characters with mind 6+ to playdeck
     */
    mergeCharacterListsOnce()
    {
        this.moveList(this.playDeckCharacters7, this.playdeckCharacters)
    }

    /**
     * Move top character to playdeck
     * @returns Array of Strings
     */
    drawOpeningCharacterToHand()
    {
        return this.transferCardToTop(this.playdeckCharacters, this.playdeck);
    }

    /**
     * Move top character with mind 7+ to playdeck
     * @returns Array of Strings
     */
     drawOpeningCharacterMind7()
    {
        return this.transferCardToTop(this.playDeckCharacters7, this.playdeck);
    }

    /**
     * Get card in hand
     * @returns {Array|deck.handCards}
     */
    getCardsInHandMarshallingPoints()
    {
        return this.playdeckMP;
    }

    #copyIdsOpeningHand(list, _cardMap)
    {
        const listChars = [];
        for (let uuid of list)
        {
            const card = _cardMap[uuid];
            if (card.type === "character")
                listChars.push(uuid);
        }

        this.#copyIds(listChars, this.typesCharacters);
    }

    /**
     * Obtain PUSH methods to move cards to any pile
     * @returns Object
     */
    push()
    {
        let res = super.push();

        /**
         * Add a card to the discard pile
         * @param {type} uuid
         * @returns {Boolean} success
         */
        const deck = this;
        res.toDiscardpile = function(uuid)
        {
            if (deck.#isTypeCharacter(uuid))
                return res.to(uuid, deck.discardPileCharacters);
            else if (deck.#isTypeMinorItem(uuid))
                return res.to(uuid, deck.discardPileMinorItems);
            else if (deck.#isTypeMPs(uuid))
                return res.to(uuid, deck.discardPileMP);
            else if (deck.#isTypeStage(uuid))
                return res.to(uuid, deck.discardPileStage);
            else 
                return res.to(uuid, deck.discardPile);
        };

        res.toPlaydeck = function(uuid)
        {
            if (deck.#isTypeCharacter(uuid))
                return res.to(uuid, deck.playdeckCharacters);
            else if (deck.#isTypeMinorItem(uuid))
                return res.to(uuid, deck.playdeckMinorItems);
            else if (deck.#isTypeMPs(uuid))
                return res.to(uuid, deck.playdeckMP);
            else if (deck.#isTypeStage(uuid))
                return res.to(uuid, deck.playdeckStage);
            else 
                return res.to(uuid, deck.playdeck);
        };

        res.toPlaydeckSpecific = function(uuid)
        {
            return res.to(uuid, deck.playdeck);
        };

        res.toHand = function(uuid)
        {
            if (deck.#isTypeCharacter(uuid))
                return res.to(uuid, deck.handCardsCharacters);
            else if (deck.#isTypeMinorItem(uuid))
                return res.to(uuid, deck.handMinorItems);
            else if (deck.#isTypeMPs(uuid))
                return res.to(uuid, deck.handCardsMP);
            else if (deck.#isTypeStage(uuid))
                return res.to(uuid, deck.handStage);
            else 
                return res.to(uuid, deck.handCards);
        };

        return res;
    }

    /**
     * Obtain methods to pop cards form any pile
     * @returns Object
     */
    pop()
    {
        const deck = this;
        let res = super.pop();

        res.fromHandMinor = function(uuid)
        {
            return res.from(uuid, deck.handMinorItems);
        };

        res.fromHandMps = function(uuid)
        {
            return res.from(uuid, deck.handCardsMP);
        };

        res.fromHandCharacters = function(uuid)
        {
            return res.from(uuid, deck.handCardsCharacters);
        };

        res.fromHandStage = function(uuid)
        {
            return res.from(uuid, deck.handStage);
        }

        res.fromAnywhere = function(uuid)
        {
            return res.fromHand(uuid) || 
            res.fromSideboard(uuid) || 
            res.fromPlaydeck(uuid) || 
            res.fromDiscardpile(uuid) ||
            res.fromVictory(uuid) ||
            res.fromHandStage(uuid) ||
            res.from(uuid, deck.discardPileMinorItems) ||
            res.from(uuid, deck.playdeckMinorItems) ||
            res.from(uuid, deck.discardPileCharacters) ||
            res.from(uuid, deck.playdeckCharacters) ||
            res.from(uuid, deck.playdeckMP) ||
            res.from(uuid, deck.discardPileMP) ||
            res.from(uuid, deck.playdeckStage) ||
            res.from(uuid, deck.discardPileStage);
        }

        return res;
    }

    /**
     * Link lists
     * 
     * @param {Object} pAdmin Deck Arda Instance
     */
    updateListReferences(pAdmin)
    {
        if (pAdmin !== null)
        {
            this.discardPile = pAdmin.discardPile;
            this.sideboard = pAdmin.sideboard;
            this.playdeck = pAdmin.playdeck;
        
            Logger.info("Linked marshalling points");
            this.playdeckMP = pAdmin.playdeckMP;
            this.discardPileMP = pAdmin.discardPileMP;

            Logger.info("Linked roving characers");
            this.handCardsCharacters = pAdmin.handCardsCharacters;
            this.discardPileCharacters = pAdmin.discardPileCharacters;
            this.playdeckCharacters = pAdmin.playdeckCharacters;

            Logger.info("Linked common minor items");
            this.handMinorItems = pAdmin.handMinorItems;
            this.discardPileMinorItems = pAdmin.discardPileMinorItems;

            this.playdeckMinorItems = pAdmin.playdeckMinorItems;
            this.playDeckCharacters7 = pAdmin.playDeckCharacters7;

            this.handStage = pAdmin.handStage;
            this.playdeckStage = pAdmin.playdeckStage;
            this.discardPileStage = pAdmin.discardPileStage;

            this.#copyIds(this.typesCharacters, pAdmin.typesCharacters);
            this.#copyIds(this.typesMinors, pAdmin.typesMinors);
            this.#copyIds(this.typesMPs, pAdmin.typesMPs);
            this.#copyIds(this.typeStage, pAdmin.typeStage);
            this.#copyIds(this.listSpecialCharacters, pAdmin.listSpecialCharacters);

            this.typesCharacters = pAdmin.typesCharacters;
            this.typesMinors = pAdmin.typesMinors;
            this.typesMPs = pAdmin.typesMPs;
            this.typeStage = pAdmin.typeStage;
            this.listSpecialCharacters = pAdmin.listSpecialCharacters;
        }
    }
    
}

module.exports = DeckArda;