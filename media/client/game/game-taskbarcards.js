
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

    function insertHtmlIntoContainer(jContainer, sHtml, type, sTitle)
    {
        var container = jContainer.find(".view-card-list-container");
        var containerTitle = jContainer.find(".container-title-bar-title");
        var elem = container.find(".container-data");

        if (type !== "")
            container.addClass("view-" + type);

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

    var TaskBarCards = {};

    TaskBarCards.moveTo = function (_uuid, _target) 
    {
        const params = {
            uuid: _uuid,
            target: _target,
            drawTop: _target === "hand"
        };

        MeccgApi.send("/game/card/move", params);
        return true;
    };

    TaskBarCards.onShowList = function (jData, sTitle, bICanSeeIt) 
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
            elem.find(".card-hand").hover(function () 
            {
                TaskBarCards.onShowOnHover(jQuery(this), true);
            },
            function () {
                TaskBarCards.onShowOnHover(null, false);
            });
        }
        return elem;
    };

    TaskBarCards.flipCards = function (jContainer) 
    {
        jContainer.find("img.card-icon").each(function () 
        {
            let jImage = jQuery(this);
            if (jImage.attr("data-image-backside").indexOf("backside.jpg") !== -1) {
                let sSrc = jImage.attr("src");
                jImage.attr("src", jImage.attr("data-image-backside"));
                jImage.attr("data-image-backside", sSrc);
            }
        });
    };

    TaskBarCards.onShowOnOfferReveal = function (sUuid) 
    {
        let jImage = getViewContainer().find("div.view-card-list-container").find(".container-data").find('div[data-uuid="' + sUuid + '"]').find("img");
        if (jImage.length > 0 && jImage.attr("data-image-backside").indexOf("backside.jpg") === -1) {
            let sSrc = jImage.attr("src");
            jImage.attr("src", jImage.attr("data-image-backside"));
            jImage.attr("data-image-backside", sSrc);
        }
    };

    TaskBarCards.onShowOnOfferRemove = function (sUuid) 
    {
        let cardDiv = getViewContainer().find(".container-data").find('div[data-uuid="' + sUuid + '"]');
        if (cardDiv.length > 0)
            cardDiv.addClass("hiddenVisibility");
    };

    TaskBarCards.onShowOnOffer = function (bIsMe, jData) 
    {
        let bICanSee = !Preferences.offerBlindly();
        let elem = TaskBarCards.onShowList(jData, bIsMe ? "Offer to show cards from " : "Opponents card from ", bICanSee);
        if (elem === null)
            return false;

        if (bIsMe) 
        {
            elem.find(".card-hand a").each(function () 
            {
                this.onclick = (e) => {
                    TaskBarCards.onClickCardIcon(true, jQuery(e.target));
                    e.stopPropagation();
                    return false;
                };
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

    TaskBarCards.onShow = function (jData) 
    {
        let bICanSee = !Preferences.offerBlindly();
        let elem = TaskBarCards.onShowList(jData, "Looking at your ", bICanSee);
        if (elem === null)
            return false;

        elem.find(".card-hand a").each(function () 
        {
            this.onclick = (e) => {
                TaskBarCards.onClickCardIcon(false, jQuery(e.target));
                e.stopPropagation();
                return false;
            }
        });

        getViewContainer().removeClass("hidden");
        return true;
    };

    TaskBarCards.onShowVictorySheet = function (vsList) 
    {
        if (vsList === null || typeof vsList === "undefined" || vsList.length === 0)
            return false;

        let type = "victory";
        var sHtml = createListHtml(vsList, true);
        if (sHtml === "")
            return false;

        var elem = insertHtmlIntoContainer(jQuery("#view-score-sheet-card-list"), sHtml, type, "");
        elem.find(".card-hand").hover(function () 
        {
            TaskBarCards.onShowOnHover(jQuery(this), true);
        },
        function () 
        {
            TaskBarCards.onShowOnHover(null, false);
        });

        return true;
    };

    TaskBarCards.onShowOnHover = function (jThis, bHover) 
    {
        if (bHover)
            CardPreview.show(jThis.find("img.card-icon").attr("src"), false, true);
        else
            CardPreview.hide(false, true);
    };

    TaskBarCards.onClickCardIcon = function (isOffer, jLink) 
    {
        const target = jLink.attr("data-move-to");
        const cardDiv = jLink.parent().parent();
        let sUuid = cardDiv.attr("data-uuid");

        if (target === "offer") // offer the card
        {
            MeccgApi.send("/game/view-cards/offer-reveal", { uuid: sUuid });
            jLink.parent().parent().find("img.card-icon").addClass("on-offer-orevealed");
            return;
        }

        cardDiv.addClass("hiddenVisibility");
        TaskBarCards.moveTo(sUuid, target);

        if (isOffer) 
        {
            MeccgApi.send("/game/view-cards/offer-remove", { uuid: sUuid });

            let jHand = jQuery("#playercard_hand_container");
            let jRes = jHand.find("#card_icon_nr_" + sUuid);
            if (jRes.length === 1)
                unbindAndRemove(jRes);
        }
    },

    TaskBarCards.show = function (type) 
    {
        MeccgApi.send("/game/view-cards/list", type);
    };

    TaskBarCards.hideOffer = function () 
    {
        var jViewContainer = getViewContainer();
        if (!jViewContainer.hasClass("hidden"))
            TaskBarCards.hideListContainer(jViewContainer, jViewContainer.find(".view-card-list-container"));
    }

    TaskBarCards.hideListContainer = function (jViewContainer, jContainer) 
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


    TaskBarCards.hideList = function () 
    {
        var jViewContainer = getViewContainer();
        if (jViewContainer.hasClass("hidden"))
            return false;

        var jContainer = jViewContainer.find(".view-card-list-container");

        let isOfferred = jContainer.hasClass("offered");
        let isOffer = jContainer.hasClass("offer");

        TaskBarCards.hideListContainer(jViewContainer, jContainer);

        if (isOfferred)
            MeccgApi.send("/game/view-cards/list/close", { offered: true });
        else if (isOffer)
            MeccgApi.send("/game/view-cards/list/close", { offered: false });

        return false;
    };

    TaskBarCards.onClickContainerShuffle = function () 
    {
        TaskBarCards.hideList();
        TaskBarCards.shufflePlaydeck();
        return false;
    };

    TaskBarCards.onRevealToOpponent = function (type) 
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

    TaskBarCards.onClickIconHand = function () 
    {
        let jElem = jQuery("#icon_hand")
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
        jView[0].onclick = TaskBarCards.hideList;

        jView.find(".container-title-bar-shuffle")[0].onclick = TaskBarCards.onClickContainerShuffle;

        jView.find(".container-title-bar-reveal a").each(function () 
        {
            this.onclick = (e) => {
                const _data = jQuery(e.target).attr("data-type")
                TaskBarCards.hideList();
                TaskBarCards.onRevealToOpponent(_data);
                e.stopPropagation();
                return false;
            }
            
        });

    }

    jQuery("#icon_hand")[0].onclick = (e) => {
        TaskBarCards.onClickIconHand();
        e.stopPropagation();
        return false;
    }

    jQuery("#icon_hand")[0].oncontextmenu = () => {
    
        TaskBarCards.onRevealToOpponent("hand");
        return false;
    };


    jQuery(".card-dice")[0].onclick = (e) => {
        MeccgApi.send("/game/roll-dices", "");
        e.stopPropagation();
        return false;
    };


    jQuery(".card-bar .sideboard")[0].onclick = (e) => 
    {
        TaskBarCards.show("sideboard");
        e.stopPropagation();
        return false;
    };

    jQuery(".card-bar .victory")[0].onclick = (e) => 
    {
        TaskBarCards.show("victory");
        e.stopPropagation();
        return false;
    };

    jQuery(".card-bar .victory")[0].oncontextmenu = (e) => 
    {
        MeccgApi.send("/game/score/show", "");
        e.stopPropagation();
        return false;
    };

    jQuery(".card-bar .discardpile")[0].onclick = (e) => 
    {
        TaskBarCards.show("discard");
        e.stopPropagation();
        return false;
    };

    jQuery(".card-bar .playdeck")[0].onclick = (e) =>  
    {
        TaskBarCards.show("playdeck");
        e.stopPropagation();
        return false;
    };

    jQuery(".card-bar .discardpile")[0].oncontextmenu = (e) => 
    {
        TaskBarCards.shuffleDiscardpile();
        e.stopPropagation();
        return false;
    };

    jQuery(".card-bar .playdeck")[0].oncontextmenu = (e) => 
    {
        TaskBarCards.shufflePlaydeck();
        e.stopPropagation();
        return false;
    };

    /**
     * Shuffle playdeck
     * @return {void}
     */
    TaskBarCards.shufflePlaydeck = function () 
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "playdeck" });
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Playdeck shuffled." }));
    };

    TaskBarCards.shuffleDiscardpile = function () 
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "discardpile" });
    };


    TaskBarCards.onTurnClick = function (jThis) 
    {
        if (!jThis.hasClass("act")) {
            var sPhase = jThis.attr("data-phase");
            MeccgApi.send("/game/phase/set", sPhase);
        }

        return false;
    };

    jQuery(".taskbar .taskbar-turn").each(function()
    {
        this.onclick = (e) => 
        {
            e.stopPropagation();
            return TaskBarCards.onTurnClick(jQuery(e.target));
        };
    });

    return {

        onShowVictorySheet: function (listCards) {
            TaskBarCards.onShowVictorySheet(listCards);
        },

        onShow: function (bIsMe, jData) {
            TaskBarCards.onShow(jData);
        },

        onShowOnOffer: function (bIsMe, jData) {
            TaskBarCards.onShowOnOffer(bIsMe, jData);
        },

        onShowOnOfferReveal: function (uuid) {
            TaskBarCards.onShowOnOfferReveal(uuid)
        },
        onShowOnOfferRemove: function (uuid) {
            TaskBarCards.onShowOnOfferRemove(uuid)
        },

        hideOffer: function () {
            TaskBarCards.hideOffer();
        }

    };
}
