
class DeckCommons {
    
    constructor(playerId)
    {      
        this.id = playerId;
        this.g_deck_uuid_count = 0;
    }

    getMaxDeckSize()
    {
        return 300;
    }

    getPlayerId()
    {
        return this.id;
    }

    save(isAdmin)
    {
        return {
            id : this._id,
            ishost : isAdmin
        };
    }

    isAgent(code, listAgents)
    {
        const nSize = code === "" ? -1 : listAgents.length;
        for(var i = 0; i < nSize; i++)
        {
            if (listAgents[i] === code)
                return true;
        }

        return false;
    }

    add(cards, _targetList, _cardMap, listAgents, gameCardProvider)
    {
        if (cards === undefined)
            return 0;
            
        let nSize = 0;
        var _entry;
        let count;
        const MAX_CARDS_PER_DECK = this.getMaxDeckSize();
        for (var key in cards)
        {
            count = cards[key];
            key = this.removeQuotes(key);
            
            for (var i = 0; i < count && nSize < MAX_CARDS_PER_DECK; i++)
            {
                _entry = this.createCardEntry(key, this.isAgent(key, listAgents), _cardMap, gameCardProvider);
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

    shuffleAny(inputList)
    {
        var _newList = [ ];
        var _index;

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

    transferCard(listPlaydeck, listTarget)
    {
        if (listPlaydeck.length === 0)
        {
            console.log("no cards in source list");
            return "";
        }

        const _id = listPlaydeck[0];

        listTarget.push(_id);
        listPlaydeck.splice(0,1);

        return _id;
    }

    transferCardToTop(listPlaydeck, listTarget)
    {
        if (listPlaydeck.length === 0)
        {
            console.log("no cards in source list");
            return "";
        }

        const _id = listPlaydeck[0];

        listTarget.unshift(_id);
        listPlaydeck.splice(0,1);

        return _id;
    }
    

    popTopCardFrom(listPlaydeck)
    {
        if (listPlaydeck.length === 0)
            return "";

        const _id = listPlaydeck[0];
        listPlaydeck.splice(0,1);
        return _id;
    }

    listContains(uuid, list)
    {
        for(var i = 0; i < list.length; i++)
        {
            if (list[i].uuid === uuid)
                return true;
        } 

        return false;
    }

    createNewCardUuid()
    {
        return ++this.g_deck_uuid_count;
    }

    requestNewCardUuid()
    {
        return this.getPlayerId() + "_" + this.createNewCardUuid();
    }

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

    static cloneCardEntry(input)
    {
        let data = DeckCommons.createEmptyCardEntry();
        for (let key of Object.keys(data))
        {
            if (input[key] === undefined)
                return null;
        };

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

    static assertString(input)
    {
        return input !== undefined && typeof input === "string" ? input : "";
    }

    createCardEntry(code, isAgent, _cardMap, gameCardProvider)
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
        data.revealed = !isAgent;
        data.agent = isAgent;
        data.turn = 0;
        return data;
    }
}

module.exports = DeckCommons;