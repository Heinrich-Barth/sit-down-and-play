
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

    view: {
        cards: 0,
        zoom: true
    },

    _quantities : typeof Quantities === "undefined" ? null : new Quantities(),
    _isReady : false,
    
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
        
        let listResult = [];
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
            
            if (!bAllowAllType && sType !== "" && _type !== sType)
                continue;
            
            if (!bAllowAllCat && sCategory !== "" && card.type !== sCategory)
                continue;
            
            if (!bAllowAllAlign && sAlign !== "" && _align !== sAlign)
                continue;

            if (keyword !== "" && !bAllowAllKeywords && (card.keywords === null || !card.keywords.includes(keyword)))
                continue;

            if (skill !== "" && !bAllowAllSkills && (card.skills === null || !card.skills.includes(skill)))
                continue;
            
            if (card.title === "Warlord AL" || card.title === "Wizard AL")
                continue;

            let boost = 0;
            if (sTitle !== "")
            {
                if (_title.indexOf(sTitle) >= 0)
                    boost = 10;
                else if (_text.indexOf(sTitle) >= 0)
                    boost = 5;
                else
                    continue;
            }

            listResult.push({
                type: _type,
                index: _index,
                boost: boost
            });
        }
        
        return this.createOrderdResult(listResult);
    },

    createOrderdResult : function(listResult)
    {
        const vnIndicesCharacters = {};
        for (let elem of listResult)
        {
            if (typeof vnIndicesCharacters[elem.type] === 'undefined' )
                vnIndicesCharacters[elem.type] = [];
        }

        listResult.sort((a, b) => b.boost - a.boost);
        for (let elem of listResult)
            vnIndicesCharacters[elem.type].push(elem.index);

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
        if (this._isReady)
            return;

        fetch("/data/list/cards")
        .then((response) => response.json())
        .then(this.onCardResult.bind(this))
        .catch((err) =>{
            console.error(err);
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Something went wrong. Error is : " + err.message }));
        })
        .finally(() => {
            const elem = document.getElementById("loading-line-counter");
            if (elem !== null)
                elem.parentElement.removeChild(elem);
        });

        this._isReady = true;
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

    processCards : function(list)
    {
        for (let card of list)
        {
            card.title = card.title.toLowerCase().replace(/-/g, " ");
            card.text = card.text.toLowerCase();

            const pos = card.text.indexOf('"');
            const posLast = card.text.lastIndexOf('"');
            if (pos !== posLast)
                card.text = card.text.substring(0, pos).trim();
        }
    },

    onCardResult : function(jsonCards, hideMessage)
    {
        if (jsonCards === null || !Array.isArray(jsonCards))
            return;

        this.processCards(jsonCards);

        const jMeta = new CreateCardsMeta(jsonCards);
        this.initCards(jsonCards, [ ]);
        this.initIndices(jMeta);
        this.storeCards(jsonCards);

        if (hideMessage !== true)
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Cards loaded" }));
    },

    onChangeRowNumber : function(value)
    {
        const res = document.getElementById("result");
        if (res === null)
            return;
        
        if (value !== undefined && value !== "")
            res.setAttribute("class", "result-contianer cards-per-row-" + value);
        else if (res.hasAttribute("class"))
            res.removeAttribute("class");
    },

    onViewLargeCardsOver : function(e)
    {
        if (!ViewCards.view.zoom)
            return;

        const elemLeft = e.clientX - window.scrollX;
        const windowHalf = window.innerWidth / 2;
    
        const _elem = document.getElementById("deck_card_view");
        const _img = document.createElement("img");
        _img.setAttribute("decoding", "async");
        _img.setAttribute("class", elemLeft >= windowHalf ? "left" : "right");
        _img.setAttribute("crossorigin", "anonymous");
        _img.setAttribute("src", this.src);
        _elem.appendChild(_img);
        _elem.classList.remove("hidden");
    },

    onViewLargeCardsOut : function()
    {
        const _elem = document.getElementById("deck_card_view");
        _elem.classList.add("hidden");
        DomUtils.empty(_elem);
    },

    onCardsError : function()
    {        
        const jsonCards = this.getCardsFromStorage();
        if (jsonCards !== null)
            this.onCardResult(jsonCards, true);

        const select = document.createElement("select");
        select.setAttribute("id", "cards-per-row")
        select.onchange = () => ViewCards.onChangeRowNumber(select.value);

        for (let i = 3; i < 7; i++)
        {
            let opt = document.createElement('option');
            opt.innerText = "" + i + " cards per row";
            opt.value = i;
            if (i === 5)
                opt.selected = true;
            select.appendChild(opt);
        }

        const div = document.createElement("div");
        div.setAttribute("class", "row-cols");

        let label = document.createElement("label");
        label.setAttribute("for", "cards-per-row");
        label.innerText = "Cards per row: ";

        let grp = document.createElement("div");
        grp.setAttribute("class", "row-col");
        grp.appendChild(label);
        grp.appendChild(select);
        div.appendChild(grp);

        label = document.createElement("label");
        label.setAttribute("for", "card-zoom");
        label.innerText = "Show large card when cursor hovers over a card."

        const input = document.createElement("input");
        input.setAttribute("id", "card-zoom");
        input.setAttribute("type", "checkbox");
        input.setAttribute("checked", "checked");
        input.onchange = () => ViewCards.view.zoom = input.checked;

        grp = document.createElement("div");
        grp.setAttribute("class", "row-col");
        grp.appendChild(input);
        grp.appendChild(label);
        div.appendChild(grp);
        div.setAttribute("class", "row-cols");

        const labelLang = document.createElement("label");
        labelLang.setAttribute("for", "card-lang");
        labelLang.innerText = "Use Spanish cards (if available)";

        const inputLang = document.createElement("input");
        inputLang.setAttribute("id", "card-lang");
        inputLang.setAttribute("type", "checkbox");
        if (sessionStorage.getItem("cards_es") === "yes")
            inputLang.setAttribute("checked", "checked");
        inputLang.onchange = () => sessionStorage.setItem("cards_es", document.getElementById("card-lang")?.checked === true ? "yes" : "no");

        grp = document.createElement("div");
        grp.setAttribute("class", "row-col");
        grp.appendChild(inputLang);
        grp.appendChild(labelLang);
        div.appendChild(grp);
        
        const divP = document.getElementById("view-preferences");
        if (divP !== null)
        {
            divP.setAttribute("class", "deck-columns center");
            divP.appendChild(div);
            ViewCards.onChangeRowNumber(5);
        }
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
document.body.addEventListener("meccg-deckbuilder-viewdeck", ViewCards.searchDeck.bind(ViewCards), false);
