
var DeckList =
{

    init : function()
    {
        let elem = document.createElement("div");
        elem.setAttribute("class", "bgblue deckbuilding-summary");
        elem.innerHTML = `
            <span id="summary_characters">0</span> <label>Characters</label><br>
            <span id="summary_resources">0</span> <label>Resources</label><br>
            <span id="summary_hazards">0</span> <label>Hazards</label><br>
            <span id="summary_sideboard">0</span> <label>Sideboard</label>`;
        document.body.prepend(elem);

        elem = document.createElement("div");
        elem.setAttribute("class", "decklist fl bgblue");
        elem.setAttribute("id", "deck_container");
        elem.innerHTML = `<h2><span id="deck_name">Your Deck</span> (<span id="deck_count">0</span>)</h2>

        <div style="text-align: center; margin: 20px 0;">
            <input type="button" class="button-small" name="start" id="save_deck" value="Save deck" />
        </div>

        <div class="pos-rel">
            <div class="pos-rel fl w48 deck_part">
                <h3>Pool (<span class="count_type" id="count_pool">0</span>)</h3>
                <div id="pool" class="d_container pt5">-</div>
            </div>
            <div class="pos-rel fl w48 deck_part_col" id="deck_chars">
                <h3 class="mr-20">Characters (<span class="count_type_col" id="count_deck_chars">0</span>)</h3>
            </div>
            <div class="clearfix"> </div>
        </div>

        <div class="pos-rel">
            <div class="pos-rel fl w48 deck_part_col" id="deck_resources">
                <h3 class="mr-20">Resources (<span class="count_type_col" id="count_deck_r">0</span>)</h3>
            </div>

            <div class="pos-rel fl w48 deck_part_col" id="deck_hazards">
                <h3>Hazards (<span class="count_type_col" id="count_deck_h">0</span>)</h3>
            </div>
            <div class="clearfix"> </div>
        </div>

        <div class="pos-rel deck_part">
            <h3>Sideboard (<span class="count_type" id="count_sideboard">0</span>)</h3>
            <div id="sideboard" class="d_container pt5">-</div>
        </div>

        <div id="deckentry-tpl" class="hidden">
            <div id="IDID_id" class="dflex card_of_deck_construct" data-index="{index}">
                <span class="action"  data-is-deck="{data-is-deck}">
                    <a href="#" class="deck_add icon_add" title="increase">
                        <img src="/media/assets/images/icon-transparent.png" alt="add">
                    </a>
                    <a href="#" class="deck_rem icon_remove" title="decrease">
                        <img src="/media/assets/images/icon-transparent.png" alt="decrease">
                    </a>
                </span>
                <span class="title card_deck_title">{title}</span>&nbsp;(<span class="count count_deck_entry">1</span>)
            </div>
        </div>`;

        document.getElementById("result_container").prepend(elem);
        document.getElementById("linklist").parentNode.classList.add("list_left");

        elem = document.createElement("div");
        elem.setAttribute("id", "deck_card_view");
        elem.setAttribute("class", "hidden");
        document.body.appendChild(elem);
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
                DomUtils.empty(elem);

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

            var pSpan = DomUtils.closestByType(this, "span")
            if (pSpan === null)
                return false;

            var sTargetDeck = pSpan.getAttribute("data-is-deck");
            var pDiv = DomUtils.closestByType(pSpan, "div");
            
            var index = pDiv === null ? 0 : parseInt(pDiv.getAttribute("data-index"));
            var pCard = ViewCards.config.jsonData[index];

            if (!DeckbuilderApi.add(sTargetDeck, pCard))
            {
                Notify.error("Cannot add " + pCard.code);
                return false;
            }

            document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-updatecardcount", { "detail": { index : index, count: -1} }));
            DeckList.increaseCurrentDeckCount(pDiv, index);
            return false;
        };

        elem.querySelector(".deck_rem").onclick = function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();

            var pSpan = DomUtils.closestByType(this, "span")
            if (pSpan === null)
                return false;

            var sTargetDeck = pSpan.getAttribute("data-is-deck");
            var pDiv = DomUtils.closestByType(pSpan, "div");
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
            let _elem = document.getElementById("count_" + index);
            if (_elem !== null)
            {
                let jBubble = _elem.parentNode.querySelector(".count_bubble");
                if (jBubble !== null)
                {
                    jBubble.innerHTML = _count;
                    if (_count !== 0 && jBubble.classList.contains("hidden"))
                        jBubble.classList.remove("hidden");
                }
            }

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
            elem.innerHTML = '<img decoding="async" src="' + getImageUrlByCode(pCard.code) + '">';
            elem.classList.remove("hidden");
        };
        
        elem.onmouseout = function()
        {
            const elem = document.getElementById("deck_card_view");
            elem.classList.add("hidden");
            DomUtils.empty(elem);
        };
    },
    
    increaseCurrentDeckCount : function(pDiv, index)
    {
        var pCount = pDiv.querySelector(".count");
        if (pCount === null)
            return;

        pCount.innerHTML = (parseInt(pCount.innerHTML) + 1);
        document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-updatecardresultlistcount", { "detail": index }));

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
        return elem === null ? "0" : elem.innerHTML;
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
        DomUtils.removeNode(pDiv);

        if (ArrayList(pPar).find("div").size() === 0)
        {
            const pDeckPart = pPar.parentNode;
            if (pDeckPart.classList.contains("d_container"))
                pDeckPart.classList.add("hidden");
        }
    },

    reduceCurrentDeckCount : function(pDiv, index)
    {
        
        
        const pCount = pDiv.querySelector(".count");
        const nCount = parseInt(pCount.innerHTML) - 1;
        pCount.innerHTML = nCount;

        if (nCount === 0)
        {
            var elem = document.getElementById("deck_card_view");
            elem.classList.add("hidden");
            DomUtils.empty(elem);
            this.removeEntry(pDiv);
        }

        document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-updatecardcount", { "detail": { index : index, count: 1} }));
        document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-updatecardresultlistcount", { "detail": index }));
        DeckList.calculateAndUpdateDeckCounters();
        return nCount;
    }

};

(function()
{
    DeckList.init();
})();

document.body.addEventListener("meccg-deckbuilder-preparedecklist", DeckList.prepareDeckList, false);
