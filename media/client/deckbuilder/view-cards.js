

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
        
        jQuery("#deck_resources").append(html);
        
        jQuery("#deck_chars").append(htmlCharsAvatar);


        html = "";
        for (var _val of ViewCards.config.vsTypesHazard)
        {
            index++;
            if (_val === "Site" || _val === "Region")
                continue;
            
            ViewCards.config.vsDeckContainerIds.push({ "id" : "hazard_" + index, "type" : _val, "resource":false});
            html += '<div id="hazard_'+ index + '" class="d_container deck_part hidden"><h4>'+ _val + ' (<span class="count_type">0</span>)</h4><div class="result mt5"></div></div>';
        }

        jQuery("#deck_hazards").append(html);
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
        
        var categoryContainer = jQuery("#" + sTypeContainerId);
        if (categoryContainer.length === 0)
        {
            console.log("Cannot find categoryContainer for " + "#" + sTypeContainerId);
            return false;
        }
        
        var pEntry = categoryContainer.find("#" + targetType + "_" + index);
        if (pEntry.length === 0)
        {
            categoryContainer.removeClass("hidden");
            categoryContainer.find(".result").append(this.getCardDeckToAddHtml(pCard, index, targetType));
            
            this.updateDeckLink(targetType + "_" + index);
        }
        else
        {
            var pCount = pEntry.find(".count");
            pCount.html(parseInt(pCount.html()) + 1);
        }
        
        var pCount = categoryContainer.find("h4 span");
        pCount.html(parseInt(pCount.html()) + 1);
        
        pCount = jQuery("#" + _containerId + " h3 span");
        pCount.html(parseInt(pCount.html()) + 1);

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
        
        var categoryContainer = jQuery("#" + sTypeContainerId);
        if (categoryContainer.length === 0)
        {
            console.log("Cannot find categoryContainer for " + "#" + sTypeContainerId);
            return false;
        }
        
        var pEntry = categoryContainer.find("#" + targetType + "_" + index);
        if (pEntry.length === 0)
        {
            categoryContainer.removeClass("hidden");
            categoryContainer.find(".result").append(this.getCardDeckToAddHtml(pCard, index, targetType));
            this.updateDeckLink(targetType + "_" + index);
        }
        else
        {
            var pCount = pEntry.find(".count");
            pCount.html(parseInt(pCount.html()) + 1);
        }
        
        var pCount = categoryContainer.find("h4 span");
        pCount.html(parseInt(pCount.html()) + 1);
        
        pCount = jQuery("#" + _containerId + " h3 span");
        pCount.html(parseInt(pCount.html()) + 1);

        return true;
    },
    
    addCardGeneric : function(pCard, index, pref)
    {
        index = pCard.index;
        var pEntry = jQuery("#" + pref + "_" + index);

        /**
         * this is the first card of its title in the container list
         */
        if (pEntry.length === 0)
        {
            /**
             * append this entry to its container
             */
            var elem = jQuery("#" + pref);
            var sHtml = elem.html().trim();

            if (sHtml === "-" || sHtml === "")
                elem.html(this.getCardDeckToAddHtml(pCard, index, pref));
            else
                elem.append(this.getCardDeckToAddHtml(pCard, index, pref));

            this.updateDeckLink(pref + "_" + index);
        }
        else /* already an entry available, so simply increase the counter */
        {
            var pCount = pEntry.find(".count");
            pCount.html(parseInt(pCount.html()) + 1);
        }


        this.updateCount("count_" + pref);
        return true;
    },
    
    getCardDeckToAddHtml : function(pCard, index, pref)
    {
        var sHtml = document.getElementById("deckentry-tpl").innerHTML;
        sHtml = sHtml.replace("{title}", pCard.code);
        sHtml = sHtml.replace("{code}", pCard.code);
        sHtml = sHtml.replace("{index}", index);
        sHtml = sHtml.replace("IDID_id", pref + "_" + index);
        sHtml = sHtml.replace("{data-is-deck}", pref);
        
        return sHtml;
    },
    
    /**
     * Update the counter value in a given SPAN by its id
     * @param {String} id 
     */
    updateCount : function(id)
    {
        var elem = document.getElementById(id);
        if (elem !== null)
        {
            var nCount = parseInt(elem.innerHTML) + 1;
            elem.innerHTML = "" + nCount;
        }
    },

    updateDeckLink : function(id)
    {
        var elem = jQuery("#" + id);
        if (elem.length === 0)
        {
            console.log("Cannot find #" + id);
            return;
        }

        elem.find(".deck_add").on("click", function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();  

            var pSpan = jQuery(this).closest("span");
            var sTargetDeck = pSpan.attr("data-is-deck");
            var pDiv = pSpan.closest("div");

            var index = parseInt(pDiv.attr("data-index"));
            var pCard = ViewCards.config.jsonData[index];

            if (!DeckbuilderApi.add(sTargetDeck, pCard))
            {
                Notify.error("Cannot add " + pCard.code);
                return false;
            }

            SearchResult.updateCardCount(index, -1);
            DeckList.increaseCurrentDeckCount(pDiv, index);
            return false;
        });

        elem.find(".deck_rem").on("click", function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();

            var pSpan = jQuery(this).closest("span");
            var sTargetDeck = pSpan.attr("data-is-deck");
            var pDiv = pSpan.closest("div");
            var index = parseInt(pDiv.attr("data-index"));
            var pCard = ViewCards.config.jsonData[index];

            if (!DeckbuilderApi.remove(sTargetDeck, pCard.code))
            {
                Notify.error("Cannot remove " + pCard.code + " from " + sTargetDeck);
                return false;
            }

            DeckList.reduceCurrentDeckCount(pDiv, index);

            let _count = ViewCards.config.jsonData[index].count;
            let jBubble = jQuery("#count_" + index).parent().find(".count_bubble");
            jBubble.html(_count);

            if (_count !== 0 && jBubble.hasClass("hidden"))
                jBubble.removeClass("hidden");

            return false;
        });

        elem.hover(function()
        {
            var index = jQuery(this).attr("data-index");
            if (typeof index === "undefined")
            {
                console.log("no index");
                return;
            }
            
            var pCard = ViewCards.config.jsonData[index];
            if (pCard === null || typeof pCard === "undefined")
            {
                console.log("no card at " + index);
                return;
            }
           
            var elem = jQuery("#deck_card_view");
            elem.html('<img decoding="async" src="' + DeckList.getImageUrlByCode(pCard.code) + '">');
            elem.removeClass("hidden");
        }, 
        function()
        {
            var elem = jQuery("#deck_card_view");
            elem.addClass("hidden");
            elem.empty();
        });
    },
    
    increaseCurrentDeckCount : function(pDiv, index)
    {
        var pCount = pDiv.find(".count");
        var nCount = parseInt(pCount.html()) + 1;
        pCount.html(nCount);

        SearchResult.updateCardResultListCount(index);
        this.calculateAndUpdateDeckCounters();
    },
    
    calculateAndUpdateDeckCounters : function()
    {
        var pContainer = jQuery("#deck_container");
        var _size = 0;
        
        pContainer.find("div.deck_part").each(function()
        {
            var pThis = jQuery(this);
            var _count = DeckList.calculateEntries(pThis, "count_deck_entry");
            pThis.find("span.count_type").html(_count);
            _size += _count;
        });

        // no pool
        // no sideboard
        _size -= DeckList.calculateEntryId("count_pool");
        _size -= DeckList.calculateEntryId("count_sideboard");
        pContainer.find("#deck_count").html(_size);
        
        pContainer.find("div.deck_part_col").each(function()
        {
            var _count;
            var pThis = jQuery(this);
            _count = DeckList.calculateEntries(pThis, "count_type");
            pThis.find("span.count_type_col").html(_count);
        });

        jQuery("#summary_resources").html(jQuery("#count_deck_r").html());
        jQuery("#summary_hazards").html(jQuery("#count_deck_h").html());
        jQuery("#summary_sideboard").html(jQuery("#count_sideboard").html());
    },

    calculateEntryId : function(sId)
    {
        try
        {
            return parseInt(jQuery("#" + sId).html());
        }
        catch (e)
        {
        }
        
        return 0;
    },
                                              
    calculateEntries : function(pContainer, sClass)
    {
        var _count = 0;
        pContainer.find("span." + sClass).each(function()
        {
            _count += parseInt(jQuery(this).html());
        });
        return _count;
    },
    
    removeEntry : function(pDiv)
    {
        var pPar = pDiv.parent();
        pDiv.remove();
        
        var size = pPar.find("div").length;
        if (size === 0)
        {
            var pDeckPart = pPar.parent();
            if (pDeckPart.hasClass("d_container"))
                pDeckPart.addClass("hidden");
        }
    },

    reduceCurrentDeckCount : function(pDiv, index)
    {
        SearchResult.updateCardCount(index, 1); 
        
        var pCount = pDiv.find(".count");
        var nCount = parseInt(pCount.html()) - 1;
        pCount.html(nCount);

        if (nCount === 0)
        {
            var elem = jQuery("#deck_card_view");
            elem.addClass("hidden");
            elem.empty();
            this.removeEntry(pDiv);
        }

        SearchResult.updateCardResultListCount(index);
        this.calculateAndUpdateDeckCounters();

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
        var elem = jQuery("#count_" + index);
        if (elem.length !== 0)
            elem.attr("data-count", ViewCards.config.jsonData[index].count);
    },

    /**
     * updates the ADD buttons on the result ROW
     */
    onUpdateLinkAddTo : function()
    {
        jQuery("#result a.link_add").click(function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();

            var pLink = jQuery(this);
            var pDiv = pLink.closest("div");
            var sTargetDeck = pLink.attr("data-target");
            var nIndex = parseInt(pDiv.attr("data-index"));
            var sCount = pDiv.attr("data-count");

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
                pDiv.attr("data-count", _cnt);
                
                let jBubble = pDiv.parent().find(".count_bubble");
                jBubble.html(_cnt);
                if (_cnt === 0 && !jBubble.hasClass("hidden"))
                    jBubble.addClass("hidden");
                
                DeckList.calculateAndUpdateDeckCounters();
            }
            
            return false;
        });

        jQuery(".linklist a:first").click();
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
        jQuery(".linklist a").click(function(evt)
        {
            evt.preventDefault();

            var sId = jQuery(this).attr("data-id");
            if (sId === "")
                return false;

            jQuery("#result div.category").each(function()
            {
                jQuery(this).hide();
            });
            
            /* hide all */
            jQuery("#result .preview").each(function()
            {
                let jThis = jQuery(this);
                jThis.attr("src", jThis.attr("data-hide"));
            });
            
            jQuery("#result div.category").each(function()
            {
                var pTable = jQuery(this);
                if (sId !== pTable.attr("data-id"))
                    return;
                
                pTable.find(".preview").each(function()
                {
                    let jThis = jQuery(this);
                    jThis.attr("src", jThis.attr("data-src"));
                });
                    
                pTable.show();
            });
            
            jQuery(".linklist li.current").removeClass("current");
            jQuery(this).parent().addClass("current");
            
            return false;
        });

        jQuery(".linklist a:first").click();

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
            document.getElementById(_id).onkeydown=function()
            {
                if(window.event.keyCode === '13')
                    ViewCards.search();
            };
        }

        for (var _id of vsOnChange)
        {
            document.getElementById(_id).onchange = function()
            {
                ViewCards.search();
            };
        }
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
        jQuery.get("/data/list/cards", { }, function(jsonCards)
        {
            let jMeta = Main.createCardsMeta(jsonCards);
            ViewCards.initCards(jsonCards, [ ]);
            ViewCards.initIndices(jMeta);
            DeckbuilderApi.init();
        });
    },
    
    loadImageList : function()
    {
        jQuery.get("/data/list/images", { }, function(imageList)
        {
            DeckList._cardList = new CardList(imageList.images, [], true, false, jQuery("body").attr("data-image-cdn"));
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

jQuery(document).ready(Main.init);

