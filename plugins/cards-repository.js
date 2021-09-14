
const toInt = function(val)
{
    try
    {
        if (val !== undefined && val !== "")
            return parseInt(val);
    }
    catch (e)
    {

    }

    return 0;
};


const getRemovableKeysArray = function()
{
    return [
        "Artist",
        "Body",
        "DCpath",
        "Direct",
        "Gear",
        "GoldRing",
        "GreaterItem",
        "Haven",
        "Hoard",
        "Home",
        "Information",
        "MajorItem",
        "MinorItem",
        "Non",
        "Path",
        "Playable",
        "Precise",
        "Prowess",
        "RPath",
        "Race",
        "Rarity",
        "Region",
        "Site",
        "Specific",
        "Stage",
        "errata",
        "erratum",
        "extras",
        "flip-title",
        "full_set",
        "gccgSet",
        "released",
        "title-du",
        "title-es",
        "title-fn",
        "title-fr",
        "title-gr",
        "title-it",
        "title-jp",
        "trimCode"
    ];
};

const CARDS = {

    _raw : {},
    _cards : {},

    getCards : function()
    {
        return this._raw;
    },

    sort: function () 
    {
        this._raw.sort(function (card1, card2) {
            return card1.title.replace('"', "").localeCompare(card2.title.replace('"', ""), "de-DE");
        });
    },

    stripQuotes : function()
    {
        for (let card of this._raw) 
        {
            card.code = CARDS.removeQuotes(card.code);
            card.title = CARDS.removeQuotes(card.title);
        }
    },

    removeQuotes: function (sCode) 
    {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, '');
    },

    addIndices: function () 
    {
        var index = 0;
        for (var card of this._raw) 
        {
            card.index = index;
            index++;
        }
    },

    temp : function (jMap)
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

        fs.writeFileSync("./data/map-positions.json", JSON.stringify(_temp, null, '\t'), 'utf-8');
    },

    prepareArda : function()
    {
        this._cards = {};
        for (let card of this._raw)
            this._cards[card.code] = card;
    },

    identifyQuests : function()
    {
        for (var card of this._raw) 
            card.isQuest = card.Race.startsWith("Quest-Side-");
    },

    identifyInLieuItems : function()
    {
        const sPattern = "in lieu of";
        for (var card of this._raw) 
            card.isStartable = card.text.indexOf(sPattern) !== -1;
    },

    removeUnusedFields : function()
    {
        const vsUnused = getRemovableKeysArray();

        let rem = 0;
        for (var card of this._raw) 
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
            console.log("\t-properties removed from cards: " + rem);
    },

    removeFlavourText : function()
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
            console.log("\t-flavour texts removed from cards: " + rem);
    },

    removeUnwantedCards : function(_raw)
    {
        let count = 0;
        for (let i = _raw.length - 1; i >= 0; i--)
        {
            if (_raw[i].set_code === "MEUL" || _raw[i].code.indexOf(" AL (") !== -1)
            {
                _raw.splice(i, 1);
                count++;
            }
        }

        if (count > 0)
            console.log("\t- cards removed: " + count);

        return _raw;
    },

    integrityCheck : function(_raw)
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

        console.error("\t-invalid card(s) found: " + Object.keys(invalids).length);
    },

    updateMps : function()
    {
        for (let card of this._raw) 
        {
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
    },
    updateMind : function()
    {
        for (let card of this._raw) 
        {
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
    },

    

    toInt : function(sVal)
    {
        try
        {
            return parseInt(sVal);
        }
        catch (errIgnore)
        {

        }

        return 0;
    },


    setup : function(_raw)
    {
        console.log("Setting up cards data.");

        CARDS._raw = this.removeUnwantedCards(_raw);

        this.stripQuotes();
        this.integrityCheck();
        this.sort();
        this.addIndices();
        this.updateMps();
        this.updateMind();

        this.createTypes();
        this.prepareArda();

        return CARDS._raw;
    },

    _types : { },

    createTypes : function()
    {
        for (var card of this._raw) 
            this._types[card.code] = card["type"];
    },
    
    getCardType : function(code)
    {
        return code === undefined || code === "" || CARDS._types[code] === undefined ? "" : CARDS._types[code];
    },

    getCardByCode : function(code)
    {
        return code === undefined || code === "" || CARDS._cards[code] === undefined ? null : CARDS._cards[code];
    },

    getCardMind : function(code)
    {
        const card = CARDS.getCardByCode(code);
        return card !== null && card.Mind !== undefined ? card.Mind : -1;
    },

    getCardTypeSpecific : function(code)
    {
        const card = CARDS.getCardByCode(code);
        return card !== null && card.Secondary !== undefined ? card.Secondary : "";
    },

    isCardAvailable : function(code)
    {
        return code !== undefined && code !== "" && CARDS._types[code] !== undefined;
    },

    postProcessCardList : function()
    {
        this.identifyQuests();
        this.identifyInLieuItems();
        this.removeUnusedFields();
        this.removeFlavourText();
        console.log("Cards setup done.");
    }
};

exports.postProcessCardList = () => CARDS.postProcessCardList();

exports.setup = (jsonCards) => CARDS.setup(jsonCards);

exports.getCards = () => CARDS.getCards();

exports.isCardAvailable = (code) => CARDS.isCardAvailable(code);

exports.getCardType = (code) => CARDS.getCardType(code);

exports.getCardByCode = (code) => CARDS.getCardByCode(code);

exports.getCardMind = (code) => CARDS.getCardMind(code);

exports.getCardTypeSpecific = (code) => CARDS.getCardTypeSpecific(code);