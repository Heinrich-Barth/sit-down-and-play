const DeckDefault = require("./deck-default");

class Deck extends DeckDefault {

    constructor(playerId)
    {
        super(playerId)
        
        this.playdeckMP = [];
        this.handCardsMP = [];
        this.discardPileMP = [];

        this.handCardsCharacters = [];
        this.discardPileCharacters = [];
        this.playdeckCharacters = [];

        this.handMinorItems = [];
        this.discardPileMinorItems = [];
        this.playdeckMinorItems = [];

        this.playDeckCharacters7 = [];

        this.typesCharacters = [];
        this.typesMinors = [];
        this.typesMPs = [];
        this.listSpecialCharacters = [];
    }

    getMaxDeckSize()
    {
        return 1000;
    }

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
        }

        return data;
    }

    addDeck(jsonDeck, listAgents, _cardMap, gameCardProvider)
    {
        super.addDeck(jsonDeck, listAgents, _cardMap, gameCardProvider);

        let nSize = 0;

        this.copyIds(this.handCards, this.typesCharacters);

        /** minor items will be drawn to hand on startup */
        nSize = this.add(jsonDeck["minors"], this.handMinorItems, _cardMap, [], gameCardProvider);
        this.copyIds(this.handMinorItems, this.typesMinors);

        console.log("Added " + nSize + " minor items");
        
        nSize = this.add(jsonDeck["mps"], this.playdeckMP, _cardMap, [], gameCardProvider);
        this.copyIds(this.playdeckMP, this.typesMPs);
        this.shuffleAnyTimes(this.playdeckMP, 3);
        console.log("Added " + nSize + " marshalling points cards");

        nSize = this.add(jsonDeck["chars_mind7"], this.playDeckCharacters7, _cardMap, listAgents, gameCardProvider);
        this.copyIds(this.playDeckCharacters7, this.typesCharacters);
        this.shuffleAnyTimes(this.playDeckCharacters7, 3);
        console.log("Added " + nSize + " characters with mind of 6+");

        nSize = this.add(jsonDeck["chars_others"], this.playdeckCharacters, _cardMap, listAgents, gameCardProvider);
        this.copyIds(this.playdeckCharacters, this.typesCharacters);
        this.shuffleAnyTimes(this.playdeckCharacters, 3);
        console.log("Added " + nSize + " characters with mind of 5-");

        
        nSize = this.add(jsonDeck["chars_special"], this.listSpecialCharacters, _cardMap, [], gameCardProvider);
    }

    isInTypeList(uuid, list)
    {
        return uuid !== "" && list.includes(uuid);
    }

    isTypeCharacter(uuid)
    {
        return this.isInTypeList(uuid, this.typesCharacters);
    }
    isTypeMPs(uuid)
    {
        return this.isInTypeList(uuid, this.typesMPs);
    }
    isTypeMinorItem(uuid)
    {
        return this.isInTypeList(uuid, this.typesMinors);
    }

    copyIds(listSource, listTarget)
    {
        const nLen = listSource.length;
        for (let i = 0; i < nLen; i++)
            listTarget.push(listSource[i]);
    }

    shuffleAnyTimes(list, nTimes)
    {
        for (let i = 0; i < nTimes; i++)
            this.shuffleAny(list);
    }

    shuffleCommons()
    {
        this.shuffleMinorItems();
        this.shuffleMPs();
    }

    shuffleMinorItems()
    {
        this.shuffleAny(this.playdeckMinorItems);
    }

    shuffleMPs()
    {
        this.shuffleAny(this.playdeckMP);
    }

    createNewCardUuid()
    {
        return "a" + super.createNewCardUuid();
    }

    drawCardMarshallingPoints()
    {
        if (this.playdeckMP.length === 0 && this.discardPileMP.length > 0)
        {
            this.moveList(this.discardPileMP, this.playdeckMP);
            this.shuffleAny(this.playdeckMP);
        }

        return this.transferCard(this.playdeckMP, this.handCardsMP);
    }

    drawCardMinorItems()
    {
        if (this.playdeckMinorItems.length === 0 && this.discardPileMinorItems.length > 0)
        {
            this.moveList(this.discardPileMinorItems, this.playdeckMinorItems);
            this.shuffleAny(this.playdeckMinorItems);
        }

        return this.transferCard(this.playdeckMinorItems, this.handMinorItems);
    }

    drawCardCharacter()
    {
        if (this.playdeckCharacters.length === 0 && this.discardPileCharacters.length > 0)
        {
            this.moveList(this.discardPileCharacters, this.playdeckCharacters);
            this.shuffleAny(this.playdeckCharacters);
        }

        return this.transferCard(this.playdeckCharacters, this.handCardsCharacters);
    }

    recycleMinorItems()
    {
        this.moveList(this.discardPileMinorItems, this.playdeckMinorItems);
        this.moveList(this.handMinorItems, this.playdeckMinorItems);
        this.shuffleAny(this.playdeckMinorItems);
    }

    recycleCharacter()
    {
        this.moveList(this.discardPileCharacters, this.playdeckCharacters);
        this.moveList(this.handCardsCharacters, this.playdeckCharacters);
        this.shuffleAny(this.playdeckCharacters);
    }

    addSpecialCharacers()
    {
        this.moveList(this.listSpecialCharacters, this.playdeckCharacters);
    }

    popTopCardMarshallingPoints()
    {
        return this.popTopCardFrom(this.playdeckMP);
    }

    shuffleCharacterDeck()
    {
        this.shuffleAny(this.playdeckCharacters);
    }

    getHandCharacters()
    {
        return this.handCardsCharacters;
    }

    mergeCharacterListsOnce()
    {
        this.moveList(this.playDeckCharacters7, this.playdeckCharacters)
    }

    drawOpeningCharacterToHand()
    {
        return this.transferCardToTop(this.playdeckCharacters, this.playdeck);
    }

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
            if (deck.isTypeCharacter(uuid))
                return res.to(uuid, deck.discardPileCharacters);
            else if (deck.isTypeMinorItem(uuid))
                return res.to(uuid, deck.discardPileMinorItems);
            else if (deck.isTypeMPs(uuid))
                return res.to(uuid, deck.discardPileMP);
            else 
                return res.to(uuid, deck.discardPile);
        };

        res.toPlaydeck = function(uuid)
        {
            if (deck.isTypeCharacter(uuid))
                return res.to(uuid, deck.playdeckCharacters);
            else if (deck.isTypeMinorItem(uuid))
                return res.to(uuid, deck.playdeckMinorItems);
            else if (deck.isTypeMPs(uuid))
                return res.to(uuid, deck.playdeckMP);
            else 
                return res.to(uuid, deck.playdeck);
        };

        res.toPlaydeckSpecific = function(uuid)
        {
            return res.to(uuid, deck.playdeck);
        };

        res.toHand = function(uuid)
        {
            if (deck.isTypeCharacter(uuid))
                return res.to(uuid, deck.handCardsCharacters);
            else if (deck.isTypeMinorItem(uuid))
                return res.to(uuid, deck.handMinorItems);
            else if (deck.isTypeMPs(uuid))
                return res.to(uuid, deck.handCardsMP);
            else 
                return res.to(uuid, deck.handCards);
        };

        return res;
    }

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

        res.fromAnywhere = function(uuid)
        {
            return res.fromHand(uuid) || 
            res.fromSideboard(uuid) || 
            res.fromPlaydeck(uuid) || 
            res.fromDiscardpile(uuid) ||
            res.fromVictory(uuid) ||
            res.from(uuid, deck.discardPileMinorItems) ||
            res.from(uuid, deck.playdeckMinorItems) ||
            res.from(uuid, deck.playdeckMP) ||
            res.from(uuid, deck.discardPileMP);
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
        
            console.log("Linked marshalling points");
            this.playdeckMP = pAdmin.playdeckMP;
            this.discardPileMP = pAdmin.discardPileMP;

            console.log("Linked roving characers");
            this.handCardsCharacters = pAdmin.handCardsCharacters;
            this.discardPileCharacters = pAdmin.discardPileCharacters;
            this.playdeckCharacters = pAdmin.playdeckCharacters;

            console.log("Linked common minor items");
            this.handMinorItems = pAdmin.handMinorItems;
            this.discardPileMinorItems = pAdmin.discardPileMinorItems;
            this.playdeckMinorItems = pAdmin.playdeckMinorItems;

            this.playDeckCharacters7 = pAdmin.playDeckCharacters7;

            this.typesCharacters = pAdmin.typesCharacters;
            this.typesMinors = pAdmin.typesMinors;
            this.typesMPs = pAdmin.typesMPs;
            this.listSpecialCharacters = pAdmin.listSpecialCharacters;
        }
    }
    
}

module.exports = Deck;