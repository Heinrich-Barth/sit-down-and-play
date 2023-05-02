
/**
 * Commpn playdeck 
 */
class DeckCommons {
    
    /**
     * Create instance
     * @param {String} playerId 
     */
    constructor(playerId)
    {      
        this.id = playerId;
        this.g_deck_uuid_count = 0;
    }

    /**
     * Number of allowed cards per deck
     * @returns Number
     */
    getMaxDeckSize()
    {
        return 300;
    }

    /**
     * Get the deck owner
     * @returns Id
     */
    getPlayerId()
    {
        return this.id;
    }

    /**
     * Save this deck
     * @param {Boolean} isAdmin 
     * @returns JSON
     */
    save(isAdmin)
    {
        return {
            id : this._id,
            ishost : isAdmin
        };
    }

    /**
     * Check if given code represents an agent
     * @param {String} code 
     * @param {Array} listAgents 
     * @returns 
     */
    isAgent(code, listAgents)
    {
        const nSize = code === "" ? -1 : listAgents.length;
        for(let i = 0; i < nSize; i++)
        {
            if (listAgents[i] === code)
                return true;
        }

        return false;
    }

    /**
     * Add a card list to the deck
     * 
     * @param {JSON} cards 
     * @param {Array} _targetList 
     * @param {Object} _cardMap 
     * @param {Array} listAgents 
     * @param {Object} gameCardProvider 
     * @returns 
     */
    add(cards, _targetList, _cardMap, listAgents, gameCardProvider)
    {
        if (cards === undefined)
            return 0;
            
        let nSize = 0;
        let _entry;
        let count;
        const MAX_CARDS_PER_DECK = this.getMaxDeckSize();
        for (let _key in cards)
        {
            count = cards[_key];
            const key = this.removeQuotes(_key);
            for (let i = 0; i < count && nSize < MAX_CARDS_PER_DECK; i++)
            {
                _entry = this.createCardEntry(key, this.isAgent(key, listAgents), gameCardProvider);
                if (_entry === null)
                {
                    console.log("Cannot add card " + key + " to deck.");
                    break;
                }
                else
                {
                    _targetList.push(_entry.uuid);
                    _cardMap[_entry.uuid] = _entry;
                    nSize++
                }
            }
        }
    
        if (nSize === MAX_CARDS_PER_DECK)
            console.log("Will not add more than " + MAX_CARDS_PER_DECK + " cards for safety reasons.");
            
        return nSize;
    }

    /**
     * Remove quotation marks from code
     * @param {String} sCode 
     * @returns sanatized string
     */
    removeQuotes(sCode)
    {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, "");
    }

    randomNumber(max)
    {
        if (max <= 1)
            return 0;
        else
            return Math.floor((Math.random() * max));
    }

    /**
     * Shuffle list
     * @param {Array} inputList 
     */
    shuffleAny(inputList)
    {
        let _newList = [ ];
        let _index;

        while (inputList.length > 0)
        {
            _index = this.randomNumber(inputList.length);
            _newList.push(inputList[_index]);
            inputList.splice(_index, 1);
        }

        const len = _newList.length; 
        for (let i = 0; i < len; i++)
            inputList.push(_newList[i]);
    }

    /**
     * Move a card form source to target array
     * @param {Array} listPlaydeck 
     * @param {Array} listTarget 
     * @returns card id
     */
    transferCard(listPlaydeck, listTarget)
    {
        if (listPlaydeck.length === 0)
            return "";

        const _id = listPlaydeck[0];

        listTarget.push(_id);
        listPlaydeck.splice(0,1);

        return _id;
    }

    /**
     * Transfer the top card from playdeck to target array
     * @param {Array} listPlaydeck 
     * @param {Array} listTarget 
     * @returns 
     */
    transferCardToTop(listPlaydeck, listTarget)
    {
        if (listPlaydeck.length === 0)
        {
            console.log("no cards in source list to transfer to top");
            return "";
        }

        const _id = listPlaydeck[0];

        listTarget.unshift(_id);
        listPlaydeck.splice(0,1);

        return _id;
    }
    
    /**
     * Get the first card from a given list
     * 
     * @param {Array} listPlaydeck 
     * @returns value or emtpy string
     */
    popTopCardFrom(listPlaydeck)
    {
        if (listPlaydeck.length === 0)
            return "";

        const _id = listPlaydeck[0];
        listPlaydeck.splice(0,1);
        return _id;
    }

    /**
     * Check if a uuid is contained in a given array of objects
     * @param {String} uuid 
     * @param {Array} list 
     * @returns boolean
     */
    listContains(uuid, list)
    {
        const len = list.length;
        for(let i = 0; i < len; i++)
        {
            if (list[i].uuid === uuid)
                return true;
        } 

        return false;
    }

    /**
     * Create a new unique counter value
     * @returns String
     */
    createNewCardUuid()
    {
        return ++this.g_deck_uuid_count;
    }

    /**
     * Create unique id
     * @returns ID
     */
    requestNewCardUuid()
    {
        return this.getPlayerId() + "_" + this.createNewCardUuid();
    }

    /**
     * Create empty card entry
     * @returns Object
     */
    static createEmptyCardEntry()
    {
        return {
            code : "",
            type : "",
            uuid : "",
            state : 0,
            owner : "",
            revealed: false,
            agent : false,
            turn: 0
        };
    }

    /**
     * Clone a given input object
     * @param {JSON} input 
     * @returns cloned instance of null
     */
    static cloneCardEntry(input)
    {
        let data = DeckCommons.createEmptyCardEntry();
        for (let key of Object.keys(data))
        {
            if (input[key] === undefined)
                return null;
        }

        data.code = DeckCommons.assertString(input.code);
        data.type = DeckCommons.assertString(input.type);
        data.uuid = DeckCommons.assertString(input.uuid);
        data.state = parseInt(input.state);
        data.owner = DeckCommons.assertString(input.owner);
        data.revealed = input.revealed === true;
        data.agent = input.agent === true;
        data.turn = parseInt(input.turn);
        return data;
    }

    /**
     * Return string value of given input object to
     * assert it really is a string
     * @param {Object} input 
     * @returns String value or empty string
     */
    static assertString(input)
    {
        return input !== undefined && typeof input === "string" ? input : "";
    }

    /**
     * Create a new card entry
     * 
     * @param {String} code 
     * @param {Boolean} isAgent 
     * @param {Object} gameCardProvider 
     * @returns 
     */
    createCardEntry(code, isAgent, gameCardProvider)
    {
        if (typeof code === "undefined")
        {
            console.log("Invalid code");
            return null;
        }

        const sType = gameCardProvider.getCardType(code);
        if (sType === "")
        {
            console.log("Invalid card type");
            return null;
        }

        let data = DeckCommons.createEmptyCardEntry();
        data.code = code;
        data.type = sType.toLowerCase();
        data.uuid = this.requestNewCardUuid();
        data.state = 0;
        data.owner = this.getPlayerId();
        data.revealed = isAgent !== true
        data.agent = isAgent === true;
        data.turn = 0;
        data.secondary = gameCardProvider.getCardTypeSpecific(code);
        return data;
    }
}

module.exports = DeckCommons;