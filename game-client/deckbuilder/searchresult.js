

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
        
    displayResult : function(vnIndicesCharacters)
    {
        const hasCardActions = document.getElementById("deck_container") !== null;

        DomUtils.empty(document.getElementById("result"));
        DomUtils.empty(document.getElementById("linklist"));

        var nSize = this.getResultSize(vnIndicesCharacters);
        document.getElementById("size").innerHTML = nSize;

        if (nSize === 0)
            return;

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
                _entry.setAttribute("class", "fl image");
                _entry.setAttribute("id", vnIndicesCharacters[key][_index]);

                const pJson = ViewCards.config.jsonData[vnIndicesCharacters[key][_index]];
                const index = vnIndicesCharacters[key][_index];

                {
                    const _image = document.createElement("img");
                    _image.setAttribute("src", "/media/assets/images/cards/notfound-generic.jpg");
                    _image.setAttribute("data-src", getImageUrlByCode(CardData.get(pJson, "code", "")));
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

            document.getElementById("result").appendChild(_div);
        }

        this.displayResultLinkList(vnIndicesCharacters);

        setTimeout(() => {
            const _tmp = document.getElementById("linklist").querySelector("a.linklist");
            if (_tmp !== null)
                _tmp.click();
        }, 10);        
    },

    displayResultLinkList : function(vnIndicesCharacters)
    {
        DomUtils.empty(document.getElementById("linklist"));

        if (vnIndicesCharacters.length === 0)
            return;

        let listTypes = [];
        for (let key in vnIndicesCharacters)
            listTypes.push(key);

        listTypes.sort();
        
        let sHtmlEvent = document.createElement("ul");
        let sHtmlItem = document.createElement("ul");
        let sHtmlChars = document.createElement("ul");
        let sHtmlOther = document.createElement("ul");
        let sHtmlCreature = document.createElement("ul");
        
        for (var key of listTypes)
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
        
        if (sHtmlEvent.hasChildNodes() && sHtmlEvent.childElementCount > 1)
            linklist.appendChild(sHtmlEvent);

        if (sHtmlItem.hasChildNodes() && sHtmlItem.childElementCount > 1)
            linklist.appendChild(sHtmlItem);

        if (sHtmlChars.hasChildNodes() && sHtmlChars.childElementCount > 1)
            linklist.appendChild(sHtmlChars);

        if (sHtmlCreature.hasChildNodes() && sHtmlCreature.childElementCount > 1)
            linklist.appendChild(sHtmlCreature);

        if (sHtmlOther.hasChildNodes() && sHtmlOther.childElementCount > 1)
            linklist.appendChild(sHtmlOther);
        
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
        console.log(sId);
        ArrayList(document.getElementById("result")).findByClassName("preview").each((elem) => elem.setAttribute("src", elem.getAttribute("data-hide")));
        ArrayList(document.getElementById("result")).findByClassName("category").each(function(pTable)
        {
            if (sId === undefined || sId === pTable.getAttribute("data-id"))
            {
                pTable.classList.remove("hidden");
                ArrayList(pTable).findByClassName("preview").each((elem) => elem.setAttribute("src", elem.getAttribute("data-src")));
            }
        });
    },
};

document.body.addEventListener("meccg-deckbuilder-displayresult", SearchResult.onDisplayResult, false);
document.body.addEventListener("meccg-deckbuilder-updatecardresultlistcount", SearchResult.updateCardResultListCount, false);
document.body.addEventListener("meccg-deckbuilder-updatecardcount", SearchResult.onUpdateCardCount, false);
