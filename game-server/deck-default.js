const DeckCommons = require("./deck-commons");

class Deck extends DeckCommons {

    constructor(playerId)
    {
        super(playerId);

        this.handCards = [];
        this.discardPile = [];
        this.sideboard = [];
        this.victory = [];
        this.playdeck = [];
    }

    createNewCardUuid()
    {
        return "d" + super.createNewCardUuid();
    }
    
    saveState()
    {
        return {
            handCards : [],
            discardPile : [],
            sideboard : [],
            victory : [],
            playdeck : []
        };
    }

    shuffle()
    {
        this.playdeck = this.shuffleAny(this.playdeck);
    }

    shuffleDiscardpile()
    {
        this.discardPile = this.shuffleAny(this.discardPile);
    }

    isEmptyPlaydeck()
    {
        return this.playdeck.length === 0;
    }

    moveDiscardIntoPlaydeck()
    {
        // move discardpile into playdeck and reshuffle
        if (this.playdeck.length === 0)
        {
            for (let i = 0; i < this.discardPile.length; i++)
                this.playdeck.push(this.discardPile[i]);
                                    
            this.discardPile = [];
            this.shuffle();

            console.log("moved discard pile into playdeck again");
        }
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
        var nAdded = 0;
        var card,  _entry;

        const nSize = cards.length;
        for (var c = 0; c < nSize; c++)
        {
            card = cards[c];
            count = card.count;

            for (var i = 0; i < count; i++)
            {
                card.code = this.removeQuotes(card.code);

                _entry = this.createCardEntry(card, this.isAgent(card.code, listAgents), _cardMap, gameCardProvider);
                if (_entry === null)
                {
                    console.log("Cannot add card " + card.code + " to deck.");
                    break;
                }
                
                nAdded++;
                deck.sideboard.push(_entry.uuid);
                _cardMap[_entry.uuid] = _entry;
            }
        }
        
        return nAdded;
    }

    draw()
    {
        return this.transferCard(this.playdeck.length, this.handCards);
    }

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
            }
        }
    }
    /*
    get()
    {
        const deck = this;
        return {

            hand : function()
            {
                return deck.handCards;
            },
            discardpile : function()
            {
                return deck.discardPile;
            },
            playdeck : function()
            {
                return deck.playdeck;
            },
            victory : function()
            {
                return deck.victory;
            },
            sideboard : function()
            {
                return deck.sideboard;
            }
        }
    }
    */

    addDeck(jsonDeck, listAgents, _cardMap, gameCardProvider)
    {
        const MAX_CARDS_PER_DECK = this.getMaxDeckSize();

        let nSize = 0;

        nSize += this.add(jsonDeck["pool"], this.handCards, _cardMap, listAgents, gameCardProvider);
        nSize += this.add(jsonDeck["playdeck"], this.playdeck, _cardMap, listAgents, gameCardProvider);
        nSize += this.add(jsonDeck["sideboard"], this.sideboard, _cardMap, listAgents, gameCardProvider);
        
        if (nSize == MAX_CARDS_PER_DECK)
            console.log("Maximum number of cards reached. The deck must not exceed " + MAX_CARDS_PER_DECK + " cards.");
        else
            console.log("Added " + nSize + " cards to " + this.getPlayerId() + "'s deck.");
    }
}

module.exports = Deck;