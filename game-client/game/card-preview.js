
const CardPreview = { };

CardPreview.isVisitor = false;
CardPreview.enableIdleCheck = false;
CardPreview.lastActive = Date.now();
CardPreview.allowIdleMax = 1000 * 60 * 15;
CardPreview.idleForceShutdown = null;
CardPreview.idleCountdownActive = false;

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
    if (elem === null)
        return null;

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
    if (elem !== null)
    {
        DomUtils.removeAllChildNodes(elem);

        const pImage = document.createElement("img");
        pImage.setAttribute("src", img);
        pImage.setAttribute("crossorigin", "anonymous");

        elem.appendChild(pImage);
        elem.classList.remove("hidden");
    }
};

CardPreview.hide = function(bLeft, bTop)
{
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

CardPreview.isLeft = function(elem)
{
    return elem.getAttribute("data-view-left") === "true";
};

CardPreview.isTop = function(elem)
{
    return elem.getAttribute("data-view-top") === "true";
};

CardPreview.isShowAlways = function(elem)
{
    return elem.getAttribute("data-view-always") === "true";
};

CardPreview.setPosition = function(pThis, bLeft, bTop, bShowAlways)
{
    pThis.setAttribute("data-view-left", bLeft);
    pThis.setAttribute("data-view-top", bTop);
    pThis.setAttribute("data-view-always", bShowAlways);
};

CardPreview.initGeneric = function(cardDiv, bLeft, bTop, bShowAlways)
{
    if (cardDiv === null)
        return;

    const list = cardDiv.querySelectorAll("img.card-icon");
    const size = list === null ? 0 : list.length;

    for (let i  = 0; i < size; i++)
    {
        let pThis = list[i];
        CardPreview.setPosition(pThis, bLeft, bTop, bShowAlways);
        pThis.onmouseover = CardPreview._doHoverOnGuard;        
        pThis.onmouseout = CardPreview.hideAll;
    }
};

CardPreview.initOnGuard = function(cardDiv, bLeft, bTop)
{
    CardPreview.initGeneric(cardDiv, bLeft, bTop, true);
};

CardPreview.init = function(cardDiv, bLeft, bTop)
{
    CardPreview.initGeneric(cardDiv, bLeft, bTop, false);
};

CardPreview._getImage = function(elem)
{
    let bAlways = CardPreview.isVisitor || CardPreview._isMyCard(elem);
    let src = elem.getAttribute("src") || "";

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
    let sVal = elem.getAttribute("data-owner");
    return sVal === null || typeof sVal === "undefined" || sVal === "";
};

/**
 * Hovering an on GUARD card is a bit tricky: the backside will be shown by default, but the preview
 * needs to show the front side. AND also regard that an onguard card might have been
 * flipped so it is visible.
 */
CardPreview._doHoverOnGuard = function()
{
    /* THIS points to the element being hovered */
    CardPreview.showImage(this);
};

CardPreview.showImage = function(elem)
{
    if (elem === null)
        return;

    if (elem.nodeName !== "IMG" && elem.nodeName !== "img")
        elem = this.querySelector("img");

    if (elem !== null)
    {
        let isLeft = CardPreview.getElementPositionIsLeft(elem);
        if (isLeft === null)
            isLeft = CardPreview.isLeft(elem);

        CardPreview.show(CardPreview._getImage(elem), !isLeft, true); //CardPreview.isLeft(elem), CardPreview.isTop(elem));
    }
};



CardPreview._initView = function(sId)
{
    let elem = document.getElementById(sId);
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
