
const CardPreview = { };

CardPreview.isVisitor = false;
CardPreview.enableIdleCheck = false;
CardPreview.lastActive = Date.now();
CardPreview.allowIdleMax = 1000 * 60 * 15;
CardPreview.idleForceShutdown = null;
CardPreview.idleCountdownActive = false;
CardPreview.currentCharacterId = "";
CardPreview.currentCardId = "";

CardPreview.getTargetContainer = function(bLeft, bTop)
{
    if (bLeft)
        return bTop ? document.getElementById("preview_left") : document.getElementById("preview_left_bottom");
    else
        return bTop ? document.getElementById("preview_right") : document.getElementById("preview_right_bottom");
}

CardPreview.updateActivity = function()
{
    if (CardPreview.enableIdleCheck)
    {
        CardPreview.lastActive = Date.now();
        if (CardPreview.idleForceShutdown !== null)
        {
            clearTimeout(CardPreview.idleForceShutdown);
            CardPreview.idleForceShutdown = null;
            CardPreview.idleCountdownActive = false;
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "Game is active again." }));    
        }
    }
}

CardPreview.checkIdle = function()
{
    const lMillisDif = Date.now() - CardPreview.lastActive;
    if (lMillisDif < CardPreview.allowIdleMax)
        return;
    
    if (CardPreview.idleForceShutdown === null)
    {
        CardPreview.idleCountdownActive = true;
        CardPreview.idleForceShutdown = setTimeout( () => document.body.dispatchEvent(new CustomEvent("meccg-foce-end-game", { })), 1000 * 60 * 5);
    }

    document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "You have been idle for too long. Please interact with a card." }));    
}

CardPreview.addHover = function(id, bRight, bTop)
{
    if (typeof bTop === "undefined")
        bTop = true;
    
    CardPreview.init(document.getElementById(id), !bRight, bTop);
};

CardPreview.getElementPositionIsLeft = function(elem)
{
    const elemLeft = elem.getBoundingClientRect().x - window.scrollX;
    const windowHalf = window.innerWidth / 2;
    return elemLeft < windowHalf;
}

/**
 * Show a magnified card on hover
 * @param {String} img
 * @param {boolean} bLeft
 * @param {boolean} bTop
 * @return {void}
 */
CardPreview.show = function(img, bLeft, bTop)
{
    if (img === undefined || img === "" )//|| img.indexOf(".") === -1)
        return;
    
    if (typeof bTop === "undefined")
        bTop = true;

    const elem = CardPreview.getTargetContainer(bLeft, bTop);
    if (elem === null)
        return;

    DomUtils.removeAllChildNodes(elem);

    const pImage = document.createElement("img");
    pImage.setAttribute("src", img);
    pImage.setAttribute("crossorigin", "anonymous");

    elem.appendChild(pImage);
    elem.classList.remove("hidden");
};

CardPreview.onHoverCharacter = function(img)
{
    CardPreview.currentCharacterId = "";
    CardPreview.currentCardId = "";
    
    if (img.parentElement === null)
        return;

    const parent = img.parentElement;
    const id = parent.hasAttribute("id") ? parent.getAttribute("id") : "";
    if (parent.getAttribute("data-card-type") === "character")
        CardPreview.currentCharacterId = id;

    CardPreview.currentCardId = parent.hasAttribute("data-uuid") ? parent.getAttribute("data-uuid") : "";
}

CardPreview.hide = function(bLeft, bTop)
{
    CardPreview.currentCharacterId = "";
    CardPreview.currentCardId = "";

    const elem = CardPreview.getTargetContainer(bLeft, bTop);
    if (elem !== null)
    {
        elem.classList.add("hidden");
        DomUtils.removeAllChildNodes(elem);
        CardPreview.updateActivity();
    }
};

CardPreview.hideAll = function()
{
    CardPreview.hide(true, true);
    CardPreview.hide(true, false);
    CardPreview.hide(false, true);
    CardPreview.hide(false, false);
};

CardPreview.initMapViewCard = function(elem)
{
    elem.onmouseover = () => CardPreview.show(elem.src, false, true);
    elem.onmouseout = () => CardPreview.hide(false, true);
};

CardPreview.initGeneric = function(cardDiv)
{
    if (cardDiv === null)
        return;

    const list = cardDiv.querySelectorAll("img.card-icon");
    const size = list === null ? 0 : list.length;

    for (let i  = 0; i < size; i++)
    {
        const pThis = list[i];
        pThis.onmouseover = CardPreview._doHoverOnGuard;        
        pThis.onmouseout = CardPreview.hideAll;
    }
};

CardPreview.initOnGuard = function(cardDiv)
{
    CardPreview.initGeneric(cardDiv, true);
};

CardPreview.init = function(cardDiv)
{
    CardPreview.initGeneric(cardDiv, false);
};

CardPreview._getImage = function(elem)
{
    const bAlways = CardPreview.isVisitor || CardPreview._isMyCard(elem);
    const src = elem.getAttribute("src") || "";

    if (!bAlways || !CardPreview._isBackside(src))
        return src;
    else 
        return elem.getAttribute("data-img-image") || "";
};

CardPreview._isBackside = function(src)
{
    return src.indexOf("/backside") !== -1
};

CardPreview._isMyCard = function(elem)
{
    const sVal = elem.getAttribute("data-owner");
    return sVal === null || typeof sVal === "undefined" || sVal === "";
};

/**
 * Hovering an on GUARD card is a bit tricky: the backside will be shown by default, but the preview
 * needs to show the front side. AND also regard that an onguard card might have been
 * flipped so it is visible.
 */
CardPreview._doHoverOnGuard = function(e)
{
    /* THIS points to the element being hovered */
    const isLeft = CardPreview.isOnLeft(e);
    CardPreview.showImage(this, isLeft);
};

CardPreview.isOnLeft = function(e)
{
    const elemLeft = e.clientX - window.scrollX;
    const windowHalf = window.innerWidth / 2;
    return elemLeft <= windowHalf;
};

CardPreview.showImage = function(elem, isLeft)
{
    if (elem === null)
        return;

    if (elem.nodeName !== "IMG" && elem.nodeName !== "img")
        elem = this.querySelector("img");

    if (elem !== null)
    {
        //const isLeft = CardPreview.getElementPositionIsLeft(elem);
        CardPreview.show(CardPreview._getImage(elem), !isLeft, true);
        CardPreview.onHoverCharacter(elem);
    }
};

CardPreview._initView = function(sId)
{
    const elem = document.getElementById(sId);
    if (elem !== null)
        elem.onmouseover = CardPreview._hidePreviewBox;
};

CardPreview._hidePreviewBox = function()
{
    this.classList.add("hidden");
    DomUtils.removeAllChildNodes(this);
};

CardPreview._isReady = false;

CardPreview.onDocumentReady = function()
{
    if (CardPreview._isReady)
        return;

    CardPreview.isVisitor = document.body.getAttribute("data-is-watcher") === "true";

    /** add CSS  */
    const link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href","/media/assets/css/card-preview.css");
    document.head.appendChild(link);

    /** insert container */
    const jCont = document.createElement("div");
    jCont.setAttribute("class", "preview-container");
    jCont.innerHTML = '<div id="preview_left" class="hidden preview-left preview-top"></div><div id="preview_right" class="hidden preview-right preview-top"></div><div id="preview_left_bottom" class="hidden preview-left preview-bottom"></div><div id="preview_right_bottom" class="hidden preview-right preview-bottom"></div>';

    document.body.prepend(jCont);

    CardPreview._initView("preview_left");
    CardPreview._initView("preview_left_bottom");
    CardPreview._initView("preview_right");
    CardPreview._initView("preview_right_bottom");

    CardPreview._isReady = true;

    if (typeof g_sLobbyToken !== "undefined" && g_sLobbyToken !== "" && document.body.getAttribute("data-is-game") === "true")
    {
        CardPreview.enableIdleCheck = true;
        setInterval(CardPreview.checkIdle, 1000 * 60);
    }
}


document.body.addEventListener("meccg-init-ready", CardPreview.onDocumentReady, false);
