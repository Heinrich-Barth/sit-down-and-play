
function createAndInit_TaskBarCards(_CardList, _MeccgApi, _CardPreview)
{
    var CardList = _CardList;
    var CardPreview = _CardPreview;
    var MeccgApi = _MeccgApi;
        
    function getViewContainer()
    {
        let elem = document.getElementById("view_card_list_container");
        return jQuery(elem);
    }
    
    function createCardContainer(code, uuid, type, bShowCardPreview)
    {
        let _img = CardList.getImage(code);
        let sCode = CardList.getSafeCode(code);

        if (!bShowCardPreview)
        {
            _img = "/media/assets/images/cards/backside.jpg";
            sCode = "";
        }

        return `<div class="card-hand pos-rel" id="offer_${uuid}" data-uuid="${uuid}" draggable="false" data-code="${sCode}" data-type="${type}">
            <img src="${_img}" data-id="${uuid}" class="card-icon" data-image-backside="/media/assets/images/cards/backside.jpg">
            <div class="view-card-list-actions icons">
                <a href="#" class="icon hand" data-move-to="hand" title="Move to hand">&nbsp;</a>
                <a href="#" class="icon playdeck" data-move-to="playdeck" title="Move to playdeck">&nbsp;</a>
                <a href="#" class="icon discardpile" data-move-to="discardpile" title="Move to discard pile">&nbsp;</a>
                <a href="#" class="icon sideboard" data-move-to="sideboard" title="Move to sideboard">&nbsp;</a>
                <a href="#" class="icon onoffer" data-move-to="offer" title="Reveal to opponent">&nbsp;</a>
            </div>
        </div>`;
    }
    
    
    function createListHtml(vsList, bRevealPreview)
    {
        if (typeof bRevealPreview === "undefined")
            bRevealPreview = true;

        var sHtml = "";
        for (var i = 0; i < vsList.length; i++)
            sHtml += createCardContainer(vsList[i].code, vsList[i].uuid, vsList[i].type, bRevealPreview);

        return sHtml;
    }

    function insertHtmlIntoContainer(jContainer,sHtml, type, sTitle)
    {
        var container = jContainer.find(".view-card-list-container");
        var containerTitle = jContainer.find(".container-title-bar-title");
        var elem = container.find(".container-data");

        if (type !== "")
            container.addClass("view-"+type);
            
        elem.html(sHtml);

        if (sTitle !== "")
            containerTitle.html(sTitle);

        jContainer.find(".container-title-bar-reveal a").attr("data-type", type);                
        return elem;
    }
    
    function insertHtml(sHtml, type, sTitle)
    {
        return insertHtmlIntoContainer(getViewContainer(), sHtml, type, sTitle);
    }

    var TaskBarCards = { };

    TaskBarCards.moveTo = function(_uuid, _target)
    {
        const params = {
            uuid : _uuid,
            target : _target,
            drawTop : _target === "hand"
        };

        MeccgApi.send("/game/card/move", params);
        return true;
    };
    
    TaskBarCards.onShowList = function(jData, sTitle, bICanSeeIt)
    {
        TaskBarCards.hideList();

        if (typeof bICanSeeIt === "undefined")
            bICanSeeIt = false;

        var type = jData.type;
        var vsList = jData.list;

        if (vsList === null || typeof vsList === "undefined" || vsList.length === 0)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "no cards to display in " + type }));
            return null;
        }

        var sHtml = createListHtml(vsList, bICanSeeIt);
        if (sHtml === "")
            return null;

        var elem = insertHtml(sHtml, type, sTitle + type.toUpperCase());

        /** I myself should not see my own offering cards so only the opponent knows it */
        if (bICanSeeIt)
        {
            elem.find(".card-hand").hover(function()
            {
                TaskBarCards.onShowOnHover(jQuery(this), true);
            }, 
            function()
            {
                TaskBarCards.onShowOnHover(null, false);
            });
        }
        return elem;
    };
    
    TaskBarCards.flipCards = function(jContainer)
    {
        jContainer.find("img.card-icon").each(function()
        {
            let jImage = jQuery(this);
            if (jImage.attr("data-image-backside").indexOf("backside.jpg") !== -1)
            {
                let sSrc = jImage.attr("src");
                jImage.attr("src", jImage.attr("data-image-backside"));
                jImage.attr("data-image-backside", sSrc);
            }
        }); 
    };
    
    TaskBarCards.onShowOnOfferReveal = function(sUuid)
    {
        let jImage = getViewContainer().find("div.view-card-list-container").find(".container-data").find('div[data-uuid="' + sUuid + '"]').find("img");
        if (jImage.attr("data-image-backside").indexOf("backside.jpg") === -1)
        {
            let sSrc = jImage.attr("src");
            jImage.attr("src", jImage.attr("data-image-backside"));
            jImage.attr("data-image-backside", sSrc);
        }
    };
    
    TaskBarCards.onShowOnOfferRemove = function(sUuid)
    {
        let cardDiv = getViewContainer().find(".container-data").find('div[data-uuid="' + sUuid + '"]');
        console.log(cardDiv);
        cardDiv.addClass("hiddenVisibility");
    };
    
    TaskBarCards.onShowOnOffer = function(bIsMe, jData)
    {
        let bICanSee = !Preferences.offerBlindly();
        let elem = TaskBarCards.onShowList(jData, bIsMe ? "Offer to show cards from " : "Opponents card from ", bICanSee);
        if (elem === null)
            return false;

        if (bIsMe)
        {
            elem.find(".card-hand a").click(function(evt) 
            {
                evt.preventDefault();
                evt.stopPropagation();
                TaskBarCards.onClickCardIcon(true, jQuery(this));
                return false;
            });
        }
        else
            TaskBarCards.flipCards(elem);
        
        let jContainer = getViewContainer();

        if (bIsMe)
            jContainer.find(".view-card-list-container").addClass("offer");
        else
            jContainer.find(".view-card-list-container").addClass("offered");
        
        jContainer.removeClass("hidden");
        return true;
    };
    
    TaskBarCards.onShow = function(bIsMe, jData)
    {       
        let bICanSee = !Preferences.offerBlindly();
        let elem = TaskBarCards.onShowList(jData, "Looking at your ", bICanSee);
        if (elem === null)
            return false;

        elem.find(".card-hand a").click(function(evt) 
        {
            evt.preventDefault();
            evt.stopPropagation();
            TaskBarCards.onClickCardIcon(false, jQuery(this));
            return false;
        });
        
        getViewContainer().removeClass("hidden");
        return true;
    };
    
    TaskBarCards.onShowVictorySheet = function(vsList)
    {       
        if (vsList === null || typeof vsList === "undefined" || vsList.length === 0)
            return false;

        let type = "victory";
        var sHtml = createListHtml(vsList, true);
        if (sHtml === "")
            return false;

        var elem = insertHtmlIntoContainer(jQuery("#view-score-sheet-card-list"), sHtml, type, "");
        elem.find(".card-hand").hover(function()
        {
            TaskBarCards.onShowOnHover(jQuery(this), true);
        }, 
        function()
        {
            TaskBarCards.onShowOnHover(null, false);
        });
        
        return true;
    };

    TaskBarCards.onShowOnHover = function(jThis, bHover)
    {
        if (bHover)
            CardPreview.show(jThis.find("img.card-icon").attr("src"), false, true);
        else
            CardPreview.hide(false, true);
    };
    
    TaskBarCards.onClickCardIcon = function(isOffer, jLink)
    {
        const target = jLink.attr("data-move-to");
        const cardDiv = jLink.parent().parent();
        let sUuid = cardDiv.attr("data-uuid");
        
        if (target === "offer") // offer the card
        {
            MeccgApi.send("/game/view-cards/offer-reveal", { uuid : sUuid });
            jLink.parent().parent().find("img.card-icon").addClass("on-offer-orevealed");
            return;
        }
        
        cardDiv.addClass("hiddenVisibility");
        TaskBarCards.moveTo(sUuid, target);
        
        if (isOffer)
        {
            MeccgApi.send("/game/view-cards/offer-remove", { uuid : sUuid });
      
            let jHand = jQuery("#playercard_hand_container");
            let jRes = jHand.find("#card_icon_nr_" + sUuid);
            if (jRes.length === 1)
                unbindAndRemove(jRes);
        }
    },

    TaskBarCards.show = function(evt, type)
    {
        evt.preventDefault();
        evt.stopPropagation();

        MeccgApi.send("/game/view-cards/list", type);
    };

    TaskBarCards.hideOffer = function()
    {
        var jViewContainer = getViewContainer();
        if (!jViewContainer.hasClass("hidden"))
            TaskBarCards.hideListContainer(jViewContainer, jViewContainer.find(".view-card-list-container"));
    }

    TaskBarCards.hideListContainer = function(jViewContainer, jContainer)
    {
        if (!jViewContainer.hasClass("hidden"))
            jViewContainer.addClass("hidden");

        jContainer.removeClass("view-sideboard");
        jContainer.removeClass("view-discard");
        jContainer.removeClass("view-playdeck");
        jContainer.removeClass("view-victory");

        jContainer.find(".container-data").empty();

        if (jContainer.hasClass("offered"))
            jContainer.removeClass("offered");

        if (jContainer.hasClass("offer"))
            jContainer.removeClass("offer");
    };

            
    TaskBarCards.hideList = function()
    {
        var jViewContainer = getViewContainer();
        if (jViewContainer.hasClass("hidden"))
            return;

        var jContainer = jViewContainer.find(".view-card-list-container");

        let isOfferred = jContainer.hasClass("offered");
        let isOffer = jContainer.hasClass("offer");

        TaskBarCards.hideListContainer(jViewContainer, jContainer);

        if (isOfferred)
            MeccgApi.send("/game/view-cards/list/close", { offered : true });
        else if (isOffer)
            MeccgApi.send("/game/view-cards/list/close", { offered : false });
    };
    
    TaskBarCards.onClickContainerShuffle = function()
    {
        TaskBarCards.hideList();
        TaskBarCards.shufflePlaydeck();
    };
    
    TaskBarCards.onRevealToOpponent = function(type)
    {
        switch (type)
        {
            case "sideboard":
            case "discard":
            case "playdeck":
            case "hand":
                MeccgApi.send("/game/view-cards/reveal-pile", type);
                break;

            default:
                break;
        }        
    };
    
    TaskBarCards.onClickIconHand = function(jElem)
    {
        if (jElem.hasClass("act"))
        {
            jQuery("#playercard_hand").addClass("hidden");
            jElem.removeClass("act");
        }
        else
        {
            jQuery("#playercard_hand").removeClass("hidden");
            jElem.addClass("act");
        }
    };
    
    {
        var jView = getViewContainer();
        jView.click(function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();

            TaskBarCards.hideList();
            return false;
        });

        jView.find(".container-title-bar-shuffle").click(function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();
            TaskBarCards.onClickContainerShuffle();
            return false;
        });
        
        jView.find(".container-title-bar-reveal a").click(function(evt)
        {
            TaskBarCards.hideList();
            TaskBarCards.onRevealToOpponent(jQuery(this).attr("data-type"));
            
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        });

    }
    
    jQuery("#icon_hand").click(function(evt)
    {
        evt.preventDefault();
        evt.stopPropagation();

        TaskBarCards.onClickIconHand(jQuery(this));
    });
    
    jQuery("#icon_hand").contextmenu(function(evt)
    {
        evt.preventDefault();
        evt.stopPropagation();

        TaskBarCards.onRevealToOpponent("hand");
    });


    jQuery(".card-dice").click(function() 
    {
        MeccgApi.send("/game/roll-dices", "");
        return false;
    });


    jQuery(".card-bar .sideboard").click(function(evt)
    {
        TaskBarCards.show(evt, "sideboard");
        return false;
    });

    jQuery(".card-bar .victory").click(function(evt)
    {
        TaskBarCards.show(evt, "victory");
        return false;
    });
    
    jQuery(".card-bar .victory").contextmenu(function(e) 
    {
        MeccgApi.send("/game/score/show", "");

        e.preventDefault();
        return false;
    });
    
    jQuery(".card-bar .discardpile").click(function(evt)
    {
        TaskBarCards.show(evt, "discard");
        return false;
    });
    
    jQuery(".card-bar .playdeck").click(function(evt)
    {
        TaskBarCards.show(evt, "playdeck");
        return false;
    });
    
    jQuery(".card-bar .discardpile").contextmenu(function(e) 
    {
        TaskBarCards.shuffleDiscardpile();

        e.preventDefault();
        return false;
    });
    
    jQuery(".card-bar .playdeck").contextmenu(function(e) 
    {
        TaskBarCards.shufflePlaydeck();

        e.preventDefault();
        return false;
    });
       
    /**
     * Shuffle playdeck
     * @return {void}
     */
    TaskBarCards.shufflePlaydeck = function()
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "playdeck" });
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Playdeck shuffled." }));
    };

    TaskBarCards.shuffleDiscardpile = function()
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "discardpile" });
    };
    
    
    TaskBarCards.onTurnClick = function(jThis)
    {
        if (!jThis.hasClass("act"))
        {
            var sPhase = jThis.attr("data-phase");
            MeccgApi.send("/game/phase/set", sPhase);
        }
        
        return false;
    };
    
    jQuery(".taskbar .taskbar-turn").click(function(e)
    {
        e.preventDefault();
        return TaskBarCards.onTurnClick(jQuery(this));
    });
    
    return {

        onShowVictorySheet : function(listCards)
        {            
            TaskBarCards.onShowVictorySheet(listCards);
        },

        onShow : function(bIsMe, jData)
        {
            TaskBarCards.onShow(bIsMe, jData);
        },

        onShowOnOffer : function(bIsMe, jData)
        {
            TaskBarCards.onShowOnOffer(bIsMe, jData);
        },

        onShowOnOfferReveal : function(uuid)
        {
            TaskBarCards.onShowOnOfferReveal(uuid)
        },
        onShowOnOfferRemove : function(uuid)
        {
            TaskBarCards.onShowOnOfferRemove(uuid)
        },

        hideOffer : function()
        {
            TaskBarCards.hideOffer();
        }

    };
}
            