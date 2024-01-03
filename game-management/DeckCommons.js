const Logger = require("../Logger");
const CardDataProvider = require("../plugins/CardDataProvider");

/**
 * Commpn playdeck 
 */
class DeckCommons {
    
    #id;
    #deck_uuid_count = 0;

    /**
     * Create instance
     * @param {String} playerId 
     */
    constructor(playerId)
    {      
        this.#id = playerId;
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
        return this.#id;
    }

    /**
     * Save this deck
     * @param {Boolean} isAdmin 
     * @returns JSON
     */
    save(isAdmin)
    {
        return {
            id : this.#id,
            ishost : isAdmin
        };
    }

    /**
     * Check if given code represents an agent
     * @param {String} code 
     * @returns 
     */
    isAgent(code)
    {
        return code !== "" && CardDataProvider.getAgents().includes(code);
    }

    /**
     * Add a card list to the deck
     * 
     * @param {JSON} cards 
     * @param {Array} _targetList 
     * @param {Object} _cardMap 
     * @returns 
     */
    add(cards, _targetList, _cardMap)
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
                _entry = this.createCardEntry(key, this.isAgent(key));
                if (_entry === null)
                {
                    Logger.warn("Cannot add card " + key + " to deck.");
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
            Logger.info("Will not add more than " + MAX_CARDS_PER_DECK + " cards for safety reasons.");
            
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

    #randomNumber(max)
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
            _index = this.#randomNumber(inputList.length);
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
            return "";

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
        return ++this.#deck_uuid_count;
    }

    /**
     * Create unique id
     * @returns ID
     */
    #requestNewCardUuid()
    {
        return this.getPlayerId() + "_" + this.createNewCardUuid();
    }

    /**
     * Create empty card entry
     * @returns Object
     */
    static #createEmptyCardEntry()
    {
        return {
            code : "",
            type : "",
            uuid : "",
            state : 0,
            owner : "",
            revealed: false,
            agent : false,
            turn: 0,
            stage: false
        };
    }

    /**
     * Clone a given input object
     * @param {JSON} input 
     * @returns cloned instance of null
     */
    static cloneCardEntry(input)
    {
        const data = DeckCommons.#createEmptyCardEntry();

        data.code = DeckCommons.assertString(input.code);
        data.type = DeckCommons.assertString(input.type);
        data.uuid = DeckCommons.assertString(input.uuid);
        data.state = DeckCommons.#toInt(input.state);
        data.owner = DeckCommons.assertString(input.owner);
        data.revealed = input.revealed === true;
        data.agent = input.agent === true;
        data.turn = DeckCommons.#toInt(input.turn);
        data.stage = input.stage === true;
        
        if (DeckCommons.#hasEmptyString(data.code, data.type, data.uuid, data.owner))
            return null;

        return data;
    }

    static #hasEmptyString(...arr)
    {
        for (let i of arr)
        {
            if (i === "")
                return true;
        }

        return false;
    }

    static #toInt(input)
    {
        if (input === undefined)
            input = 0;

        if (typeof input === "number")
            return input;

        try
        {
            const val = parseInt(input);
            if (!isNaN(val))
                return val;
        }
        catch (errIgnore)
        {
            /** ignore */
        }

        return 0;
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
     * @returns 
     */
    createCardEntry(code, isAgent)
    {
        if (typeof code === "undefined")
        {
            Logger.info("Invalid code");
            return null;
        }

        const sType = CardDataProvider.getCardType(code);
        if (sType === "")
        {
            Logger.info("Invalid card type");
            return null;
        }

        const data = DeckCommons.#createEmptyCardEntry();
        data.code = code;
        data.type = sType.toLowerCase();
        data.uuid = this.#requestNewCardUuid();
        data.state = 0;
        data.owner = this.getPlayerId();
        data.revealed = isAgent !== true
        data.agent = isAgent === true;
        data.turn = 0;
        data.secondary = CardDataProvider.getCardTypeSpecific(code);
        data.stage = isAgent !== true && CardDataProvider.isStageCard(code);
        return data;
    }
}

module.exports = DeckCommons;