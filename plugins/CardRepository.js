
const getRemovableKeysArray = function()
{
    try
    {
        let data = require("fs").readFileSync("./data/obsoleteCardKeys.json", 'utf8');
        if (data !== "")
            return JSON.parse(data);
    }
    catch (err)
    {
        console.warn(err);
    }

    return [];
};

class CardRepository {

    constructor()
    {
        this._raw = { };
        this._CardRepository = {};
        this._types = { };
        this._agentList = [];
    }

    getCards()
    {
        return this._raw;
    }

    getCardRepository()
    {
        return this._raw;
    }

    sort() 
    {
        this._raw.sort( (card1, card2) => card1.title.replace(/"/g, '').localeCompare(card2.title.replace(/"/g, ''), "de-DE"));
    }

    stripQuotes()
    {
        for (let card of this._raw) 
        {
            card.code = this.removeQuotes(card.code);
            card.title = this.removeQuotes(card.title);
        }
    }

    codesLowercase()
    {
        for (let card of this._raw) 
        {
            card.code = card.code.toLowerCase();
            card.title = card.title.toLowerCase();

            if (card.Region !== undefined)
                card.Region = card.Region.toLowerCase();
        }
    }

    removeQuotes(sCode) 
    {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, '');
    }

    addIndices() 
    {
        let index = 0;
        for (let card of this._raw) 
            card.index = ++index;
    }

    temp(jMap)
    {
        let _temp = { };

        for (let key in jMap)
        {
            if (jMap[key].area.length !== 0)
                _temp[key] = jMap[key].area;

            for (let sitekey in jMap[key].sites)
            {
                if (jMap[key].sites[sitekey].area.length !== 0)
                    _temp[sitekey] = jMap[key].sites[sitekey].area;
            }

        }

        require("fs").writeFileSync("./data/map-positions.json", JSON.stringify(_temp, null, '\t'), 'utf-8');
    }

    prepareArda()
    {
        this._CardRepository = {};
        for (let card of this._raw)
            this._CardRepository[card.code] = card;
    }

    identifyQuests()
    {
        for (let card of this._raw) 
            card.isQuest = card.Race !== undefined && card.Race.startsWith("Quest-Side-");
    }

    identifyInLieuItems()
    {
        let text = "";
        for (let card of this._raw) 
        {
            if (card.code === "Towers Destroyed (FB)")
                card.isStartable = false;
            else if (card.code === "Heirlooms of Eärendil (ML)")
                card.isStartable = true;
            else
            {
                text = card.text.toLowerCase();
                card.isStartable = text.indexOf("in lieu of") !== -1 && text.indexOf(" minor ") !== -1 ;
            }
        }            
    }

    removeUnusedFields()
    {
        const vsUnused = getRemovableKeysArray();

        let rem = 0;
        for (let card of this._raw) 
        {
            vsUnused.forEach(key => 
            {
                if (key !== "" && card[key] !== undefined)
                {
                    delete card[key];
                    rem++;
                }
            });
        }

        if (rem > 0)
            console.log("\t- properties removed from cards: " + rem);
    }

    removeFlavourText()
    {
        let rem = 0;

        for (let card of this._raw) 
        {
            if (card.text === undefined || card.text === "" || card.text === null)
                continue;

            let sText = card.text.trim();

            let nLast = sText.lastIndexOf("\"-");
            if (nLast  === -1)
                continue;

            let _can = sText.substring(nLast+2).trim();
            if (!_can.startsWith("Hob") && !_can.startsWith("LotR") && !_can.startsWith("Eliz") && !_can.startsWith("Kuduk Lore"))
                continue;

            let nStart = sText.lastIndexOf("\"", nLast-1);
            if (nStart !== -1)
            {             
                rem++;
                sText = sText.substring(0, nStart).trim();
            }

            card.text = sText;
        }

        if (rem > 0)
            console.log("\t- flavour texts removed from cards: " + rem);
    }

    removeUnwantedCardRepository(_raw)
    {
        let countUl = 0;
        let countAL = 0;
        let _arr = [];
        for (let i = _raw.length - 1; i >= 0; i--)
        {
            if (_raw[i].set_code === "MEUL") 
            {
                countUl++;
            }
            else if (_raw[i].code.indexOf(" AL (") !== -1)
            {
                countAL++;
            }
            else 
            {
                _arr.push(_raw[i]);
            }

        }

        if (countUl > 0)
            console.log("\t- cards removed (unlimited): " + countUl);
        if (countAL > 0)
            console.log("\t- cards removed (AL): " + countAL);

        return _arr;
    }

    integrityCheck(_raw)
    {
        let invalids = { };

        const addInvalid = function(card, field)
        {
            if (card[field] !== "" || card[field] === undefined)
                return;

            if (invalids[card.code] === undefined)
                invalids[card.code] = [field];
            else
                invalids[card.code].push(field);
        }

        for (let card of this._raw) 
        {
            if (card.code === "")
                continue;

            addInvalid(card, "ImageName");
            addInvalid(card, "title");
            addInvalid(card, "normalizedtitle");
        }

        console.error("\t- invalid card(s) found: " + Object.keys(invalids).length);
    }

    updateMps()
    {
        for (let card of this._raw) 
        {
            if (card.MPs === undefined && card.mp !== undefined)
            {
                card.MPs = card.mp;
                delete card.mp;
            }

            if (card.MPs === undefined)
                continue;
            else if (card.MPs === "" || card.normalizedtitle === "grim voiced and grim faced")
                delete card.MPs;
            else
            {
                if (card.MPs.indexOf("(") >= 0)
                    card.MPs = card.MPs.replace("(", "").replace(")", "");
            
                card.MPs = this.toInt(card.MPs);
            }
        }
    }

    updateMind()
    {
        for (let card of this._raw) 
        {
            if (card.Mind === undefined && card.mind !== undefined)
            {
                card.Mind = card.mind;
                delete card.mind;
            }

            if (card.Mind === undefined)
                continue;
            else if (card.Mind === "")
                delete card.Mind;
            else
            {
                if (card.Mind.indexOf("(") >= 0)
                    card.Mind = card.Mind.replace("(", "").replace(")", "");
            
                card.Mind = this.toInt(card.Mind);
            }
        }
    }    

    toInt(sVal)
    {
        try
        {
            return parseInt(sVal);
        }
        catch (errIgnore)
        {

        }

        return 0;
    }


    setup(_raw)
    {
        console.log("Setting up card data.");

        this._raw = this.removeUnwantedCardRepository(_raw);
        this.stripQuotes();
        this.codesLowercase();
        this.integrityCheck();
        this.sort();
        this.addIndices();
        this.updateMps();
        this.updateMind();

        this.createTypes();
        this.prepareArda();
        this.createAgentList();

        console.log("\t- " + this._raw.length + " cards available in total.");
        return this._raw;
    }    

    createTypes()
    {
        for (let card of this._raw) 
            this._types[card.code] = card["type"];
    }
    
    getCardType(code)
    {
        if (code === undefined || code === "")
            return "";
        
        code = code.toLowerCase();
        return this._types[code] === undefined ? "" : this._types[code];
    }

    getCardByCode(code)
    {
        if (code === undefined || code === "")
            return "";
        
        code = code.toLowerCase();
        return this._CardRepository[code] === undefined ? null : this._CardRepository[code];
    }

    getCardMind(code)
    {
        const card = this.getCardByCode(code);
        return card !== null && card.Mind !== undefined ? card.Mind : -1;
    }

    getCardTypeSpecific(code)
    {
        const card = this.getCardByCode(code);
        return card !== null && card.Secondary !== undefined ? card.Secondary : "";
    }

    getMarshallingPoints(code)
    {
        let data = {
            type: "",
            points: 0
        }

        const card = this.getCardByCode(code);
        if (card === null || card.Secondary === undefined || card.Secondary === "")
            return data;

        data.points = card.MPs === undefined ? 0 : card.MPs;
        if (card.Secondary.indexOf("Creature") !== -1)
            data.type = "kill";
        else if (card.Secondary === "Character")
        {
            data.type = "character";
            data.points = 0;
        }
        else if (card.Secondary === "Ally")
            data.type = "ally";
        else if (card.Secondary === "Faction")
            data.type = "faction";
        else if (card.type === "Resource")
        {
            if (card.Secondary.endsWith("item") || card.Secondary.endsWith("Item"))
                data.type = "item";
            else 
                data.type = "misc";
        }

        return data;
    }

    isCardAvailable(code)
    {
        return code !== undefined && code !== "" && this._types[code.toLowerCase()] !== undefined;
    }

    isCardAvailableGuessed(code)
    {
        if (code === undefined || code === "")
            return false;

        let sCode = code.toLowerCase();
        if (this._types[sCode.replace(" (", " [h] (")] !== undefined)
            return true;
        else if (this._types[sCode.replace(" (", " [m] (")] !== undefined)
            return true;
        else if (this._types[sCode.replace(" [h] (", "( ")] !== undefined)
            return true;
        else if (this._types[sCode.replace(" [m] (", "( ")] !== undefined)
            return true;
        else
            return false;
    }

    getVerifiedCardCode(code)
    {
        if (code === undefined || code === "" || code === null)
            return "";

        let sCode = code.toLowerCase();
        if (this._types[sCode] !== undefined)
            return sCode;
        else if (this._types[sCode.replace(" (", " [h] (")] !== undefined)
            return sCode.replace(" (", " [h] (");
        else if (this._types[sCode.replace(" (", " [m] (")] !== undefined)
            return sCode.replace(" (", " [m] (");
        else if (this._types[sCode.replace(" [h] (", "( ")] !== undefined)
            return sCode.replace(" [h] (", "( ");
        else if (this._types[sCode.replace(" [m] (", "( ")] !== undefined)
            return sCode.replace(" [m] (", "( ");
        else
            return "";
    }

    postProcessCardList()
    {
        this.identifyQuests();
        this.identifyInLieuItems();
        this.removeUnusedFields();
        this.removeFlavourText();
        console.log("\t-- all data card loaded --");
    }

    isAgent(card)
    {
        if (card["type"] !== "Character")
            return false;  
        else
            return card["Secondary"] === "Agent" || card["agent"] === "yes";
    }

    createAgentList()
    {
        for (let card of this._raw) 
        {
            if (this.isAgent(card))
                this._agentList.push(card.code);
        }

        console.log("\t- " + this._agentList.length + " agents identified.");
    }

    getAgents()
    {
        return this._agentList;
    }

    onCardsReceived(body)
    {
        this.setup(JSON.parse(body));
    }
}

module.exports = CardRepository;
