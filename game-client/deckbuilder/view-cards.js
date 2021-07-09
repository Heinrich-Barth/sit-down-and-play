

var CardData =
{
    get : function(jsonData, sField, oDefault)
    {
        if ( typeof jsonData[sField] === 'undefined' ) 
            return oDefault;
        else
            return jsonData[sField].toString();
    }
};

class Utils {

    static empty(parent) 
    {
        if (parent !== null)
        {
            while (parent.firstChild) 
                parent.removeChild(parent.firstChild);
        }
    }

    static closestByType(node, type)
    {
        if (node === null || node === undefined || type === undefined || type === "")
            return null;

        if (node.nodeName !== undefined && node.nodeName.toLowerCase() === type)
            return node;
        else
            return Utils.closestByType(node.parentNode, type);
    }

    static closestByClass(node, sClass)
    {
        return Utils.findParentByClass(node, sClass);
    }

    static findParentByClass(node, sClass)
    {
        if (node === null || node === undefined || sClass === undefined || sClass === "")
            return null;

        if (node.classList !== undefined && node.classList.contains(sClass))
            return node;
        else
            return Utils.findParentByClass(node.parentNode, sClass);
    }

    static removeNode(node)
    {
        if (node !== null)
        {
            while (node.firstChild) 
                node.removeChild(node.firstChild);

            node.parentNode.removeChild(node);
        }
    }

    static hide(node)
    {
        node.style.display = "none";
    }

    static show(node)
    {
        node.style.display = "block";
    }
}


const ArrayList = function(elem)
{
    let _elem = elem;

    return {

        find : function(sSelector)
        {
            if (_elem === null || sSelector === undefined || sSelector === "")
                return ArrayList(null);
            else
                return ArrayList(_elem.querySelectorAll(sSelector));
        },

        findByClassName : function(sClass)
        {
            return ArrayList(_elem === null ? null : _elem.getElementsByClassName(sClass));
        },

        size : function()
        {
            if (_elem === null)
                return 0;
            else
                return _elem.length === undefined ? 1 : _elem.length;
        },

        each : function(fnCallback)
        {
            try
            {
                if (_elem === null || _elem.length === undefined)
                    return;

                const len = _elem.length;
                for (let i = 0; i < len; i++)
                    fnCallback(_elem[i]);
            }
            catch(err)
            {
                console.log(err);
            }
        }
    }

};

var DeckList =
{
    _imageMap : {},
    _cardList : null,

    getImageUrlByCode : function(code)
    {
        return this._cardList.getImage(code);        
    },
    
    prepareDeckList : function()
    {
        var index = 0;
        var html = "";
        var htmlCharsAvatar = "";
        for (var _val of ViewCards.config.vsTypesResource)
        {
            index++;
            if (_val === "Site" || _val === "Region")
                continue;
            
            if (_val === "Avatar")
            {
                ViewCards.config.vsDeckContainerIds.push({ "id" : "avatar_" + index, "type" : _val, "resource":true});
                htmlCharsAvatar += '<div id="avatar_'+ index + '" class="d_container deck_part hidden"><h4>'+ _val + ' (<span class="count_type">0</span>)</h4><div class="result mt5"></div></div>';                
            }
            else if (_val === "Character")
            {
                ViewCards.config.vsDeckContainerIds.push({ "id" : "character_" + index, "type" : _val, "resource":true});
                htmlCharsAvatar += '<div id="character_'+ index + '" class="d_container deck_part hidden"><h4>'+ _val + ' (<span class="count_type">0</span>)</h4><div class="result mt5"></div></div>';                
            }
            else
            {
                ViewCards.config.vsDeckContainerIds.push({ "id" : "resource_" + index, "type" : _val, "resource":true});
                html += '<div id="resource_'+ index + '" class="d_container deck_part hidden"><h4>'+ _val + ' (<span class="count_type">0</span>)</h4><div class="result mt5"></div></div>';
            }
        }
        
        document.getElementById("deck_resources").innerHTML = html;
        document.getElementById("deck_chars").innerHTML = htmlCharsAvatar;

        html = "";
        for (var _val of ViewCards.config.vsTypesHazard)
        {
            index++;
            if (_val === "Site" || _val === "Region")
                continue;
            
            ViewCards.config.vsDeckContainerIds.push({ "id" : "hazard_" + index, "type" : _val, "resource":false});
            html += '<div id="hazard_'+ index + '" class="d_container deck_part hidden"><h4>'+ _val + ' (<span class="count_type">0</span>)</h4><div class="result mt5"></div></div>';
        }

        document.getElementById("deck_hazards").innerHTML = html;
    },
    
    addToDeckIndex : function(nIndex, sTargetDeck)
    {
        var pCard = ViewCards.config.jsonData[nIndex];
        return typeof pCard !== "undefined" && this.addToDeckCard(pCard, sTargetDeck);
    },
    
    addToDeck : function(sCode, sTargetDeck)
    {
        var pCard = ViewCards._getCardByCode(sCode);
        if (pCard === null)
            return false;
        else
            return this.addToDeckCard(pCard, sTargetDeck);
    },
    
    addToDeckCard : function(pCard, sTargetDeck)
    {
        if (pCard.count === 0)
        {
            console.log("No more cards of this instance can be added.");
            return false;
        }

        if (!DeckbuilderApi.add(sTargetDeck, pCard))
        {
            Notify.error("Cannot add card.");
            return false;
        }
        
        sCode = pCard.index;
        if (sTargetDeck === "sb")
            return this.addCardGeneric(pCard, sCode, "sideboard");
        else if (sTargetDeck === "avatar")
            return this.addCardToChars(pCard, sCode, true);
        else if (sTargetDeck === "chars" || sTargetDeck === "character")
            return this.addCardToChars(pCard, sCode, false);
        else if (sTargetDeck === "resource" || sTargetDeck === "hazard")
            return this.addCardToDeck(pCard, sCode);
        else if (sTargetDeck === "pool")
            return this.addCardGeneric(pCard, sCode, "pool");
        else
            return false;
    },

    getTargetContainerIdDeck : function(pCard, isResource)
    {
        var type = pCard.Secondary;
        for (var _set of ViewCards.config.vsDeckContainerIds)
        {
            if (_set.type === type && isResource === _set.resource)
                return _set.id;
        }
        
        return "";
    },
    
    addCardToChars : function(pCard, index, isAvatar)
    {
        var isHzard = false;
        var _containerId = "deck_chars";
        var targetType = isAvatar ? "avatar" : "character";

        var sTypeContainerId = this.getTargetContainerIdDeck(pCard, !isHzard);
        if (sTypeContainerId === "")
        {
            console.log("Cannot find sTypeContainerId for char " + isHzard);
            return false;
        }
        
        var categoryContainer = document.getElementById(sTypeContainerId);
        if (categoryContainer === null)
        {
            console.log("Cannot find categoryContainer for " + "#" + sTypeContainerId);
            return false;
        }
        
        var pEntry = document.getElementById(targetType + "_" + index);
        if (pEntry === null)
        {
            categoryContainer.classList.remove("hidden");
            categoryContainer.querySelector(".result").appendChild(this.getCardDeckToAddHtml(pCard, index, targetType));
            
            this.updateDeckLink(targetType + "_" + index);
        }
        else
        {
            const pCount = pEntry.querySelector(".count");
            if (pCount !== null)
                pCount.innerHTML = (parseInt(pCount.innerHTML) + 1);
        }
            
        
        let pCount = categoryContainer.querySelector("h4 span");
        if (pCount !== null)
            pCount.innerHTML = (parseInt(pCount.innerHTML) + 1);
        
        pCount = document.getElementById(_containerId).querySelector("h3 span");
        if (pCount !== null)
            pCount.innerHTML = (parseInt(pCount.innerHTML) + 1);

        return true;
    },
    
    addCardToDeck : function(pCard, index)
    {
        var isHzard = pCard.type === "Hazard";
        var targetType = isHzard ? "hazard" : "resource";
        var _containerId = isHzard ? "deck_hazards" : "deck_resources";

        var sTypeContainerId = this.getTargetContainerIdDeck(pCard, !isHzard);
        if (sTypeContainerId === "")
        {
            console.log("Cannot find sTypeContainerId for " + isHzard);
            return false;
        }
        
        var categoryContainer = document.getElementById(sTypeContainerId);
        if (categoryContainer === null)
        {
            console.log("Cannot find categoryContainer for " + "#" + sTypeContainerId);
            return false;
        }
        
        var pEntry = document.getElementById(targetType + "_" + index);
        if (pEntry === null)
        {
            categoryContainer.classList.remove("hidden");
            categoryContainer.querySelector(".result").appendChild(this.getCardDeckToAddHtml(pCard, index, targetType));
            this.updateDeckLink(targetType + "_" + index);
        }
        else
        {
            const pCount = pEntry.querySelector(".count");
            pCount.innerHTML = (parseInt(pCount.innerHTML) + 1);
        }

        const pCount = categoryContainer.querySelector("h4 span");       
        pCount.innerHTML = (parseInt(pCount.innerHTML) + 1);
        
        const pTmp = document.getElementById(_containerId).querySelector("h3 span");
        if (pTmp !== null)
            pTmp.innerHTML = (parseInt(pCount.innerHTML) + 1);

        return true;
    },
    
    addCardGeneric : function(pCard, index, pref)
    {
        index = pCard.index;
        var pEntry = document.getElementById(pref + "_" + index);

        /**
         * this is the first card of its title in the container list
         */
        if (pEntry === null)
        {
            /**
             * append this entry to its container
             */
            var elem = document.getElementById(pref);
            var sHtml = elem.innerHTML.trim();

            if (sHtml === "-" || sHtml === "")
                Utils.empty(elem);

            elem.appendChild(this.getCardDeckToAddHtml(pCard, index, pref));
            this.updateDeckLink(pref + "_" + index);
        }
        else /* already an entry available, so simply increase the counter */
        {
            const pCount = pEntry.querySelector(".count");
            if (pCount !== null)
                pCount.innerHTML = (parseInt(pCount.innerHTML) + 1);
        }
            
        this.updateCount("count_" + pref);
        return true;
    },
    
    getCardDeckToAddHtml : function(pCard, index, pref)
    {
        const div = document.createElement("div");
        div.setAttribute("id", pref + "_" + index);
        div.setAttribute("class", "dflex card_of_deck_construct");
        div.setAttribute("data-index", index);
        div.innerHTML = `<span class="action"  data-is-deck="${pref}">
            <a href="#" class="deck_add icon_add" title="increase">
                <img src="/media/assets/images/icon-transparent.png" alt="add">
            </a>
            <a href="#" class="deck_rem icon_remove" title="decrease">
                <img src="/media/assets/images/icon-transparent.png" alt="decrease">
            </a>
        </span>
        <span class="title card_deck_title">${pCard.code}</span>&nbsp;(<span class="count count_deck_entry">1</span>)`;
        
        return div;
    },
    
    /**
     * Update the counter value in a given SPAN by its id
     * @param {String} id 
     */
    updateCount : function(id)
    {
        var elem = document.getElementById(id);
        if (elem !== null)
            elem.innerHTML = "" + (parseInt(elem.innerHTML) + 1);
    },

    updateDeckLink : function(id)
    {
        var elem = document.getElementById(id);
        if (elem === null)
            return;

        elem.querySelector(".deck_add").onclick = function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();  
            
            var pSpan = Utils.closestByType(this, "span")
            if (pSpan === null)
                return false;

            var sTargetDeck = pSpan.getAttribute("data-is-deck");
            var pDiv = Utils.closestByType(pSpan, "div");
            
            var index = pDiv === null ? 0 : parseInt(pDiv.getAttribute("data-index"));
            var pCard = ViewCards.config.jsonData[index];

            if (!DeckbuilderApi.add(sTargetDeck, pCard))
            {
                Notify.error("Cannot add " + pCard.code);
                return false;
            }

            SearchResult.updateCardCount(index, -1);
            DeckList.increaseCurrentDeckCount(pDiv, index);
            return false;
        };

        elem.querySelector(".deck_rem").onclick = function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();

            var pSpan = Utils.closestByType(this, "span")
            if (pSpan === null)
                return false;

            var sTargetDeck = pSpan.getAttribute("data-is-deck");
            var pDiv = Utils.closestByType(pSpan, "div");
            var index = pDiv === null ? 0 : parseInt(pDiv.getAttribute("data-index"));
            var pCard = ViewCards.config.jsonData[index];

            if (!DeckbuilderApi.remove(sTargetDeck, pCard.code))
            {
                Notify.error("Cannot remove " + pCard.code + " from " + sTargetDeck);
                return false;
            }

            if (pDiv !== null)
                DeckList.reduceCurrentDeckCount(pDiv, index);

            let _count = ViewCards.config.jsonData[index].count;
            let jBubble = document.getElementById("count_" + index).parentNode.querySelector(".count_bubble");
            jBubble.innerHTML = _count;

            if (_count !== 0 && jBubble.classList.contains("hidden"))
                jBubble.classList.remove("hidden");

            return false;
        };

        elem.onmouseover = function()
        {
            const index = this.getAttribute("data-index");
            if (typeof index === "undefined")
            {
                console.log("no index");
                return;
            }
            
            const pCard = ViewCards.config.jsonData[index];
            if (pCard === null || typeof pCard === "undefined")
            {
                console.log("no card at " + index);
                return;
            }
           
            const elem = document.getElementById("deck_card_view");
            elem.innerHTML = '<img decoding="async" src="' + DeckList.getImageUrlByCode(pCard.code) + '">';
            elem.classList.remove("hidden");
        };
        
        elem.onmouseout = function()
        {
            const elem = document.getElementById("deck_card_view");
            elem.classList.add("hidden");
            Utils.empty(elem);
        };
    },
    
    increaseCurrentDeckCount : function(pDiv, index)
    {
        var pCount = pDiv.querySelector(".count");
        if (pCount === null)
            return;

        pCount.innerHTML = (parseInt(pCount.innerHTML) + 1);
        SearchResult.updateCardResultListCount(index);
        DeckList.calculateAndUpdateDeckCounters();
    },
    
    calculateAndUpdateDeckCounters : function()
    {
        var pContainer = document.getElementById("deck_container");
        var _size = 0;
        
        ArrayList(pContainer).find("div.deck_part").each(function(pThis)
        {
            const _count = DeckList.calculateEntries(pThis, "count_deck_entry");
            pThis.querySelector("span.count_type").innerHTML = _count;
            _size += _count;
        });

        // no pool
        // no sideboard
        _size -= DeckList.calculateEntryId("count_pool");
        _size -= DeckList.calculateEntryId("count_sideboard");
        document.getElementById("deck_count").innerHTML = _size;
        
        ArrayList(pContainer).find("div.deck_part_col").each((pThis)  => {

            const elem = pThis.querySelector("span.count_type_col");
            if (elem !== null)
                elem.innerHTML = DeckList.calculateEntries(pThis, "count_type");
        });

        document.getElementById("summary_resources").innerHTML = DeckList.getInnerHtml(document.getElementById("count_deck_r"));
        document.getElementById("summary_hazards").innerHTML =  DeckList.getInnerHtml(document.getElementById("count_deck_h"));
        document.getElementById("summary_sideboard").innerHTML = DeckList.getInnerHtml(document.getElementById("count_sideboard"));
    },

    getInnerHtml(elem)
    {
        return elem === null ? "" : elem.innerHTML;
    },

    calculateEntryId : function(sId)
    {
        try
        {
            return parseInt(document.getElementById(sId).innerHTML);
        }
        catch (e)
        {
        }
        
        return 0;
    },
                                              
    calculateEntries : function(pContainer, sClass)
    {
        let _count = 0;
        ArrayList(pContainer).find("span." + sClass).each((_elem) => _count += parseInt(_elem.innerHTML));
        return _count;
    },
    
    removeEntry : function(pDiv)
    {
        const pPar = pDiv.parentNode;
        Utils.removeNode(pDiv);

        if (ArrayList(pPar).find("div").size() === 0)
        {
            const pDeckPart = pPar.parentNode;
            if (pDeckPart.classList.contains("d_container"))
                pDeckPart.classList.add("hidden");
        }
    },

    reduceCurrentDeckCount : function(pDiv, index)
    {
        SearchResult.updateCardCount(index, 1); 
        
        const pCount = pDiv.querySelector(".count");
        const nCount = parseInt(pCount.innerHTML) - 1;
        pCount.innerHTML = nCount;

        if (nCount === 0)
        {
            var elem = document.getElementById("deck_card_view");
            elem.classList.add("hidden");
            Utils.empty(elem);
            this.removeEntry(pDiv);
        }

        SearchResult.updateCardResultListCount(index);
        DeckList.calculateAndUpdateDeckCounters();
        return nCount;
    }

};

var SearchResult = {
    
    setResultHtml : function(sHtml)
    {
        document.getElementById("result").innerHTML = sHtml;
    },

    getResultSize : function(vnIndicesCharacters)
    {
        var _size = 0;
        for (var _val in vnIndicesCharacters)
            _size += vnIndicesCharacters[_val].length;
        
        return _size;
    },
    
    displayResult : function(vnIndicesCharacters)
    {
        var nSize = this.getResultSize(vnIndicesCharacters);
        document.getElementById("size").innerHTML = nSize;

        if (nSize === 0)
        {
            SearchResult.setResultHtml("");
            this.setLinkList("");
            return;
        }

        var _tmp, sTplHtml, _html = "", _rowHtml, _htmlData = "";
        var _placeholderMap, _current;
        for (var key in vnIndicesCharacters)
        {
            _html = "";
            sTplHtml = this.getTemplateTable(key);
            if (sTplHtml === null || sTplHtml === "" || key === "Site" || key === "" || key === "Region")
                continue;

            _placeholderMap = this.getPlaceholderMap(key);
            
            _rowHtml = this.extractRowHtml(sTplHtml);
            if (_rowHtml === "")
                continue;

            for (var _index = 0; _index < vnIndicesCharacters[key].length; _index++)
            {
                _current = "";
                _current = this.createSearchResultHtml(_rowHtml, _placeholderMap, ViewCards.config.jsonData[vnIndicesCharacters[key][_index]]);
                _current = _current.replace("{index}", vnIndicesCharacters[key][_index]);
                _current = _current.replace("{gindex}", vnIndicesCharacters[key][_index]);
                _html += _current.replace("{cindex}", vnIndicesCharacters[key][_index]);
            }

            if (_html !== "")
                _htmlData += '<div class="category" data-id="' + key.toString() + '">' + _html + '</div>';
        }
        
        if (_htmlData !== "")
        {
            var listTypes = [];
            for (var key in vnIndicesCharacters)
                listTypes.push(key);
            listTypes.sort();
            
            let sHtmlEvent = "";

            let sHtmlItem = "";
            let sHtmlChars = "";
            let sHtmlOther = "";
            let sHtmlCreature = "";
            
            _html = "";
            for (var key of listTypes)
            {
                switch (key.toLowerCase())
                {
                    case "faction":
                    case "ally":
                    case "not specified":
                        sHtmlOther += this.createLinkListHtml(key, vnIndicesCharacters[key].length);
                        break;

                    case "creature":
                        sHtmlCreature += this.createLinkListHtml(key, vnIndicesCharacters[key].length);
                        break;
                    
                    case "haven":
                    case "site":
                    case "region":
                        break;

                    default:
                        
                        if (key.toString().toLowerCase().endsWith("item"))
                            sHtmlItem += this.createLinkListHtml(key, vnIndicesCharacters[key].length);
                        else if (key.toString().toLowerCase().startsWith("creature"))
                            sHtmlCreature += this.createLinkListHtml(key, vnIndicesCharacters[key].length);
                        else if (key.toString().toLowerCase().indexOf(" event") !== -1)
                            sHtmlEvent += this.createLinkListHtml(key, vnIndicesCharacters[key].length);
                        else
                            sHtmlChars += this.createLinkListHtml(key, vnIndicesCharacters[key].length);
                        break;
                }
            }
            
            if (sHtmlEvent !== "")
                _html += "<ul>" + sHtmlEvent + "</ul>";
            if (sHtmlItem !== "")
                _html += "<ul>" + sHtmlItem + "</ul>";
            if (sHtmlChars !== "")
                _html += "<ul>" + sHtmlChars + "</ul>";
            if (sHtmlCreature !== "")
                _html += "<ul>" + sHtmlCreature + "</ul>";
            if (sHtmlOther !== "")
                _html += "<ul>" + sHtmlOther + "</ul>";
            
            this.setLinkList(_html + '<div class="clear"></div>');
        }

        this.setResultHtml(_htmlData);
        this.onUpdateLinkList();
        this.onUpdateLinkAddTo();
    },
        
    updateCardResultListCount : function(index)
    {
        var elem = document.getElementById("count_" + index);
        if (elem !== null)
            elem.setAttribute("data-count", ViewCards.config.jsonData[index].count);
    },

    /**
     * updates the ADD buttons on the result ROW
     */
    onUpdateLinkAddTo : function()
    {
        ArrayList(document.getElementById("result")).find("a.link_add").each((pThis) => pThis.onclick = function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            const pLink = e.target;
            const sTargetDeck = pLink.getAttribute("data-target");
            const pDiv = Utils.closestByType(pLink, "div");
            const nIndex = parseInt(pDiv.getAttribute("data-index"));
            const sCount = pDiv.getAttribute("data-count");

            if (sCount === "" || sCount === "0")
            {
                console.log("nothing left");
                return false;
            }
                        
            if (DeckList.addToDeckIndex(nIndex, sTargetDeck))
            {
                console.log("Successfully added card to deck");

                SearchResult.updateCardCount(nIndex, -1);
                
                let _cnt = parseInt(sCount) - 1;
                pDiv.setAttribute("data-count", _cnt);
                
                let jBubble = pDiv.parentNode.querySelector(".count_bubble");
                jBubble.innerHTML = _cnt;
                if (_cnt === 0 && !jBubble.classList.contains("hidden"))
                    jBubble.classList.add("hidden");
                
                DeckList.calculateAndUpdateDeckCounters();
            }
            
            return false;
        });

        const _tmp = document.querySelectorAll(".linklist a");
        if (_tmp !== null && _tmp.length > 0)
            _tmp[0].dispatchEvent(new Event('click'));
    },

    updateCardCount : function(index, count)
    {
        var pCard = ViewCards.getCardByIndex(index);
        if (pCard !== null)
            pCard.count += count;
    },

    extractRowHtml : function(sTplHtml)
    {
        return sTplHtml;
    },

    extractTableHead : function(sTplHtml)
    {
        var nPos = sTplHtml.indexOf("<tbody>");
        if (nPos === -1)
            return sTplHtml;
        else
            return sTplHtml.substring(0, nPos);
    },

    getTemplateTable : function(sType)
    {
        return document.getElementById("tplDefault").innerHTML;
    },

    getTemplateTableHead : function(sType)
    {
        return "";
    },

    createSearchResultHtml : function(sTplHtml, pMap, pJson)
    {
        var sData = sTplHtml;
        var _title = CardData.get(pJson, "title", "");
        if (_title === "")
            return "";

        for (var i = 0; i < pMap.length; i++)
            sData = sData.replace(pMap[i].placeholder, CardData.get(pJson, pMap[i].field, pMap[i].default));

        sData = sData.replace("{img}", DeckList.getImageUrlByCode(CardData.get(pJson, "code", "")));

        var isHzard = pJson.type === "Hazard";
        if (isHzard)
            sData = sData.replace("{data-target}", "hazard");
        else
        {
            if (pJson.Secondary === "Avatar")
                sData = sData.replace("{data-target}", "avatar");
            else if (pJson.Secondary === "Character")
                sData = sData.replace("{data-target}", "character");
            else
                sData = sData.replace("{data-target}", "resource");
        }
        
        return sData;
    },
    
    
    setLinkList : function(sHtml)
    {
        document.getElementById("linklist").innerHTML = sHtml;
    },
    
    createLinkListHtml : function(key,size)
    {
        return '<li><a href="#" class="linklist" data-id="' + key + '">' + key.toUpperCase() + " (" + size + ")</a></li>";
    },

    onUpdateLinkList : function()
    {
        ArrayList(document).find(".linklist a").each((_elem) => _elem.onclick = function(e)
        {
            e.preventDefault();

            var sId = e.target.getAttribute("data-id");
            if (sId === "")
                return false;

            ArrayList(document.getElementById("result")).find("div.category").each(Utils.hide);
            
            /* hide all */
            ArrayList(document.getElementById("result")).findByClassName("preview").each((elem) => elem.setAttribute("src", elem.getAttribute("data-hide")));
            ArrayList(document.getElementById("result")).findByClassName("category").each(function(pTable)
            {
                if (sId !== pTable.getAttribute("data-id"))
                    return;
                
                ArrayList(pTable).findByClassName("preview").each((elem) => elem.setAttribute("src", elem.getAttribute("data-src")));
                Utils.show(pTable);
            });
            
            ArrayList(document).find("li.current").each((_elem) => _elem.classList.remove("current"));
            this.parentNode.classList.add("current");
            
            return false;
        });

        const _tmp = document.getElementsByClassName("linklist");
        if (_tmp !== null && _tmp.length > 0)
            _tmp[0].dispatchEvent(new Event('click'));
    },
    
    pair : function(key, sVal, sDefault)
    {
        return {
            "placeholder" : key,
            "field" : sVal,
            "default" : sDefault
        };
    },

    getPlaceholderMap : function(sType)
    {
        var map = [];

        map.push(this.pair("{title}", "title", ""));
        map.push(this.pair("{subtype}", "subtype", ""));
        map.push(this.pair("{align}", "alignment", ""));
        map.push(this.pair("{type}", "type", ""));
        map.push(this.pair("{mps}", "MPs", ""));
        map.push(this.pair("{id}", "code", ""));
        map.push(this.pair("{set_code}", "set_code", ""));
        map.push(this.pair("{unique}", "uniqueness", "false"));
        map.push(this.pair("{count}", "count", "0"));
        map.push(this.pair("{count2}", "count", "0"));
        map.push(this.pair("{setcode}", "set_code", ""));
        map.push(this.pair("{set-code}", "set_code", ""));

        switch(sType)
        {
            case "Avatar":
            case "Character":
            case "Ally":
                map.push(this.pair("{mind}", "Mind", "-"));
                map.push(this.pair("{pw}", "Prowess", "0"));
                map.push(this.pair("{body}", "Body", "0"));
                map.push(this.pair("{direct}", "Direct", "-"));
                break;

            default:
                break;
        }

        return map;
    }
    
};

var SearchBar = {
    
    initFormFields : function()
    {
        var vsOnChange = ["card_title", "card_text", "view_card_type", "view_card_align", "view_card_category"];
        var vsOnEnter = ["card_title", "card_text"];
        
        for (var _id of vsOnEnter)
        {
            document.getElementById(_id).onkeydown = function(e)
            {
                if(e.keyCode === '13')
                    ViewCards.search();
            };
        }

        for (var _id of vsOnChange)
            document.getElementById(_id).onchange = () => ViewCards.search();
    },
    
    updateFormFields : function()
    {
        this.fillSelect("view_card_type", ViewCards.config.vsType, "_alltype");
        this.fillSelect("view_card_align", ViewCards.config.vsAlign, "_allalign");
        this.fillSelect("view_card_category", ViewCards.config.vsCategory, "_allcategory");
    },

    fillSelect : function(sId, sortedList, sAllowAll)
    {
        var option;
        var pSelectType = document.getElementById(sId);

        if (sAllowAll !== "")
        {
            option = document.createElement("option");
            option.text = "Allow All";
            option.value = sAllowAll;
            pSelectType.add(option);
        }

        for (var _val of sortedList)
        {
            option = document.createElement("option");
            option.text = _val;
            option.value = _val;
            pSelectType.add(option);
        }

    }
    
};


const ViewCards =
{
    config : {
        cardIndices : {},
        jsonData : null,
        vsAlign : [],
        vsType : [],
        vsCategory : [],
        vnIndicesCharacters : {},
        vsDeckContainerIds : [],
        vsTypesAvatarChars : [],
        vsTypesResource : [],
        vsTypesHazard : [],
        vsCodeIndices : { }
    },

    _quantities : new Quantities(),
    
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

        for (var card of json) 
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
        }
    },
    
    _getCardByCode : function(code)
    {
        if (typeof ViewCards.config.cardIndices[code] === "undefined")
        {
            console.log("Cannot find " + code);
            return null;
        }
        else
            return ViewCards.config.cardIndices[code];
    },
    
    _updateMap : function()
    {
        for (var _card of ViewCards.config.jsonData) 
            ViewCards.config.cardIndices[_card.code] = _card;
    },
    
    getCardFromByCode : function(code)
    {
        for (var _card of ViewCards.config.jsonData) 
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
        
        if (typeof ViewCards.config.vsCodeIndices[code] === "undefined")
        {
            console.log("ViewCards.config.vsCodeIndices not set");
            return null;
        };

        var index = ViewCards.config.vsCodeIndices[code];
        if (typeof ViewCards.config.jsonData[index] === "undefined")
        {
            console.log("no card at index " + index);
            return null;
        }

        if (ViewCards.config.jsonData[index]["code"] === code)
            return ViewCards.config.jsonData[index];
        
        return this.iterateThrooughCards(code);
    },
    
    iterateThrooughCards : function(code)
    {
        for (var _card of ViewCards.config.jsonData) 
        {
            if (_card["code"] === code)
            {
                console.log("alternative found " + code + " in ");
                return _card;
            }
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
        
        var _type;
        for (var _type in json["secondaries"])
        {
            ViewCards.config.vsType.push(_type);
            ViewCards.config.vnIndicesCharacters[_type] = json["secondaries"][_type];
        }

        for (var _align in json["alignment"])
            ViewCards.config.vsAlign.push(_align);

        for (var _type in json["type"])
            ViewCards.config.vsCategory.push(_type);

        if (json["hazards"] !== undefined)
        {
            for (var _type of json["hazards"])
                ViewCards.config.vsTypesHazard.push(_type);
        }

        if (json["resources"] !== undefined)
        {
            for (var _type of json["resources"])
                ViewCards.config.vsTypesResource.push(_type);
        }
    },
    
    searchThread : function(sType, sAlign, sTitle, sText, sCategory)
    {
        SearchResult.displayResult(ViewCards.doSearch(sType, sAlign, sCategory, sTitle, sText));
    },
    
    search : function()
    {
        var sType = document.getElementById("view_card_type").value;
        var sAlign = document.getElementById("view_card_align").value;

        var sTitle = document.getElementById("card_title").value;
        var sText = document.getElementById("card_text").value;
        var sCategory = document.getElementById("view_card_category").value;
        
        if (sType !== "" || sAlign !== "" || sTitle !== "" || sText !== "" || sCategory !== "")
            ViewCards.searchThread(sType, sAlign, sTitle, sText, sCategory);
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
    
    doSearch : function(sType, sAlign, sCategory, sTitle, sText)
    {
        sType = sType.toString();
        sAlign = sAlign.toString();
        sCategory = sCategory.toString();
        sTitle = sTitle.toString().toLowerCase().trim();
        sText = sText.toString().toLowerCase().trim();

        if (sText.length < 3)
            sText = "";
        if (sTitle.length < 3)
            sTitle = "";
            
        let bAllowAllCat = sCategory === "_allcategory";
        let bAllowAllAlign = sAlign === "_allalign";
        let bAllowAllType = sType === "_alltype";
        
        var vnIndicesCharacters = {};
        
        var _index = -1, _type, _align, _title, _text, _cate;
        for (var card of ViewCards.config.jsonData) 
        {
            _index++;

            if (card.count === -1)
                continue;

            _type = card.Secondary;
            _align = card.alignment;
            _title = card.title;
            _text = card.text;
            
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
            
            if ( typeof vnIndicesCharacters[_type.toString()] === 'undefined' )
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
        this.resetAvail(ViewCards.config.jsonData);
    },
    
    setReduced : function(jData)
    {
        if (typeof jData === "undefined" || jData.length === 0)
            return;

        ViewCards.config.jLimis = {};
        let _code;
        for (var i = 0; i < jData.length; i++)
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
        
        SearchBar.updateFormFields();
        SearchBar.initFormFields();

        DeckList.prepareDeckList();
    }
};

const Main = {
    
    onError : function(error)
    {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    },
    
    createCardsMeta : function(json)
    {
        return new CreateCardsMeta(json);
    },
    
    initCardsSorted : function()
    {
        fetch("/data/list/cards").then((response) => 
        {
            response.json().then(function(jsonCards)
            {
                let jMeta = Main.createCardsMeta(jsonCards);
                ViewCards.initCards(jsonCards, [ ]);
                ViewCards.initIndices(jMeta);
                DeckbuilderApi.init();
            });
        });
    },
    
    loadImageList : function()
    {
        fetch("/data/list/images").then((response) => 
        {
            response.json().then(function(imageList)
            {
                DeckList._cardList = new CardList(imageList.images, [], true, false, document.body.getAttribute("data-image-cdn"));
            });
        });
    },
    
    init : function()
    {
        Main.loadImageList();
        Main.initCardsSorted(false);
    },

    isSealed : function()
    {    
        let sString = window.location.search;
        let nPos = sString.indexOf("=");
        sString = nPos === -1 ? "" : sString.substring(nPos + 1).trim();
        return sString.indexOf("true") === 0;
    }

};

(function()
{
    Main.init();
})();

