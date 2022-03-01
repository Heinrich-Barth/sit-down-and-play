
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
        elem.innerHTML = `<h2><span class="fa fa-eye" id="deck_name"></span><input type="text" class="deckname" id="deckname" placeholder="Your deck name" value=""> (<span id="deck_count">0</span>)</h2>

        <div style="text-align: center; margin: 20px 0;">
            <button class="button-small" id="save_deck"><i class="fa fa-floppy-o" aria-hidden="true"></i> Save deck</button>
        </div>

        <div class="pos-rel">
            <div class="pos-rel fl w48 deck_part">
                <label for="checkbox_pool">Pool (<span class="count_type" id="count_pool">0</span>)</label>
                <input type="checkbox" id="checkbox_pool">
                <div id="pool" class="d_container pt5">-</div>
            </div>
            <div class="pos-rel fl w48 deck_part_col" id="deck_chars">
                <label for="checkbox_ch" class="mr-20">Characters (<span class="count_type_col" id="count_deck_chars">0</span>)</label>
                <input type="checkbox" id="checkbox_ch">
            </div>
            <div class="clearfix"> </div>
        </div>

        <div class="pos-rel">
            <div class="pos-rel fl w48 deck_part_col" id="deck_resources">
                <label for="checkbox_res" class="mr-20">Resources (<span class="count_type_col" id="count_deck_r">0</span>)</label>
                <input type="checkbox" id="checkbox_res">
            </div>

            <div class="pos-rel fl w48 deck_part_col" id="deck_hazards">
                <label for="checkbox_haz">Hazards (<span class="count_type_col" id="count_deck_h">0</span>)</label>
                <input type="checkbox" id="checkbox_haz">
            </div>
            <div class="clearfix"> </div>
        </div>

        <div class="pos-rel deck_part">
            <label for="checkbox_sb">Sideboard (<span class="count_type" id="count_sideboard">0</span>)</label>
            <input type="checkbox" id="checkbox_sb">
            <div id="sideboard" class="d_container no-pad-top">
                <h4>Characters</h4>
                <div class="pos-rel fl w48 deck_part_col" id="sb_chars"></div>

                <h4>Resources</h4>
                <div class="pos-rel fl w48 deck_part_col" id="sb_resources"></div>

                <h4>Hazards</h4>
                <div class="pos-rel fl w48 deck_part_col" id="sb_hazards"></div>
                <div class="clearfix"> </div>
            </div>
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

        elem.querySelector("h2").onclick = () => document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-viewdeck", { "detail": "" }));

        document.getElementById("result_container").prepend(elem);
        document.getElementById("linklist").parentNode.classList.add("list_left");

        elem = document.createElement("div");
        elem.setAttribute("id", "deck_card_view");
        elem.setAttribute("class", "hidden");
        document.body.appendChild(elem);
        document.body.dispatchEvent(new CustomEvent("meccg-init-dropzone", { "detail": "deck_container" })); /** update the deck list view */

        
        const list = document.getElementById("deck_container").querySelectorAll("label");
        for (let _element of list)
        {
            if (!_element.hasAttribute("data-no-arrow"))
            {
                _element.setAttribute("data-open", "fa-chevron-down");
                _element.setAttribute("data-close", "fa-chevron-up");
                _element.classList.add("fa");
                _element.classList.add("fa-chevron-down");
            }
        }
            
    },

    toggleDeckPart : function(e)
    {
        console.log(e.target);
    },

    removeExisting : function()
    {
        ArrayList(document.getElementById("deck_container")).find("div.card_of_deck_construct").each(DomUtils.removeNode);
        ArrayList(document.getElementById("deck_container")).find("span.count_type_col").each((elem) => elem.innerText = "0");
        ArrayList(document.querySelector(".deckbuilding-summary")).find("span").each((elem) => elem.innerText = "0");
    },

    prepareDeckList : function()
    {
        let index = 0;
        let html = "";
        let htmlCharsAvatar = "";
        for (let _val of ViewCards.config.vsTypesResource)
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
            else if (_val === "Agent")
            {
                ViewCards.config.vsDeckContainerIds.push({ "id" : "agent_" + index, "type" : _val, "resource":true});
                htmlCharsAvatar += '<div id="agent_'+ index + '" class="d_container deck_part hidden"><h4>'+ _val + ' (<span class="count_type">0</span>)</h4><div class="result mt5"></div></div>';                
            }
            else
            {
                ViewCards.config.vsDeckContainerIds.push({ "id" : "resource_" + index, "type" : _val, "resource":true});
                html += '<div id="resource_'+ index + '" class="d_container deck_part hidden"><h4>'+ _val + ' (<span class="count_type">0</span>)</h4><div class="result mt5"></div></div>';
            }
        }
        
        {
            const pRes = document.getElementById("deck_resources");
            pRes.innerHTML = pRes.innerHTML + html;
        }
        
        {
            const pRes = document.getElementById("deck_chars");
            pRes.innerHTML = pRes.innerHTML + htmlCharsAvatar;
        }
        
        html = "";
        for (let _val of ViewCards.config.vsTypesHazard)
        {
            index++;
            if (_val === "Site" || _val === "Region")
                continue;
            
            ViewCards.config.vsDeckContainerIds.push({ "id" : "hazard_" + index, "type" : _val, "resource":false});
            html += '<div id="hazard_'+ index + '" class="d_container deck_part hidden"><h4>'+ _val + ' (<span class="count_type">0</span>)</h4><div class="result mt5"></div></div>';
        }

        {
            const pRes = document.getElementById("deck_hazards");
            pRes.innerHTML = pRes.innerHTML + html;
        }
    },

    onAddToDeckList : function(e)
    {
        DeckList.addToDeckCard(ViewCards.config.jsonData[e.detail.index], e.detail.target);
    },
    
    addToDeck : function(sCode, sTargetDeck)
    {
        return this.addToDeckCard(ViewCards._getCardByCode(sCode), sTargetDeck);
    },
    
    addToDeckCard : function(pCard, sTargetDeck)
    {
        if (pCard === undefined || pCard === null)
            return false;
        
        const sCode = pCard.index;
        if (sTargetDeck === "sideboard")
            this.addCardSideboard(pCard, sCode);
        else if (sTargetDeck === "avatar")
            this.addCardToChars(pCard, sCode, true);
        else if (sTargetDeck === "chars" || sTargetDeck === "character")
            this.addCardToChars(pCard, sCode, false);
        else if (sTargetDeck === "resource" || sTargetDeck === "hazard")
            this.addCardToDeck(pCard, sCode);
        else if (sTargetDeck === "pool")
            this.addCardGeneric(pCard, sCode, "pool");
        
        return true;
    },

    getTargetContainerIdDeck : function(pCard, isResource)
    {
        const type = pCard.Secondary;
        for (let _set of ViewCards.config.vsDeckContainerIds)
        {
            if (_set.type === type && isResource === _set.resource)
                return _set.id;
        }
        
        return "";
    },
    
    addCardToChars : function(pCard, index, isAvatar)
    {
        let isHzard = false;
        const _containerId = "deck_chars";
        const targetType = isAvatar ? "avatar" : "character";

        const sTypeContainerId = this.getTargetContainerIdDeck(pCard, !isHzard);
        if (sTypeContainerId === "")
        {
            console.log("Cannot find sTypeContainerId for char " + isHzard);
            return false;
        }
        
        const categoryContainer = document.getElementById(sTypeContainerId);
        if (categoryContainer === null)
        {
            console.log("Cannot find categoryContainer for " + "#" + sTypeContainerId);
            return false;
        }
        
        const pEntry = document.getElementById(targetType + "_" + index);
        if (pEntry === null)
        {
            categoryContainer.classList.remove("hidden");
            this.sortInto(categoryContainer.querySelector(".result"), this.getCardDeckToAddHtml(pCard, index, targetType), pCard.code);
            this.updateDeckLink(targetType + "_" + index);
        }
        else
        {
            const pElemCount = pEntry.querySelector(".count");
            if (pElemCount !== null)
                pElemCount.innerText = (parseInt(pElemCount.innerText) + 1);
        }
            
        let pCount = categoryContainer.querySelector("h4 span");
        if (pCount !== null)
            pCount.innerText = (parseInt(pCount.innerText) + 1);
        
        pCount = document.getElementById(_containerId).querySelector("h3 span");
        if (pCount !== null)
            pCount.innerText = (parseInt(pCount.innerText) + 1);

        return true;
    },

    addCardSideboard : function(pCard, index)
    {
        let _containerId;
        if (pCard.type === "Hazard")
            _containerId = "sb_hazards";
        else if (pCard.type === "Character")
            _containerId = "sb_chars";
        else
            _containerId = "sb_resources";

        return this.addCardGeneric(pCard, index, _containerId);
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
            this.sortInto(categoryContainer.querySelector(".result"), this.getCardDeckToAddHtml(pCard, index, targetType), pCard.code);
            this.updateDeckLink(targetType + "_" + index);
        }
        else
        {
            const pElemCount = pEntry.querySelector(".count");
            if (pElemCount !== null)
                pElemCount.innerText = (parseInt(pElemCount.innerText) + 1);
        }

        const pCount = categoryContainer.querySelector("h4 span");       
        if (pCount !== null)
            pCount.innerText = (parseInt(pCount.innerText) + 1);
        
        const pTmp = document.getElementById(_containerId).querySelector("h3 span");
        if (pTmp !== null)
            pTmp.innerText = (parseInt(pCount.innerText) + 1);

        return true;
    },
    
    addCardGeneric : function(pCard, index_, pref)
    {
        const index = pCard.index;
        const pEntry = document.getElementById(pref + "_" + index);

        /**
         * this is the first card of its title in the container list
         */
        if (pEntry === null)
        {
            /**
             * append this entry to its container
             */
            const elem = document.getElementById(pref);
            const sHtml = elem.innerHTML.trim();

            if (sHtml === "-" || sHtml === "")
                DomUtils.empty(elem);

            this.sortInto(elem, this.getCardDeckToAddHtml(pCard, index, pref), pCard.code);
            this.updateDeckLink(pref + "_" + index);
        }
        else /* already an entry available, so simply increase the counter */
        {
            const pCount = pEntry.querySelector(".count");
            if (pCount !== null)
                pCount.innerText = (parseInt(pCount.innerText) + 1);
        }
            
        this.updateCount("count_" + pref);
    },

    sortInto : function(elemContainer, pNewElement, title)
    {
        let nRes;
        let thisTitle;
        let elem;
        const list = elemContainer.querySelectorAll("div");
        const len = list.length;
        for (let i = 0; i < len; i++)
        {
            elem = list[i];
            thisTitle = elem.getAttribute("data-code");
            nRes = thisTitle !== undefined && title.localeCompare(thisTitle) < 0;
            if (nRes)
            {
                elemContainer.insertBefore(pNewElement, elem)
                return;
            }
        }

        if (len === 0)
            elemContainer.prepend(pNewElement);
        else
            elemContainer.appendChild(pNewElement);
    },
    
    getCardDeckToAddHtml : function(pCard, index, pref)
    {
        const div = document.createElement("div");
        div.setAttribute("id", pref + "_" + index);
        div.setAttribute("class", "dflex card_of_deck_construct");
        div.setAttribute("data-index", index);
        div.setAttribute("data-code", pCard.code);
        div.innerHTML = `<span class="action"  data-is-deck="${pref}">
            <a href="#" class="deck_add icon_add" title="increase">
                <i class="fa fa-plus-circle" aria-hidden="true" title="Add to deck"></i>
            </a>
            <a href="#" class="deck_rem icon_remove" title="decrease">
                <i class="fa fa-minus-circle" aria-hidden="true" title="Remove from deck"></i>
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
        const elem = document.getElementById(id);
        if (elem !== null)
            elem.innerText = "" + (parseInt(elem.innerText) + 1);
    },

    updateDeckLink : function(id)
    {
        const elem = document.getElementById(id);
        if (elem === null)
            return;

        elem.querySelector(".deck_add").onclick = function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();

            const pSpan = DomUtils.closestByType(this, "span")
            const pDiv = pSpan === null ? null : DomUtils.closestByType(pSpan, "div");
            if (pDiv !== null)
            {
                const sTargetDeck = pSpan.getAttribute("data-is-deck");
                const index = parseInt(pDiv.getAttribute("data-index"));
                document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-add-to-deck", { "detail": { index : index, target: sTargetDeck } }));
            }

            return false;
        };

        elem.querySelector(".deck_rem").onclick = function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();

            const pSpan = DomUtils.closestByType(this, "span")
            const pDiv = pSpan === null ? null : DomUtils.closestByType(pSpan, "div");
            if (pDiv !== null)
            {
                const sTargetDeck = pSpan.getAttribute("data-is-deck");
                const index = parseInt(pDiv.getAttribute("data-index"));
                document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-remove-from-deck", { "detail": { index : index, target: sTargetDeck } }));
                DeckList.reduceCurrentDeckCount(pDiv);
            }

            return false;
        };

        elem.onmouseover = function()
        {
            const index = this.getAttribute("data-index");
            if (typeof index === "undefined")
                return;
            
            const pCard = ViewCards.config.jsonData[index];
            if (pCard === null || typeof pCard === "undefined")
                return;
           
            const _elem = document.getElementById("deck_card_view");
            _elem.innerHTML = '<img decoding="async" src="' + getImageUrlByCode(pCard.code) + '">';
            _elem.classList.remove("hidden");
        };
        
        elem.onmouseout = function()
        {
            const _elem = document.getElementById("deck_card_view");
            _elem.classList.add("hidden");
            DomUtils.empty(_elem);
        };
    },
    
    increaseCurrentDeckCount : function(pDiv)
    {
        const pCount = pDiv.querySelector(".count");
        if (pCount !== null)
            pCount.innerText = (parseInt(pCount.innerText) + 1);
    },
    
    calculateAndUpdateDeckCounters : function()
    {
        const pContainer = document.getElementById("deck_container");
        let _size = 0;
        
        ArrayList(pContainer).find("div.deck_part").each(function(pThis)
        {
            const _count = DeckList.calculateEntries(pThis, "count_deck_entry");
            pThis.querySelector("span.count_type").innerText = _count;
            _size += _count;
        });

        // no pool
        // no sideboard
        _size -= DeckList.calculateEntryId("count_pool");
        _size -= DeckList.calculateEntryId("count_sideboard");
        document.getElementById("deck_count").innerText = _size;
        
        ArrayList(pContainer).find("div.deck_part_col").each((pThis)  => {

            const elem = pThis.querySelector("span.count_type_col");
            if (elem !== null)
                elem.innerText = DeckList.calculateEntries(pThis, "count_type");
        });

        document.getElementById("summary_resources").innerText = DeckList.getInnerHtml(document.getElementById("count_deck_r"));
        document.getElementById("summary_hazards").innerText =  DeckList.getInnerHtml(document.getElementById("count_deck_h"));
        document.getElementById("summary_sideboard").innerText = DeckList.getInnerHtml(document.getElementById("count_sideboard"));
        document.getElementById("summary_characters").innerText = document.getElementById("count_deck_chars").innerText;
    },

    getInnerHtml(elem)
    {
        return elem === null ? "0" : elem.innerText;
    },

    calculateEntryId : function(sId)
    {
        try
        {
            return parseInt(document.getElementById(sId).innerText);
        }
        catch (e)
        {
        }
        
        return 0;
    },
                                              
    calculateEntries : function(pContainer, sClass)
    {
        let _count = 0;
        ArrayList(pContainer).find("span." + sClass).each((_elem) => _count += parseInt(_elem.innerText));
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

    reduceCurrentDeckCount : function(pDiv)
    {
        const pCount = pDiv.querySelector(".count");
        const nCount = parseInt(pCount.innerText) - 1;
        pCount.innerText = nCount;

        if (nCount === 0)
        {
            const elem = document.getElementById("deck_card_view");
            elem.classList.add("hidden");
            DomUtils.empty(elem);
            this.removeEntry(pDiv);
        }
    }

};

(function()
{
    DeckList.init();
})();

document.body.addEventListener("meccg-deckbuilder-preparedecklist", DeckList.prepareDeckList, false);
document.body.addEventListener("meccg-deckbuilder-add-to-decklist", DeckList.onAddToDeckList, false);
document.body.addEventListener("meccg-deckbuilder-update-summary", DeckList.calculateAndUpdateDeckCounters, false);
