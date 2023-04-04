
const ViewCards =
{
    config : {
        cardIndices : {},
        jsonData : null,
        vsAlign : [],
        vsType : [],
        vsCategory : [],
        vsSets : [],
        vnIndicesCharacters : {},
        vsDeckContainerIds : [],
        vsTypesAvatarChars : [],
        vsTypesResource : [],
        vsTypesHazard : [],
        vsKeywords : [],
        vsSkills : [],
        vsCodeIndices : { }
    },

    _quantities : typeof Quantities === "undefined" ? null : new Quantities(),
    
    getLimit : function(code)
    {
        if (ViewCards.config.jLimis === null)
            return 3;
        else
            return typeof ViewCards.config.jLimis[code] === "undefined" ? -1 : ViewCards.config.jLimis[code];
    },
    
    resetAvail : function(json)
    {
        let _limit;
        let bHasLimits = ViewCards.config.jLimis !== null;
        
        if (this._quantities === null)
            return;

        for (let card of json) 
        {
            /** assume non-unique or sealed deck with reduced card counts */
            _limit = this.getLimit(card.code);

            if (this._quantities.hasTypeLimitation(card.Secondary))
                _limit = this._quantities.getTypeLimit(card.Secondary, 0);
            else
            {
                if (card.uniqueness)
                {
                    if (!bHasLimits || _limit > this._quantities.getUnique())
                        _limit = this._quantities.getUnique();
                }
                else
                {
                    if (!bHasLimits) /** some cards may be available > default */
                        _limit = this._quantities.getLimit(card.title);
                }
            }

            if (bHasLimits && _limit === 0)
                _limit = -1;

            card["count"] = _limit;
            card["limit"] = _limit;
        }
    },
    
    _getCardByCode : function(code)
    {
        if (typeof ViewCards.config.cardIndices[code] === "undefined")
            return null;
        else
            return ViewCards.config.cardIndices[code];
    },
    
    _updateMap : function()
    {
        for (let _card of ViewCards.config.jsonData) 
            ViewCards.config.cardIndices[_card.code] = _card;
    },
    
    getCardFromByCode : function(code)
    {
        for (let _card of ViewCards.config.jsonData) 
        {
            if (_card["code"] === code)
            {
                console.warn("alternative found " + code + " in ");
                return _card;
            }
        }

        return null;
    },
    
    getCardFromCardCode : function(code)
    {
        if (code === "")
        {
            console.warn("empty code.");
            return null;
        }

        code = code.toLowerCase();
        
        if (typeof ViewCards.config.vsCodeIndices[code] === "undefined")
        {
            console.warn("ViewCards.config.vsCodeIndices not set for " + code);
            return null;
        }

        const index = ViewCards.config.vsCodeIndices[code];
        if (typeof ViewCards.config.jsonData[index] === "undefined")
        {
            console.warn("no card at index " + index + " for " + code);
            return null;
        }

        if (ViewCards.config.jsonData[index]["code"] === code)
            return ViewCards.config.jsonData[index];
        else
            return this.iterateThrooughCards(code);
    },
    
    iterateThrooughCards : function(code)
    {
        for (let _card of ViewCards.config.jsonData) 
        {
            if (_card["code"] === code)
                return _card;
        }

        return null;
    },
    
    loadCategories : function(json)
    {
        ViewCards.config.vsCategory = [];
        ViewCards.config.vsAlign = [];
        ViewCards.config.vsType = [];
        ViewCards.config.vsTypesHazard = [];
        ViewCards.config.vsTypesResource = [];
        ViewCards.config.vsSkills = [];
        ViewCards.config.vsKeywords = [];
        ViewCards.config.vsCodeIndices = json["code-indices"];
        ViewCards.config.vsSets = json["sets"];
        
        for (let _type in json["secondaries"])
        {
            ViewCards.config.vsType.push(_type);
            ViewCards.config.vnIndicesCharacters[_type] = json["secondaries"][_type];
        }

        for (let _align in json["alignment"])
            ViewCards.config.vsAlign.push(_align);

        for (let _type in json["type"])
            ViewCards.config.vsCategory.push(_type);

        for (let _align in json["skills"])
            ViewCards.config.vsSkills.push(_align);

        for (let _align in json["keywords"])
            ViewCards.config.vsKeywords.push(_align);

        if (json["hazards"] !== undefined)
        {
            for (let _type of json["hazards"])
                ViewCards.config.vsTypesHazard.push(_type);
        }

        if (json["resources"] !== undefined)
        {
            for (let _type of json["resources"])
                ViewCards.config.vsTypesResource.push(_type);
        }
    },

    searchDeck : function()
    {
        let vnIndicesCharacters = {};
        
        let nAdded = 0;
        let _index = -1, _type;
        for (let card of ViewCards.config.jsonData) 
        {
            _index++;
            if (card.count === card.limit || card.count === -1)
                continue;

            _type = card.Secondary;
           
            if (typeof vnIndicesCharacters[_type.toString()] === 'undefined' )
                vnIndicesCharacters[_type.toString()] = [];

            vnIndicesCharacters[_type.toString()].push(_index);
            nAdded++;
        }        
        
        if (nAdded > 0)
            document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-displayresult", { "detail": vnIndicesCharacters }));
    },
    
    search : function(e)
    {
        const data = e.detail;
        const res = ViewCards.doSearch(data.type, 
            data.align, 
            data.category, 
            data.set, 
            data.title, 
            data.keyword,
            data.skill)
        document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-displayresult", { "detail": res }));
    },
    
    getCardCode : function(index)
    {
        return ViewCards.config.jsonData[index].code;
    },

    getCardByIndex : function(index)
    {
        if (typeof ViewCards.config.jsonData[index] === "undefined")
            return null;
        else
            return ViewCards.config.jsonData[index];
    },

    isOfficialSet : function(sIs)
    {
        switch(sIs)
        {
            case "MEAS":
            case "MEDM":
            case "MEBA":
            case "METD":
            case "MELE":
            case "MEWH":
            case "METW":
                return true;
            default:
                return false;
        }
    },

    isValidSet : function(sShould, sIs)
    {
        if (sShould === "" || sIs === "" || sShould === sIs)
            return true;

        if (sShould === "_official" && ViewCards.isOfficialSet(sIs))
            return true;
        else if (sShould === "_unofficial" && !ViewCards.isOfficialSet(sIs))
            return true;
        else
            return false;
    },
    
    doSearch : function(sType, sAlign, sCategory, sSet, sTitle, keyword, skill)
    {
        sTitle = sTitle.toString().toLowerCase().trim();

        if (sTitle.length < 3)
            sTitle = "";
            
        let bAllowAllCat = sCategory === "_allcategory";
        let bAllowAllAlign = sAlign === "_allalign";
        let bAllowAllType = sType === "_alltype";
        const bAllowAllKeywords = keyword === "_all";
        const bAllowAllSkills = skill === "_all";
        
        let vnIndicesCharacters = {};
        
        let _index = -1, _type, _align, _title, _text;
        for (let card of ViewCards.config.jsonData) 
        {
            _index++;

            if (card.count === -1)
                continue;

            _type = card.Secondary;
            _align = card.alignment;
            _title = card.title;
            _text = card.text;

            if (!ViewCards.isValidSet(sSet, card.set_code))
                continue;
            
            if (!bAllowAllType && sType !== "" && _type.toString() !== sType)
                continue;
            
            if (!bAllowAllCat && sCategory !== "" && card.type.toString() !== sCategory)
                continue;
            
            if (!bAllowAllAlign && sAlign !== "" && _align.toString() !== sAlign)
                continue;

            if (keyword !== "" && !bAllowAllKeywords && (card.keywords === null || !card.keywords.includes(keyword)))
                continue;

            if (skill !== "" && !bAllowAllSkills && (card.skills === null || !card.skills.includes(skill)))
                continue;
            
            if (sTitle !== "" && _title.toString().toLowerCase().indexOf(sTitle) === -1 && _text.toString().toLowerCase().indexOf(sTitle) === -1)
                continue;

            if (card.title === "Warlord AL" || card.title === "Wizard AL")
                continue;
            
            if (typeof vnIndicesCharacters[_type.toString()] === 'undefined' )
                vnIndicesCharacters[_type.toString()] = [];

            vnIndicesCharacters[_type.toString()].push(_index);
        }        
        
        return vnIndicesCharacters;
    },

    initCards : function(json, jReduced)
    {
        ViewCards.config.jLimis = null;
        ViewCards.config.jsonData = json;

        this.setReduced(jReduced);
        this._updateMap();
        this.resetCounter();
    },

    resetCounter : function()
    {
        this.resetAvail(ViewCards.config.jsonData);
    },
    
    setReduced : function(jData)
    {
        if (typeof jData === "undefined" || jData.length === 0)
            return;

        ViewCards.config.jLimis = {};
        let _code;
        const _len = jData.length;
        for (let i = 0; i < _len; i++)
        {
            _code = jData[i];
            if (_code === "")
                continue;
            else if (typeof ViewCards.config.jLimis[_code] === "undefined")
                ViewCards.config.jLimis[_code] = 0;

            ViewCards.config.jLimis[_code]++;
        }
        
    },
    
    initIndices : function(jMeta)
    {
        this.loadCategories(jMeta);
        
        const data = {
            type: ViewCards.config.vsType,
            align: ViewCards.config.vsAlign,
            category: ViewCards.config.vsCategory,
            keywords: ViewCards.config.vsKeywords,
            skills: ViewCards.config.vsSkills,
            sets : ViewCards.config.vsSets
        };

        document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-searchbar", { "detail": data }));
        document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-preparedecklist", { "detail": "" }));
    },

    initDeckbuilderCached : function()
    {
        this.onCardsError();
    },

    initDeckbuilder: function()
    {
        fetch("/data/list/cards")
        .then((response) => response.json())
        .then(this.onCardResult.bind(this))
        .catch((err) => document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Something went wrong. Error is : " + err.message })))
        .finally(() => {
            const elem = document.getElementById("loading-line-counter");
            if (elem !== null)
                elem.parentElement.removeChild(elem);
        })
    },

    getCardsFromStorage : function()
    {
        try
        {
            const cachedCards = localStorage.getItem("meccg_deckbuilder");
            if (cachedCards !== null)
            {
                const val = JSON.parse(cachedCards);
                if (Array.isArray(val) && val.length > 0)
                    return val;
            }
        }
        catch(errIgnore)
        {
        }

        return null;
    },

    storeCards : function(result)
    {
        if (typeof result !== "undefined")
            localStorage.setItem("meccg_deckbuilder", JSON.stringify(result));
    },

    onCardResult : function(jsonCards, hideMessage)
    {
        if (jsonCards === null || !Array.isArray(jsonCards))
            return;

        const jMeta = new CreateCardsMeta(jsonCards);
        this.initCards(jsonCards, [ ]);
        this.initIndices(jMeta);
        this.storeCards(jsonCards);

        if (hideMessage !== true)
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Cards loaded" }));
    },

    onCardsError : function()
    {        
        const jsonCards = this.getCardsFromStorage();
        if (jsonCards !== null)
            this.onCardResult(jsonCards, true);
    }
};

(function() {

    const div = document.createElement("div");
    div.setAttribute("class", "loading-line-counter");
    div.setAttribute("id", "loading-line-counter");
    document.body.appendChild(div);
})();

document.body.addEventListener("meccg-init-ready", () => {
    ViewCards.initDeckbuilderCached();
    setTimeout(() => ViewCards.initDeckbuilder(), 50);  
}, false);


document.body.addEventListener("meccg-deckbuilder-search", ViewCards.search.bind(ViewCards), false);
document.body.addEventListener("meccg-deckbuilder-viewdeck", ViewCards.searchDeck.apply.bind(ViewCards), false);
