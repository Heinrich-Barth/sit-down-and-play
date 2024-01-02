const CardNameCodeSuggestions = require("./CardNameCodeSuggestions");
const CardRepositoryUnderdeeps = require("./CardRepositoryUnderdeeps")
const StageCard = require("./CardStageCodes");
const Logger = require("../Logger");
const LocalImageMerger = require("./LocalImageMerger");
const fs = require("fs");

const getRemovableKeysArray = function()
{
    try
    {
        let data = fs.readFileSync("./data-local/obsoleteCardKeys.json", 'utf8');
        if (data !== "")
            return JSON.parse(data);
    }
    catch (err)
    {
        Logger.error(err);
    }

    return [];
};

class CardRepository {

    #raw = [];
    #agentList = [];
    #nameCodeAlternatives = {};
    #cardsDeckbuilder = [];
    #listAvatars = [];
    #types = {};
    #cardRepository = {};

    getCards()
    {
        return this.#raw;
    }

    getCardsDeckbuilder()
    {
        return this.#cardsDeckbuilder;
    }

    createCardsDeckbuilder()
    {
        const assertString = function(val)
        {
            if (typeof val !== "string")
                return "";
            else
                return val.trim();
        }

        this.#cardsDeckbuilder = [];

        let listStrings = ["set_code", "full_set", "Secondary", "alignment", "type",  "code", "uniqueness"]
        let listOther = ["uniqueness", "skills", "keywords"];

        for (let card of this.#raw) 
        {
            let candidate = { };

            const title = card.normalizedtitle + (card.title !== card.normalizedtitle ? " " + card.title : "");
            const text = assertString(card.text);

            candidate.title = title.toLowerCase();
            candidate.text = text.toLowerCase();

            for (let key of listStrings)
                candidate[key] = assertString(card[key]);
            for (let key of listOther)
                candidate[key] = card[key];

            this.#cardsDeckbuilder.push(candidate);
        }

    }
    
    sort() 
    {
        this.#raw.sort( (card1, card2) => card1.title.replace(/"/g, '').localeCompare(card2.title.replace(/"/g, ''), "de-DE"));
    }

    stripQuotes()
    {
        for (let card of this.#raw) 
        {
            card.code = this.removeQuotes(card.code);
            card.title = this.removeQuotes(card.title);
        }
    }

    codesLowercase()
    {
        for (let card of this.#raw) 
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
        for (let card of this.#raw) 
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
        this.#cardRepository = {};
        for (let card of this.#raw)
            this.#cardRepository[card.code] = card;
    }

    buildFlipCardsMap()
    {
        const questsB = { };
        const quests = { };

        for (let card of this.#raw)
        {
            if (card["flip-title"] !== undefined && card["flip-title"] !== card.normalizedtitle)
                questsB[card["flip-title"]] = card.code;
        }

        for (let card of this.#raw)
        {
            if (questsB[card.normalizedtitle] !== undefined)
            {
                const cardCodeA = card.code;
                const cardCodeB = questsB[card.normalizedtitle];
                quests[cardCodeA] = cardCodeB;
                quests[cardCodeB] = cardCodeA;
            }
            else if (card.Race === "Quest" && card.normalizedtitle === card["flip-title"])
            {
                quests[card.code] = card.code;
            }
        }

        return quests;
    }

    identifyAvatars()
    {
        let nCount = 0;
        for (let card of this.#raw)
        {
            if (card["Secondary"] === "Avatar")
            {
                this.#listAvatars.push(card.code);
                nCount++;
            }
        }
        
        Logger.info("\t- Avatars: " + nCount);
    }

    identifyQuests()
    {
        let nCount = 0;
        for (let card of this.#raw)
        {
            if (card.Race?.toLowerCase().startsWith("quest"))
            {
                card.isQuest = true;
                nCount++;
            }
            else
                card.isQuest = false;
        }
        
        Logger.info("\t- Quests: " + nCount);
    }

    identifyInLieuItems()
    {
        let text = "";
        for (let card of this.#raw) 
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
        for (let card of this.#raw) 
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
            Logger.info("\t- properties removed from cards: " + rem);
    }

    removeFlavourText()
    {
        let rem = 0;

        for (let card of this.#raw) 
        {
            if (card.text === undefined || card.text === "" || card.text === null)
                continue;

            let sText = card.text.trim();
            const nLast = sText.lastIndexOf("\"-");
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
            Logger.info("\t- flavour texts removed from cards: " + rem);
    }

    removeUnwantedCardRepository(_raw)
    {
        let countUl = 0;
        let countAL = 0;
        let _arr = [];
        for (let elem of _raw)
        {
            if (elem.set_code === "MEUL") 
                countUl++;
            else if (elem.code.indexOf(" AL (") !== -1)
                countAL++;
            else 
                _arr.push(elem);
        }

        if (countUl > 0)
            Logger.info("\t- cards removed (unlimited): " + countUl);
        if (countAL > 0)
            Logger.info("\t- cards removed (AL): " + countAL);

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

        for (let card of this.#raw) 
        {
            if (card.code === "")
                continue;

            addInvalid(card, "ImageName");
            addInvalid(card, "title");
            addInvalid(card, "normalizedtitle");
        }

        Logger.info("\t- invalid card(s) found: " + Object.keys(invalids).length);
    }

    updateMps()
    {
        for (let card of this.#raw) 
        {
            if (card.MPs === undefined && card.mp !== undefined)
            {
                card.MPs = card.mp;
                delete card.mp;
            }

            if (card.MPs === undefined || typeof card.MPs === "number")
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
        for (let card of this.#raw) 
        {
            if (card.Mind === undefined && card.mind !== undefined)
            {
                card.Mind = card.mind;
                delete card.mind;
            }

            if (card.Mind === undefined || typeof card.Mind === "number")
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

    createCardNameCodeSuggestionsList()
    {
        const res = new CardNameCodeSuggestions().create(this.#raw);
        if (res)
            this.#nameCodeAlternatives = res;

        return Object.keys(this.#nameCodeAlternatives).length;
    }

    identifyUnderdeeps()
    {
        new CardRepositoryUnderdeeps().create(this.#raw);
    }

    #mergeLocalImages(list)
    {
        LocalImageMerger.replaceImages(list);
    }

    #identifyStageCards()
    {
        const count = StageCard.addStageCodes(this.#raw);
        Logger.info("\t- Stage card(s) itendified: " + count);
    }

    setup(_raw)
    {
        Logger.info("Setting up card data.");
        this.#addLocalCardsDev(_raw);
        this.#mergeLocalImages(_raw);
        this.#raw = this.removeUnwantedCardRepository(_raw);
        this.stripQuotes();
        this.codesLowercase();
        this.identifyQuests();
        this.identifyAvatars();
        this.#identifyStageCards();
        this.identifyUnderdeeps();
        this.integrityCheck();
        this.sort();
        this.addIndices();
        this.updateMps();
        this.updateMind();

        this.createTypes();
        this.createCardsDeckbuilder();
        this.prepareArda();
        this.createAgentList();
        this.createCardNameCodeSuggestionsList();

        Logger.info("\t- " + this.#raw.length + " cards available in total.");
        return this.#raw;
    }    

    createTypes()
    {
        for (let card of this.#raw) 
            this.#types[card.code] = card["type"];
    }
    
    getCardType(code)
    {
        if (code === undefined || code === "")
            return "";
        
        code = code.toLowerCase();
        return this.#types[code] === undefined ? "" : this.#types[code];
    }

    getCardByCode(code)
    {
        if (code === undefined || code === "")
            return "";
        
        code = code.toLowerCase();
        return this.#cardRepository[code] === undefined ? null : this.#cardRepository[code];
    }

    getCardMind(code)
    {
        const card = this.getCardByCode(code);
        return card?.Mind !== undefined ? card.Mind : -1;
    }

    getCardTypeSpecific(code)
    {
        const card = this.getCardByCode(code);
        return card?.Secondary !== undefined ? card.Secondary : "";
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

        const secondary = card.Secondary.toLowerCase();
        const cardTyoe = card.type.toLowerCase();

        data.points = card.MPs === undefined ? 0 : card.MPs;

        if (cardTyoe === "hazard")
            data.type = "kill";
        else if (secondary === "character")
        {
            data.type = "character";
            data.points = 0;
        }
        else if (secondary === "ally")
            data.type = "ally";
        else if (secondary === "faction")
            data.type = "faction";
        else if (cardTyoe === "resource")
        {
            if (secondary.endsWith("item"))
                data.type = "item";
            else 
                data.type = "misc";
        }

        return data;
    }

    isCardAvailable(code)
    {
        return code !== undefined && code !== "" && this.#types[code.toLowerCase()] !== undefined;
    }

    isCardAvailableGuessed(code)
    {
        if (code === undefined || code === "")
            return false;

        let sCode = code.toLowerCase();
        if (this.#types[sCode.replace(" (", " [h] (")] !== undefined)
            return true;
        else if (this.#types[sCode.replace(" (", " [m] (")] !== undefined)
            return true;
        else if (this.#types[sCode.replace(" [h] (", "( ")] !== undefined)
            return true;
        else if (this.#types[sCode.replace(" [m] (", "( ")] !== undefined)
            return true;
        else
            return false;
    }

    getVerifiedCardCode(code)
    {
        if (code === undefined || code === "" || code === null)
            return "";

        let sCode = code.toLowerCase();
        if (this.#types[sCode] !== undefined)
            return sCode;
        else if (this.#types[sCode.replace(" (", " [h] (")] !== undefined)
            return sCode.replace(" (", " [h] (");
        else if (this.#types[sCode.replace(" (", " [m] (")] !== undefined)
            return sCode.replace(" (", " [m] (");
        else if (this.#types[sCode.replace(" [h] (", "( ")] !== undefined)
            return sCode.replace(" [h] (", "( ");
        else if (this.#types[sCode.replace(" [m] (", "( ")] !== undefined)
            return sCode.replace(" [m] (", "( ");
        else
            return "";
    }

    postProcessCardList()
    {
        this.identifyInLieuItems();
        this.removeUnusedFields();
        this.removeFlavourText();
        Logger.info("\t-- all data card loaded --");
    }

    isAgent(card)
    {
        if (card["type"] !== "Character")
            return false;  
        else
            return card["Secondary"] === "Agent" || card["agent"] === "yes";
    }

    isAvatar(code)
    {
        return code !== "" && this.#listAvatars.includes(code);
    }

    createAgentList()
    {
        for (let card of this.#raw) 
        {
            if (this.isAgent(card))
                this.#agentList.push(card.code);
        }

        Logger.info("\t- " + this.#agentList.length + " agents identified.");
    }

    getAgents()
    {
        return this.#agentList;
    }

    onProcessCardData()
    {
        /** overwrite */
    }

    #appendLocalCards(cards, localList)
    {
        let count = 0;

        for (let card of localList)
        {
            cards.push(card);
            count++;
        }

        if (count > 0)
            Logger.info(count + " local cards added.");
    }

    #addLocalCardsDev(cards)
    {
        try
        {
            const data = fs.readFileSync("./data-local/cards-full.json", 'utf8');
            const list = data === undefined || data === null ? [] : JSON.parse(data);
            if (Array.isArray(list) && list.length > 0)
                this.#appendLocalCards(cards, list);
        }
        catch(errIgnore)
        {
            /** ignore any error */
            console.error(errIgnore)
        }

        return cards;
    }

    onCardsReceived(body)
    {
        
        try 
        {
            this.setup(JSON.parse(body));
            this.onProcessCardData();
        } 
        catch (error) 
        {
            Logger.error(error);
        }
    }

    getNameCodeSuggestionMap()
    {
        return this.#nameCodeAlternatives;
    }
}

module.exports = CardRepository;
