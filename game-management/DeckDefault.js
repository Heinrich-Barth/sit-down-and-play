const DeckCommons = require("./DeckCommons");
const Logger = require("../Logger");

/**
 * Deck for standard game
 */
class DeckDefault extends DeckCommons {

    constructor(playerId)
    {
        super(playerId);

        this.handCards = [];
        this.discardPile = [];
        this.sideboard = [];
        this.victory = [];
        this.playdeck = [];
        this.outofplay = [];
        this.sites = [];
    }

    /**
     * Restore a deck (from saved game)
     * @param {JSON} deck 
     */
    restore(deck)
    {        
        this.restoreList(this.handCards, deck.handCards);
        this.restoreList(this.discardPile, deck.discardPile);
        this.restoreList(this.sideboard, deck.sideboard);
        this.restoreList(this.victory, deck.victory);
        this.restoreList(this.playdeck, deck.playdeck);
        this.restoreList(this.outofplay, deck.outofplay);
        this.restoreList(this.sites, deck.sites);
    }

    /**
     * Obtain deck size
     * @returns JSON
     */
    size()
    {
        return {
            hand : this.handCards.length,
            discard : this.discardPile.length,
            sideboard : this.sideboard.length,
            victory : this.victory.length,
            playdeck : this.playdeck.length,
        }
    }

    /**
     * Restore given list
     * @param {Array} target Target list
     * @param {Array} list List to copy
     */
    restoreList(target, list)
    {
        this.clearArray(target);

        if (list === undefined || target === undefined)
            return;
            
        for (let id of list)
        {
            if (typeof id === "string" && id !== "")
                target.push(id);
        }
    }

    /**
     * Save given deck
     * @param {Boolean} isAdmin 
     * @returns JSON
     */
    save(isAdmin)
    {
        let data = super.save(isAdmin);
        
        data.handCards = this.handCards;
        data.discardPile = this.discardPile;
        data.sideboard = this.sideboard;
        data.victory = this.victory;
        data.playdeck = this.playdeck;
        data.outofplay = this.outofplay;
        data.sites = this.sites;

        return data;
    }

    /**
     * Remove all entries from a given list. The reference is kept
     * @param {Array} list 
     */
    clearArray(list)
    {
        if (list !== null && list !== undefined)
            list.splice(0, list.length)
    }

    /**
     * Create new unique card id
     * @returns String
     */
    createNewCardUuid()
    {
        return "d" + super.createNewCardUuid();
    }
    
    /**
     * Shuffle playdeck
     */
    shuffle()
    {
        this.shuffleAny(this.playdeck);
    }

    /**
     * Shuffle discard pile
     */
     shuffleDiscardpile()
    {
        this.shuffleAny(this.discardPile);
    }

    /**
     * Check if playdeck is empty
     * @returns Boolean
     */
    isEmptyPlaydeck()
    {
        return this.playdeck.length === 0;
    }

    /**
     * Move source list entries into target list. 
     * The surce empty will be cleared.
     * 
     * @param {Array} listSource 
     * @param {Array} listTarget 
     * @returns Success state
     */
    moveList(listSource, listTarget)
    {
        // move discardpile into playdeck and reshuffle
        if (listSource.length > 0)
        {
            for (const elem of listSource)
                listTarget.push(elem);
                   
            listSource.splice(0, listSource.length)
            this.shuffleAny(listTarget);
            return true;
        }
        else
            return false;
    }

    importCardsToDeck(code, bAsCharacter, _cardMap, gameCardProvider)
    {
        code = this.removeQuotes(code);

        const _entry = this.createCardEntry(code, false, gameCardProvider);
        if (_entry === null)
        {
            Logger.info("Cannot register card " + code + " to game.");
            return "";
        }

        /** this is magic. if the target card is a SITE, we can convert it into either character OR ressource */
        if (bAsCharacter)
        {
            _entry.type = "character";
            _entry.secondary = "character";
            _entry.revealed = true;
        }
        else
        {
            _entry.type = "resource";
            _entry.secondary = "permanent event";
            _entry.revealed = false;
        }

        _cardMap[_entry.uuid] = _entry;
        this.handCards.unshift(_entry.uuid);
        return _entry.uuid;
    }

    importCardsToHand(code, bAsCharacter, _cardMap, gameCardProvider)
    {
        const uuid = this.importCardsToDeck(code, bAsCharacter, _cardMap, gameCardProvider)
        return uuid !== "";
    }
    
    /**
     * Add cards to the game AFTER all decks have been registered already,
     * so they will be added to the SIDEBOARD 
     * 
     * @param {String} playerId 
     * @param {list} cards 
     * @param {list} listAgents 
     */
    registerCardsToSideboard(cards, listAgents, _cardMap, gameCardProvider)
    {
        let nAdded = 0;
        let _entry;
        
        for (let card of cards)
        {
            for (let i = 0; i < card.count; i++)
            {
                card.code = this.removeQuotes(card.code);

                _entry = this.createCardEntry(card.code, this.isAgent(card.code, listAgents), gameCardProvider);
                if (_entry === null)
                {
                    Logger.info("Cannot register card " + card.code + " to sideboard.");
                    break;
                }
                
                nAdded++;
                this.sideboard.push(_entry.uuid);
                _cardMap[_entry.uuid] = _entry;
            }
        }
        
        return nAdded;
    }

    /**
     * Draw the next card from playdeck. If the playdeck is empty, 
     * the discard pile will be reshuffled into the playdeck (automatically)
     * first.
     * 
     * @returns Card id
     */
    draw()
    {
        if (this.playdeck.length === 0 && this.discardPile.length > 0)
        {
            this.moveList(this.discardPile, this.playdeck);
            this.shuffleAny(this.playdeck);
        }

        return this.transferCard(this.playdeck, this.handCards);
    }

    /**
     * Pop the top card from the playdeck
     * @returns Card id
     */
    popTopCard()
    {
        return this.popTopCardFrom(this.playdeck);
    }

    /**
     * Get card in hand
     * @returns {Array|deck.handCards}
     */
    getCardsInHand()
    {
        return this.handCards;
    }
    
    push() 
    {
        const deck = this;

        return {

            /**
             * Add a card to a list
             * @param {type} uuid
             * @param {type} list
             * @returns {Boolean} success
             */
            to : function(uuid, list)
            {
                if (uuid === "" || deck.listContains(uuid, list))
                    return false;

                list.unshift(uuid); // put to start of array so it will be drawn next
                return true;
            },

            /**
             * Add a card to victory
             * @param {type} uuid
             * @returns {Boolean} success
             */
            toVictory : function(uuid)
            {
                return this.to(uuid, deck.victory);
            },

            /**
             * Add a card to sideboard
             * @param {type} uuid
             * @returns {Boolean} success
             */
            toSideboard : function(uuid)
            {
                return this.to(uuid, deck.sideboard);
            },

            /**
             * Add a card to the playdeck
             * @param {type} uuid
             * @returns {Boolean} success
             */
            toPlaydeck : function(uuid)
            {
                return this.to(uuid, deck.playdeck);
            },

            /**
             * Add a card to the discard pile
             * @param {type} uuid
             * @returns {Boolean} success
             */
            toDiscardpile : function(uuid)
            {
                return this.to(uuid, deck.discardPile);
            },

            /**
             * Add a card to the hand cards
             * 
             * @param {type} uuid
             * @returns {Boolean} success
             */
            toHand : function(uuid)
            {
                return this.to(uuid, deck.handCards);
            },

            /**
             * Add a card to out of play pile
             * 
             * @param {type} uuid
             * @returns {Boolean} success
             */
            toOutOfPlay : function(uuid)
            {
                return this.to(uuid, deck.outofplay);
            }
        }
    }

    pop()
    {
        const deck = this;

        return {

            /**
             * Remove a card from a list
             * @param {type} uuid
             * @param {type} list
             * @returns {boolean} 
             */
            from : function(uuid, list)
            {
                for(let i = list.length - 1; i >= 0; i--)
                {
                    if (list[i] === uuid)
                    {
                        list.splice(i, 1);
                        return true;
                    }
                }

                return false;
            },

            /**
             * Pops a card from the sideboard
             * @param {type} uuid
             * @returns {boolean} 
             */
            fromSideboard : function(uuid)
            {
                return this.from(uuid, deck.sideboard);
            },

            /**
             * Pops a card from the playdeck
             * @param {type} uuid
             * @returns {boolean} 
             */
            fromPlaydeck : function(uuid)
            {
                return this.from(uuid, deck.playdeck);
            },

            /**
             * Pops a card from the playdeck
             * @param {type} uuid
             * @returns {boolean} 
             */
            fromHand : function(uuid)
            {
                return this.from(uuid, deck.handCards);
            },

            /**
             * Pops a card from the discard pile
             * @param {type} uuid
             * @returns {boolean} 
             */
            fromDiscardpile : function(uuid)
            {
                return this.from(uuid, deck.discardPile);
            },

            /**
             * Pops a card from the fromVictory pile
             * @param {type} uuid
             * @returns {boolean} 
             */
            fromVictory : function(uuid)
            {
                return this.from(uuid, deck.victory);
            },

            fromAnywhere : function(uuid)
            {
                return this.fromHand(uuid) || 
                       this.fromSideboard(uuid) || 
                       this.fromPlaydeck(uuid) || 
                       this.fromDiscardpile(uuid) ||
                       this.fromVictory(uuid);
            }
        }
    }
    
    /**
     * Add given deck 
     * @param {JSON} jsonDeck 
     * @param {Array} listAgents 
     * @param {Object} _cardMap 
     * @param {Object} gameCardProvider 
     */
    addDeck(jsonDeck, listAgents, _cardMap, gameCardProvider)
    {
        const MAX_CARDS_PER_DECK = this.getMaxDeckSize();

        let nSize = 0;
        nSize += this.add(jsonDeck["pool"], this.handCards, _cardMap, listAgents, gameCardProvider);
        nSize += this.add(jsonDeck["playdeck"], this.playdeck, _cardMap, listAgents, gameCardProvider);
        nSize += this.add(jsonDeck["sites"], this.sites, _cardMap, listAgents, gameCardProvider);
        nSize += this.add(jsonDeck["sideboard"], this.sideboard, _cardMap, listAgents, gameCardProvider);
        
        if (nSize == MAX_CARDS_PER_DECK)
            Logger.info("Maximum number of cards reached. The deck must not exceed " + MAX_CARDS_PER_DECK + " cards.");
        else if (nSize > 0)
            Logger.info("Added " + nSize + " cards to " + this.getPlayerId() + "'s deck.");
        else
            Logger.error("No cards available for user #" + this.getPlayerId());
    }
}

module.exports = DeckDefault;