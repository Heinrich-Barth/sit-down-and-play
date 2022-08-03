
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
                console.log("alternative found " + code + " in ");
                return _card;
            }
        }

        return null;
    },
    
    getCardFromCardCode : function(code)
    {
        if (code === "")
        {
            console.log("empty code.");
            return null;
        }

        code = code.toLowerCase();
        
        if (typeof ViewCards.config.vsCodeIndices[code] === "undefined")
        {
            console.log("ViewCards.config.vsCodeIndices not set for " + code);
            return null;
        }

        const index = ViewCards.config.vsCodeIndices[code];
        if (typeof ViewCards.config.jsonData[index] === "undefined")
        {
            console.log("no card at index " + index + " for " + code);
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
        const res = ViewCards.doSearch(data.type, data.align, data.category, data.set, data.title, data.text);
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
    
    doSearch : function(sType, sAlign, sCategory, sSet, sTitle, sText)
    {
        sTitle = sTitle.toString().toLowerCase().trim();
        sText = sText.toString().toLowerCase().trim();

        if (sText.length < 3)
            sText = "";
        if (sTitle.length < 3)
            sTitle = "";
            
        let bAllowAllCat = sCategory === "_allcategory";
        let bAllowAllAlign = sAlign === "_allalign";
        let bAllowAllType = sType === "_alltype";
        
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

            if (sSet !== "" && card.set_code !== sSet)
                continue;
            
            if (!bAllowAllType && sType !== "" && _type.toString() !== sType)
                continue;
            
            if (!bAllowAllCat && sCategory !== "" && card.type.toString() !== sCategory)
                continue;
            
            if (!bAllowAllAlign && sAlign !== "" && _align.toString() !== sAlign)
                continue;
            
            if (sTitle !== "" && _title.toString().toLowerCase().indexOf(sTitle) === -1)
                continue;

            if (sText !== "" && _text.toString().toLowerCase().indexOf(sText) === -1)
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
            sets : ViewCards.config.vsSets
        };

        document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-searchbar", { "detail": data }));
        document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-preparedecklist", { "detail": "" }));
    }
};

(function()
{
    fetch("/data/list/cards").then((response) => 
    {
        response.json().then(function(jsonCards)
        {
            let jMeta = new CreateCardsMeta(jsonCards);
            ViewCards.initCards(jsonCards, [ ]);
            ViewCards.initIndices(jMeta);
        });
    });
})();

document.body.addEventListener("meccg-deckbuilder-search", ViewCards.search, false);
document.body.addEventListener("meccg-deckbuilder-viewdeck", ViewCards.searchDeck, false);
