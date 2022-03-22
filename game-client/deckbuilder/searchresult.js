

const CardData =
{
    get : function(jsonData, sField, oDefault)
    {
        if ( typeof jsonData[sField] === 'undefined' ) 
            return oDefault;
        else
            return jsonData[sField].toString();
    }
};


var SearchResult = {

    inserted : false,

    pCurrentObserver : null,
    pCurrentObserverElement : null,

    getResultSize : function(vnIndicesCharacters)
    {
        let _size = 0;
        for (let _val in vnIndicesCharacters)
            _size += vnIndicesCharacters[_val].length;
        
        return _size;
    },

    onDisplayResult: function(e)
    {
        SearchResult.displayResult(e.detail);
    },

    onDisplayResultDeck : function(e)
    {
        SearchResult.displayResult(e.detail);
    },

    insertEmptySearch : function()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "bgblue empty_result");
        div.innerHTML = "No matches found.";

        document.getElementById("result").appendChild(div);
    },
        
    displayResult : function(vnIndicesCharacters)
    {
        const hasCardActions = document.getElementById("deck_container") !== null;

        DomUtils.empty(document.getElementById("result"));
        DomUtils.empty(document.getElementById("linklist"));

        const nSize = this.getResultSize(vnIndicesCharacters);
        document.getElementById("size").innerHTML = nSize;

        if (nSize === 0)
        {
            this.insertEmptySearch();
            return;
        }

        for (let key in vnIndicesCharacters)
        {
            if (key === "Site" || key === "" || key === "Region")
                continue;

            const _size = vnIndicesCharacters[key].length;
            if (_size === 0)
                continue;

            const _div = document.createElement("div");
            _div.setAttribute("class", "category hidden");
            _div.setAttribute("data-id", key.toString());
            
            for (let _index = 0; _index < _size; _index++)
            {
                const _entry = document.createElement("div");
                _entry.setAttribute("class", "fl image hidden");
                _entry.setAttribute("id", vnIndicesCharacters[key][_index]);

                const pJson = ViewCards.config.jsonData[vnIndicesCharacters[key][_index]];
                const index = vnIndicesCharacters[key][_index];

                {
                    const _image = document.createElement("img");
                    _image.setAttribute("src", "/data/card-not-found-generic");
                    _image.setAttribute("data-src", getImageUrlByCode(CardData.get(pJson, "code", "")));
                    _image.setAttribute("title", CardData.get(pJson, "code", ""));
                    _image.setAttribute("class", "preview");
                    _image.setAttribute("decoding", "async");

                    const _tmp = document.createElement("div");
                    _tmp.setAttribute("class", "image_overlay");
                    _tmp.appendChild(_image);
                    _entry.appendChild(_tmp);

                }

                if (hasCardActions)
                {
                    let _tmp = document.createElement("div");
                    _tmp.setAttribute("class", "actions");
                    _tmp.setAttribute("id", "count_" + index);
                    _tmp.setAttribute("data-index", index);
                    _tmp.setAttribute("data-count", CardData.get(pJson, "count", ""));

                    let _a = document.createElement("a");
                    _a.innerHTML = "&nbsp;"
                    _a.setAttribute("href", "#");
                    _a.setAttribute("class", "icon_add_pool");
                    _a.setAttribute("title", "add to starting pool");
                    _a.setAttribute("data-target", "pool");
                    _a.onclick = SearchResult.onClickLinkAddTo;
                    _tmp.appendChild(_a); 

                    _a = document.createElement("a");
                    _a.innerHTML = "&nbsp;"
                    _a.setAttribute("href", "#");
                    _a.setAttribute("class", "icon_add_deck");
                    _a.setAttribute("title", "add to deck");
                    _a.setAttribute("data-target", this.getDataTarget(pJson));
                    _a.onclick = SearchResult.onClickLinkAddTo;
                    _tmp.appendChild(_a); 

                    _a = document.createElement("a");
                    _a.innerHTML = "&nbsp;"
                    _a.setAttribute("href", "#");
                    _a.setAttribute("class", "icon_add_sideboard");
                    _a.setAttribute("title", "add to sideboard");
                    _a.setAttribute("data-target", "sideboard");
                    _a.onclick = SearchResult.onClickLinkAddTo;
                    _tmp.appendChild(_a); 

                    _entry.appendChild(_tmp);

                    _tmp = document.createElement("div");
                    _tmp.setAttribute("class", "count_bubble");
                    _tmp.innerHTML = CardData.get(pJson, "count", "");
                    _entry.appendChild(_tmp);
                }
                
                _div.appendChild(_entry);
            }

            document.getElementById("result").appendChild(_div);
        }

        this.displayResultLinkList(vnIndicesCharacters);

        setTimeout(() => {
            const _tmp = document.getElementById("linklist").querySelector("a.linklist");
            if (_tmp !== null)
                _tmp.click();
            else
            {
                const elem = document.getElementById("result").querySelector(".category");
                if (elem !== null)
                    SearchResult.makeImagesVisible(elem.getAttribute("data-id"));
            }
        }, 10);        
    },

    displayResultLinkList : function(vnIndicesCharacters)
    {
        DomUtils.empty(document.getElementById("linklist"));

        let listTypes = [];
        for (let key in vnIndicesCharacters)
            listTypes.push(key);

        listTypes.sort();
        
        let sHtmlEvent = document.createElement("ul");
        let sHtmlItem = document.createElement("ul");
        let sHtmlChars = document.createElement("ul");
        let sHtmlOther = document.createElement("ul");
        let sHtmlCreature = document.createElement("ul");
        
        for (let key of listTypes)
        {
            switch (key.toLowerCase())
            {
                case "faction":
                case "ally":
                case "not specified":
                    sHtmlOther.appendChild(this.createLinkListHtml(key, vnIndicesCharacters[key].length));
                    break;

                case "creature":
                    sHtmlCreature.appendChild(this.createLinkListHtml(key, vnIndicesCharacters[key].length));
                    break;
                
                case "haven":
                case "site":
                case "region":
                    break;

                default:
                    
                    if (key.toString().toLowerCase().endsWith("item"))
                        sHtmlItem.appendChild(this.createLinkListHtml(key, vnIndicesCharacters[key].length));
                    else if (key.toString().toLowerCase().startsWith("creature"))
                        sHtmlCreature.appendChild(this.createLinkListHtml(key, vnIndicesCharacters[key].length));
                    else if (key.toString().toLowerCase().indexOf(" event") !== -1)
                        sHtmlEvent.appendChild(this.createLinkListHtml(key, vnIndicesCharacters[key].length));
                    else
                        sHtmlChars.appendChild(this.createLinkListHtml(key, vnIndicesCharacters[key].length));
                    break;
            }
        }

        const linklist = document.getElementById("linklist");
        if (sHtmlEvent.hasChildNodes())
            linklist.appendChild(sHtmlEvent);

        if (sHtmlItem.hasChildNodes())
            linklist.appendChild(sHtmlItem);

        if (sHtmlChars.hasChildNodes())
            linklist.appendChild(sHtmlChars);

        if (sHtmlCreature.hasChildNodes())
            linklist.appendChild(sHtmlCreature);

        if (sHtmlOther.hasChildNodes())
            linklist.appendChild(sHtmlOther);

        if (linklist.childElementCount < 2)
            DomUtils.empty(linklist);
        
        let _tmp = document.createElement("div");
        _tmp.setAttribute("class", "clear");
        linklist.appendChild(_tmp);
    },
            
    updateCardResultListCount : function(index, count)
    {
        const pDiv = document.getElementById("" + index);
        if (pDiv === null)
            return;

        let elem = pDiv.querySelector(".actions");
        if (elem !== null)
            elem.setAttribute("data-count", count);

        elem = pDiv.querySelector(".count_bubble");
        if (elem !== null)
            elem.innerHTML = count;
    },

    onClickLinkAddTo : function(e)
    {
        e.preventDefault();
        e.stopPropagation();

        const pLink = e.target;
        const sTargetDeck = pLink.getAttribute("data-target");
        const pDiv = DomUtils.closestByType(pLink, "div");
        const nIndex = parseInt(pDiv.getAttribute("data-index"));

        document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-add-to-deck", { "detail": { index : nIndex, target: sTargetDeck } }));
        return false;
    },

    onUpdateCardResultListCount(e)
    {
        SearchResult.updateCardResultListCount(e.detail.index, e.detail.count);
    },
    

    extractTableHead : function(sTplHtml)
    {
        var nPos = sTplHtml.indexOf("<tbody>");
        if (nPos === -1)
            return sTplHtml;
        else
            return sTplHtml.substring(0, nPos);
    },

    getTemplateTable : function()
    {
        return document.getElementById("tplDefault").innerHTML;
    },

    getDataTarget : function(pJson)
    {
        if (pJson.type === "Hazard")
            return "hazard";
        else if (pJson.Secondary === "Avatar")
            return "avatar";
        else if (pJson.Secondary === "Character")
            return "character";
        else
            return "resource";
    },
            
    createLinkListHtml : function(key,size)
    {
        const elem = document.createElement("li");
        const link = document.createElement("a");
        link.setAttribute("href", "#");
        link.setAttribute("class", "linklist");
        link.setAttribute("data-id", key);
        link.innerHTML = key.toUpperCase() + " (" + size + ")";
        link.onclick = SearchResult.onClickLinkListLink;
        elem.appendChild(link);
        return elem;
    },

    onClickLinkListLink : function(e)
    {
        e.preventDefault();

        const sId = e.target.getAttribute("data-id");
        if (sId === "" || sId === null)
            return false;

        ArrayList(document.getElementById("result")).find("div.category").each( (_e) => _e.classList.add("hidden") );
        ArrayList(document).find("li.current").each((_elem) => _elem.classList.remove("current"));

        setTimeout(() => SearchResult.makeImagesVisible(sId), 10);

        this.parentNode.classList.add("current");
        return false;
    },

    makeImagesVisible : function(sId)
    {
        ArrayList(document.getElementById("result")).findByClassName("category").each(function(pTable)
        {
            if (sId === undefined || sId === pTable.getAttribute("data-id"))
            {
                SearchResult.removeObserver();
                
                pTable.classList.remove("hidden");

                if (pTable.querySelector(".image.hidden") !== null)
                    SearchResult.createObserver(pTable);
            }
        });
    },

    removeObserver : function()
    {
        if (SearchResult.pCurrentObserver !== null)
        {
            SearchResult.pCurrentObserver.disconnect();
            SearchResult.pCurrentObserver = null;
        }

        SearchResult.pCurrentObserverElement = null;

        const elem = document.getElementById("help_observer");
        if (elem !== null)
            DomUtils.remove(elem);
    },

    createObserver : function(pElement)
    {
        this.insertIntersector(pElement);
        this.pCurrentObserverElement = pElement;
        this.pCurrentObserver = new IntersectionObserver(this.onObserving.bind(this));
        this.pCurrentObserver.observe(document.getElementById("help_observer"));
    },

    removeObserverIfNecessary()
    {
        const list = this.pCurrentObserverElement.querySelectorAll(".image.hidden");
        if (list === null || list.length === 0)
            this.removeObserver();
    },

    onObserving : function(entries)
    {
        if (entries[0].intersectionRatio <= 0 || this.pCurrentObserverElement === null) 
            return;

        const list = this.pCurrentObserverElement.querySelectorAll(".image.hidden");
        if (list === null || list.length === 0)
        {
            this.removeObserver();
            return;
        }

        let len = list.length;
        if (len > 20)
            len = 20;

        for (let i = 0; i < len; i++)
        {
            let elem = list[i];
            const _img = elem.querySelector("img.preview")
            _img.setAttribute("src", _img.getAttribute("data-src"));
            elem.classList.remove("hidden");
        }

        this.removeObserverIfNecessary();
    },

    insertIntersector : function(pElement)
    {
        if (document.getElementById("help_observer") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("class", "fl image");
        div.setAttribute("id", "help_observer");

        const img = document.createElement("img");
        img.setAttribute("class", "preview");
        img.setAttribute("src", "/data/card-not-found-generic");
        img.setAttribute("data-src", "/data/card-not-found-generic");
        img.setAttribute("decoding", "async");

        div.appendChild(img);
        
        pElement.appendChild(div);
    },

    insertScrollTop : function()
    {
        const elemI = document.createElement("i");
        elemI.setAttribute("class", "fa fa-arrow-up");
        elemI.setAttribute("aria-hidden", "true");
        elemI.setAttribute("title", "Scroll to top");
        elemI.onclick = () =>  window.scrollTo({ top: 0, behavior: 'smooth' });        

        const div = document.createElement("div");
        div.setAttribute("id", "scroll_top");
        div.setAttribute("class", "scroll_top bgblue");
        div.appendChild(elemI);
        document.body.appendChild(div);
    }
};

(function()
{
    SearchResult.insertScrollTop();
})();


document.body.addEventListener("meccg-deckbuilder-viewdeck-details", SearchResult.onDisplayResultDeck, false);
document.body.addEventListener("meccg-deckbuilder-displayresult", SearchResult.onDisplayResult, false);
document.body.addEventListener("meccg-deckbuilder-update-bubble", SearchResult.onUpdateCardResultListCount, false);
