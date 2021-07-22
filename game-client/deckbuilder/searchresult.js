

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

        var nSize = this.getResultSize(vnIndicesCharacters);
        document.getElementById("size").innerHTML = nSize;

        if (nSize === 0)
        {
            this.insertEmptySearch();
            return;
        }

        for (var key in vnIndicesCharacters)
        {
            if (key === "Site" || key === "" || key === "Region")
                continue;

            let _size = vnIndicesCharacters[key].length;
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
                    _image.setAttribute("src", "/media/assets/images/cards/notfound-generic.jpg");
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
                    _a.setAttribute("data-target", "sb");
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

            {
                const elemI = document.createElement("i");
                elemI.setAttribute("class", "fa bgblue fa-share fa-6");
                elemI.setAttribute("aria-hidden", "true");
                elemI.setAttribute("title", "Scroll to top");
                elemI.onclick = () =>  window.scrollTo({ top: 0, behavior: 'smooth' });      

                const _elem = document.createElement("div");
                _elem.setAttribute("class", "clear result-end-of-list");
                _elem.appendChild(elemI);
                
                _div.appendChild(_elem);
            }

            _div.appendChild

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
            
    updateCardResultListCount : function(e)
    {
        const index = e.detail;
        var elem = document.getElementById("count_" + index);
        if (elem !== null)
            elem.setAttribute("data-count", ViewCards.config.jsonData[index].count);
    },

    onClickLinkAddTo : function(e)
    {
        e.preventDefault();
        e.stopPropagation();

        const pLink = e.target;
        const sTargetDeck = pLink.getAttribute("data-target");
        const pDiv = DomUtils.closestByType(pLink, "div");
        const nIndex = parseInt(pDiv.getAttribute("data-index"));
        const sCount = pDiv.getAttribute("data-count");

        if (sCount === "" || sCount === "0")
        {
            console.log("nothing left");
            return false;
        }
                    
        if (DeckList.addToDeckIndex(nIndex, sTargetDeck))
        {
            SearchResult.updateCardCount(nIndex, -1);
            
            let _cnt = parseInt(sCount) - 1;
            pDiv.setAttribute("data-count", _cnt);
            
            let jBubble = pDiv.parentNode.querySelector(".count_bubble");
            if (jBubble !== null)
            {
                jBubble.innerHTML = _cnt;
                if (_cnt === 0 && !jBubble.classList.contains("hidden"))
                    jBubble.classList.add("hidden");
            }
            
            DeckList.calculateAndUpdateDeckCounters();
        }
        
        return false;
    },

    onUpdateCardCount : function(e)
    {
        SearchResult.updateCardCount(e.detail.index, e.detail.count);
    },

    updateCardCount : function(index, count)
    {
        var pCard = ViewCards.getCardByIndex(index);
        if (pCard !== null)
            pCard.count += count;
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

        var sId = e.target.getAttribute("data-id");
        if (sId === "" || sId === null)
            return false;

        ArrayList(document.getElementById("result")).find("div.category").each( (e) => e.classList.add("hidden") );
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
        DomUtils.remove(document.getElementById("help_observer"));
    },

    createObserver : function(pElement)
    {
        SearchResult.insertIntersector();
        SearchResult.pCurrentObserverElement = pElement;

        SearchResult.pCurrentObserver = new IntersectionObserver(SearchResult.onObserving);

        SearchResult.pCurrentObserver.observe(document.getElementById("help_observer"));
    },

    onObserving : function(entries)
    {
        if (entries[0].intersectionRatio <= 0 || SearchResult.pCurrentObserverElement === null) 
            return;

        const list = SearchResult.pCurrentObserverElement.querySelectorAll(".image.hidden");
        if (list === null || list.length === 0)
        {
            SearchResult.removeObserver();
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
    },

    insertIntersector : function()
    {
        if (document.getElementById("help_observer") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("id", "help_observer");
        div.innerHTML = "<p>&nbsp;</p>";

        document.getElementById("result").parentNode.appendChild(div);

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

document.body.addEventListener("meccg-deckbuilder-displayresult", SearchResult.onDisplayResult, false);
document.body.addEventListener("meccg-deckbuilder-updatecardresultlistcount", SearchResult.updateCardResultListCount, false);
document.body.addEventListener("meccg-deckbuilder-updatecardcount", SearchResult.onUpdateCardCount, false);
