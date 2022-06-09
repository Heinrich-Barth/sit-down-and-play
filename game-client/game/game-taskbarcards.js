
class ViewCardListContainer {

    static CONTAINER_ID = "view_card_list_container";

    static CardList = null;

    static init()
    {
        let elem = document.getElementById(ViewCardListContainer.CONTAINER_ID);
        if (elem !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("id", "view_card_list_container");
        div.setAttribute("class", "hidden");
        div.innerHTML = `
                <div data-class="view-card-list-container blue-box" class="view-card-list-container blue-box">
                    <div class="container-title-bar smallCaps">
                        <div class="container-title-bar-title fl"></div>
                        <div class="container-title-bar-divider hideOnOffer fl">&nbsp;&dash;&nbsp;</div>
                        <div class="container-title-bar-reveal hideOnOffer fl"><a href="#" title="show to your opponent" data-type="">reveal to opp.</a></div>
                        <div class="container-title-bar-shuffle hideOnOffer fr">Close &amp; Shuffle</div>
                        <div class="clear"></div>
                    </div>
                    <div class="container-data"></div>
                    <div class="clear"></div>
                </div>`;

        document.body.appendChild(div);
    }

    static GetViewContainer() 
    {
        return document.getElementById(ViewCardListContainer.CONTAINER_ID);
    }

    static ShowViewContainer() 
    {
        const container = document.getElementById(ViewCardListContainer.CONTAINER_ID);
        if (container === null)
            return;

        container.classList.remove("hidden");
        ViewCardListContainer.scrollToTop(container.querySelector(".container-data"));
    }

    static createCardContainer(code, uuid, type, bShowCardPreview) 
    {
        let _img = ViewCardListContainer.CardList.getImage(code);
        let sCode = ViewCardListContainer.CardList.getSafeCode(code);

        if (!bShowCardPreview) 
        {
            _img = "/data/backside";
            sCode = "";
        }

        return `<div class="card-hand pos-rel" id="offer_${uuid}" data-uuid="${uuid}" draggable="false" data-code="${sCode}" data-type="${type}">
            <img src="${_img}" data-id="${uuid}" class="card-icon" data-image-backside="/data/backside">
            <div class="view-card-list-actions icons">
                <a href="#" class="icon hand" data-move-to="hand" data-shuffle="false" title="Move to hand">&nbsp;</a>
                <a href="#" class="icon playdeck playdeck-shuffle" data-move-to="playdeck" data-shuffle="true" title="Shuffle into playdeck">&nbsp;</a>
                <a href="#" class="icon discardpile" data-move-to="discardpile" data-shuffle="false" title="Move to top of discard pile">&nbsp;</a>
                <a href="#" class="icon sideboard" data-move-to="sideboard" data-shuffle="false" title="Move to sideboard">&nbsp;</a>
                <a href="#" class="icon playdeck" data-move-to="playdeck" data-shuffle="false" title="Move to top of playdeck">&nbsp;</a>
                <a href="#" class="icon onoffer" data-move-to="offer" data-shuffle="false" title="Reveal to opponent">&nbsp;</a>
            </div>
        </div>`;
    }

    static insertHtmlIntoContainer(pContainer, sHtml, type, sTitle)
    {
        const container = pContainer.querySelector(".view-card-list-container");
        
        if (container.hasAttribute("data-class"))
            container.setAttribute("class", container.getAttribute("data-class"));

        if (type !== "")
            container.classList.add("view-" + type);

        if (sTitle !== undefined && sTitle !== "")
        {
            const pTitle = pContainer.querySelector(".container-title-bar-title");
            if (pTitle !== null)
                pTitle.innerHTML = sTitle;            
        }

        const link = pContainer.querySelector(".container-title-bar-reveal a");
        if (link !== null)
            link.setAttribute("data-type", type);

        const elem = container.querySelector(".container-data");
        if (elem !== null)
        {
            DomUtils.removeAllChildNodes(elem);
            elem.innerHTML = sHtml;
        }
        return elem;
    }

    static insertHtml(sHtml, type, sTitle) 
    {
        return ViewCardListContainer.insertHtmlIntoContainer(ViewCardListContainer.GetViewContainer(), sHtml, type, sTitle);
    }

    static createListHtml(vsList, bRevealPreview) 
    {
        if (typeof bRevealPreview === "undefined")
            bRevealPreview = true;

        let sHtml = "";
        for (let card of vsList)
            sHtml += ViewCardListContainer.createCardContainer(card.code, card.uuid, card.type, bRevealPreview);

        return sHtml;
    }

    static scrollToTop(elem)
    {
        if (elem !== null)
            elem.scrollTo(0,0);
    }
}


class DiceRoller 
{
    static getDiceValue()
    {
        let val = Math.trunc(Math.random() * 10) + 1;
        return val >= 1 && val <= 6 ? val : DiceRoller.getDiceValue();
    }
        
    static rollDice()
    {
        let val = 0;

        const times = 50 + Math.floor(Math.random() * 100);
        for (let i = 0; i < times; i++)
            val = DiceRoller.getDiceValue();

        return val;
    }
}

class TaskBarCards 
{
    static _cardPreview = null;

    constructor(_CardList, _CardPreview)
    {
        ViewCardListContainer.CardList = _CardList;
        TaskBarCards._cardPreview = _CardPreview;

        ViewCardListContainer.init();
        
        const view = ViewCardListContainer.GetViewContainer();
        view.onclick = TaskBarCards.HideList;
        view.querySelector(".container-title-bar-shuffle").onclick = TaskBarCards.OnClickContainerShuffle;

        for (let elem of view.querySelectorAll(".container-title-bar-reveal a"))
        {
            elem.onclick = (e) => {
                const _data = e.target.getAttribute("data-type") || "";
                TaskBarCards.HideList();
                TaskBarCards.OnRevealToOpponent(_data);
                e.stopPropagation();
                return false;
            }
        }

        document.getElementById("icon_hand").onclick = TaskBarCards.OnClickIconHand;
        document.getElementById("icon_hand").oncontextmenu = () => 
        {
            TaskBarCards.OnRevealToOpponent("hand");
            return false;
        };

        document.getElementById("shared_outofplay").onclick = (e) => 
        {
            TaskBarCards.Show("outofplay");
            e.stopPropagation();
            return false;
        };

        document.getElementById("shared_victories").onclick = (e) => 
        {
            TaskBarCards.Show("sharedvicotory");
            e.stopPropagation();
            return false;
        };
        
        document.querySelector(".card-dice").onclick = (e) => 
        {
            const val1 = DiceRoller.rollDice();
            const val2 = DiceRoller.rollDice();
            MeccgApi.send("/game/dices/roll", { r1: val1, r2: val2 });
            e.stopPropagation();
            return false;
        };

        document.querySelector(".card-bar .sideboard").onclick = (e) => 
        {
            TaskBarCards.Show("sideboard");
            e.stopPropagation();
            return false;
        };

        document.querySelector(".card-bar .victory").onclick = (e) => 
        {
            TaskBarCards.Show("victory");
            e.stopPropagation();
            return false;
        };

        document.querySelector(".card-hands .taskbar-score").onclick = (e) => 
        {
            MeccgApi.send("/game/score/show", "");
            e.stopPropagation();
            return false;
        };

        document.querySelector(".card-bar .discardpile").onclick = (e) => 
        {
            TaskBarCards.Show("discard");
            e.stopPropagation();
            return false;
        };

        document.querySelector(".card-bar .playdeck").onclick = (e) =>  
        {
            TaskBarCards.Show("playdeck");
            e.stopPropagation();
            return false;
        };

        document.querySelector(".card-bar .discardpile").oncontextmenu = TaskBarCards.ShuffleDiscardpile;
        document.querySelector(".card-bar .playdeck").oncontextmenu = TaskBarCards.ShufflePlaydeck;

        for (let elem of document.querySelectorAll(".taskbar .taskbar-turn"))
            elem.onclick = TaskBarCards.OnTurnClick;
    }    

    static OnClickContainerShuffle(e) 
    {
        TaskBarCards.HideList();
        TaskBarCards.ShufflePlaydeck();
        
        e.stopPropagation();
        return false;
    }

    static OnRevealToOpponent(type) 
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
    }

    static Show(type) 
    {
        MeccgApi.send("/game/view-cards/list", type);
    }

    static OnShowOnHover() 
    {
        TaskBarCards._cardPreview.show(this.querySelector("img.card-icon").getAttribute("src"), false, true);
    }

    static onShowVictorySheet(e) 
    {
        const vsList = e === undefined ? null : e.detail;
        if (vsList === null || typeof vsList === "undefined" || vsList.length === 0)
            return;

        const type = "victory";
        const sHtml = ViewCardListContainer.createListHtml(vsList, true);
        if (sHtml === "")
            return;

        const elem = ViewCardListContainer.insertHtmlIntoContainer(document.getElementById("view-score-sheet-card-list"), sHtml, type, "");
        const hov = elem.querySelectorAll(".card-hand");
        const len = hov.length;
        for (let i = 0; i < len; i++)
        {
            hov[i].onmouseover = TaskBarCards.OnShowOnHover;
            hov[i].onmouseout = TaskBarCards.OnMouseOut;
        }
    }

    static OnMouseOut()
    {
        TaskBarCards._cardPreview.hide(false, true);
    }

    onShow(jData) 
    {
        const bICanSee = !GamePreferences.offerBlindly();
        const elem = this._onShowList(jData, "Looking at your ", bICanSee);
        if (elem === null)
            return false;

        for (let _dom of elem.querySelectorAll(".card-hand a"))
            _dom.onclick = TaskBarCards.OnClickCardIconNonOffered;

        ViewCardListContainer.ShowViewContainer();
        return true;
    }

    onShowOnOffer(bIsMe, jData) 
    {
        let bICanSee = !GamePreferences.offerBlindly();
        let elem = this._onShowList(jData, bIsMe ? "Offer to show cards from " : "Opponents card from ", bICanSee);
        if (elem === null)
            return false;

        if (bIsMe) 
        {
            for (let _elem of elem.querySelectorAll(".card-hand a"))
                _elem.onclick = TaskBarCards.OnClickCardIconOffered;
        }
        else
            this.flipCards(elem);

        if (bIsMe)
            this._addOfferedInfo(".view-card-list-container", "offer");
        else
            this._addOfferedInfo(".view-card-list-container", "offered");

        return true;
    }

    _addOfferedInfo(sIdentifier, sAddCss)
    {
        const jContainer = ViewCardListContainer.GetViewContainer();
        for (let elem of jContainer.querySelectorAll(sIdentifier))
            elem.classList.add(sAddCss);

        jContainer.classList.remove("hidden");
    }

    onShowOnOfferReveal(sUuid) 
    {
        let jImage = ViewCardListContainer.GetViewContainer().querySelector(".container-data").querySelector('div[data-uuid="' + sUuid + '"] img');
        if (jImage === null)
            return;

        const backside = jImage.getAttribute("data-image-backside");
        if (backside !== null && backside.indexOf("/backside") === -1) 
        {
            let sSrc = jImage.getAttribute("src") || "";
            jImage.setAttribute("src", jImage.getAttribute("data-image-backside"));
            jImage.setAttribute("data-image-backside", sSrc);
        }
    }

    onShowOnOfferRemove(sUuid) 
    {
        let cardDiv = ViewCardListContainer.GetViewContainer().querySelector('div[data-uuid="' + sUuid + '"]');
        if (cardDiv !== null)
            cardDiv.classList.add("hiddenVisibility");
    }

    hideOffer() 
    {
        const jViewContainer = ViewCardListContainer.GetViewContainer();
        if (!jViewContainer.classList.contains("hidden"))
            TaskBarCards.HideListContainer(jViewContainer, jViewContainer.querySelector(".view-card-list-container"));
    }

    flipCards(jContainer) 
    {
        const res = jContainer.querySelectorAll("img.card-icon");
        const len = res === null ? 0 : res.length;
        for (let i = 0; i < len; i++)
        {
            let jthis = res[i];
            const backside = jthis.getAttribute("data-image-backside") || "";
            if (backside.indexOf("/backside") !== -1) 
            {
                let sSrc = jthis.getAttribute("src");
                jthis.setAttribute("src", jthis.getAttribute("data-image-backside"));
                jthis.setAttribute("data-image-backside", sSrc);
            }
        }
    }

    static HideList() 
    {
        const jViewContainer = ViewCardListContainer.GetViewContainer();
        if (jViewContainer === null || jViewContainer.classList.contains("hidden"))
            return;

        const jContainer = jViewContainer.querySelector(".view-card-list-container");

        let isOfferred = jContainer.classList.contains("offered");
        let isOffer = jContainer.classList.contains("offer");

        TaskBarCards.HideListContainer(jViewContainer, jContainer);

        if (isOfferred)
            MeccgApi.send("/game/view-cards/list/close", { offered: true });
        else if (isOffer)
            MeccgApi.send("/game/view-cards/list/close", { offered: false });
    }


    _onShowList(jData, sTitle, bICanSeeIt) 
    {
        TaskBarCards.HideList();

        if (typeof bICanSeeIt === "undefined")
            bICanSeeIt = false;

        const type = jData.type;
        const vsList = jData.list;

        if (vsList === null || typeof vsList === "undefined" || vsList.length === 0) 
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "no cards to display in " + type }));
            return null;
        }

        const sHtml = ViewCardListContainer.createListHtml(vsList, bICanSeeIt);
        if (sHtml === "")
            return null;
            
        const elem = ViewCardListContainer.insertHtml(sHtml, type, sTitle + type.toUpperCase());
        
        /** I myself should not see my own offering cards so only the opponent knows it */
        if (bICanSeeIt) 
        {
            const res = elem.querySelectorAll(".card-hand");
            for (let _elem of res)
            {
                _elem.onmouseover = TaskBarCards.OnShowOnHover;
                _elem.onmouseout = TaskBarCards.OnMouseOut;
            }
        }

        return elem;
    }

    static OnClickCardIconOffered(e) 
    {
        TaskBarCards._OnClickCardIcon(true, e.target);
        e.stopPropagation();
        return false;
    }

    static OnClickCardIconNonOffered(e) 
    {
        TaskBarCards._OnClickCardIcon(false, e.target);
        e.stopPropagation();
        return false;
    }

    static _OnClickCardIcon(isOffer, jLink) 
    {
        const target = jLink.getAttribute("data-move-to");
        const bShuffle = jLink.getAttribute("data-shuffle") === "true";
        const cardDiv = jLink.parentElement.parentElement;
        const sUuid = cardDiv.getAttribute("data-uuid");

        if (target === "offer") /* offer the card */
        {
            MeccgApi.send("/game/view-cards/offer-reveal", { uuid: sUuid });
        
            cardDiv.querySelector("img.card-icon").classList.add("on-offer-orevealed");
            return;
        }

        cardDiv.classList.add("hiddenVisibility");

        MeccgApi.send("/game/card/move", { uuid: sUuid, target: target, drawTop: target === "hand", shuffle: bShuffle });
        if (isOffer) 
        {
            MeccgApi.send("/game/view-cards/offer-remove", { uuid: sUuid });
            DomUtils.removeAllChildNodes(document.getElementById("card_icon_nr_" + sUuid));
        }
    }

    static HideListContainer(jViewContainer, jContainer) 
    {
        if (!jViewContainer.classList.contains("hidden"))
            jViewContainer.classList.add("hidden");

        jContainer.setAttribute("class", jContainer.getAttribute("data-class"));

        DomUtils.removeAllChildNodes(jContainer.querySelector(".container-data"));

        if (jContainer.classList.contains("offered"))
            jContainer.classList.remove("offered");

        if (jContainer.classList.contains("offer"))
            jContainer.classList.remove("offer");
    }

    static ShufflePlaydeck(e) 
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "playdeck" });
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Playdeck shuffled." }));

        if (e !== undefined)
            e.stopPropagation();

        return false
    }

    static OnClickIconHand(e) 
    {
        const elem = document.getElementById("icon_hand");
        if (elem.classList.contains("act")) 
        {
            document.getElementById("playercard_hand").classList.add("hidden");
            elem.classList.remove("act");
        }
        else 
        {
            document.getElementById("playercard_hand").classList.remove("hidden");
            elem.classList.add("act");

            /** query cards in hand */
            MeccgApi.send("/game/card/hand", {});
        }

        e.stopPropagation();
        return false;
    }

    static ShuffleDiscardpile(e) 
    {
        MeccgApi.send("/game/view-cards/shuffle", { target: "discardpile" });
        e.stopPropagation();
        return false
    }

    static OnTurnClick(e) 
    {
        if (!e.target.classList.contains("act")) 
        {
            const sPhase = e.target.getAttribute("data-phase") || "";
            MeccgApi.send("/game/phase/set", sPhase);
        }

        e.stopPropagation();
        return false;
    }
}
    

class TaskBarCardsInterface 
{
    constructor(_CardList, _CardPreview)
    {
        this._TaskBarCards = new TaskBarCards(_CardList, _CardPreview);
    }

    onShow(_bIsMe, jData) 
    {
        this._TaskBarCards.onShow(jData);
    }

    onShowOnOffer(bIsMe, jData) 
    {
        this._TaskBarCards.onShowOnOffer(bIsMe, jData);
    }

    onShowOnOfferReveal(uuid) 
    {
        this._TaskBarCards.onShowOnOfferReveal(uuid)
    }

    onShowOnOfferRemove(uuid) 
    {
        this._TaskBarCards.onShowOnOfferRemove(uuid)
    }

    hideOffer()
    {
        this._TaskBarCards.hideOffer();
    }
}

document.body.addEventListener("meccg-show-victory-sheet", TaskBarCards.onShowVictorySheet, false);
