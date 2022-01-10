
const CardPreview = { };

CardPreview.getTargetContainer = function(bLeft, bTop)
{
    if (bLeft)
        return bTop ? document.getElementById("preview_left") : document.getElementById("preview_left_bottom");
    else
        return bTop ? document.getElementById("preview_right") : document.getElementById("preview_right_bottom");
}

CardPreview.addHover = function(id, bRight, bTop)
{
    if (typeof bTop === "undefined")
        bTop = true;
    
    CardPreview.init(document.getElementById(id), !bRight, bTop);
};

/**
 * Show a magnified card on hover
 * @param {String} img
 * @param {boolean} bLeft
 * @param {boolean} bTop
 * @return {void}
 */
CardPreview.show = function(img, bLeft, bTop)
{
    if (img === undefined || img === "" || img.indexOf(".") === -1)
        return;
    
    CardPreview.hideAll();

    const elem = CardPreview.getTargetContainer(bLeft !== false, bTop !== false);
    const pImage = document.createElement("img");
    pImage.setAttribute("src", img);
    pImage.onmousemove = CardPreview.hideAll;
    elem.appendChild(pImage);
    elem.classList.remove("hidden");
};

CardPreview.hide = function(bLeft, bTop)
{
    CardPreview.hideElement(CardPreview.getTargetContainer(bLeft, bTop));
};

CardPreview.hideElement = function(elem)
{
    if (elem !== null)
    {
        elem.classList.add("hidden");
        DomUtils.removeAllChildNodes(elem);
    }
};

CardPreview.hideAll = function()
{
    const elem = document.getElementById("preview-container-wrapper");
    if (elem === null)
        return;

    const list = elem.getElementsByTagName("div");
    const len = list === null ? 0 : list.length;
    for (let i = 0; i < len; i++)
        CardPreview.hideElement(list[i]);
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
    let bAlways = CardPreview._isMyCard(elem);
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
    let elem = this;
    if (elem.nodeName !== "IMG" && elem.nodeName !== "img")
        elem = this.querySelector("img");

    if (elem !== null)
        CardPreview.show(CardPreview._getImage(elem), CardPreview.isLeft(elem), CardPreview.isTop(elem));
};

CardPreview.insertCss = function()
{
    /** add CSS  */
    const link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href","/media/assets/css/card-preview.css");
    document.head.appendChild(link);
};

CardPreview.appendContainerElement = function(jCont, sId, sClass)
{
    const pCont = document.createElement("div");
    pCont.setAttribute("id", sId);
    pCont.setAttribute("class", "hidden " + sClass);
    pCont.onmouseover = CardPreview.hideAll;
    jCont.appendChild(pCont);
}

CardPreview.insertContainer = function()
{

    /** insert container */
    const jCont = document.createElement("div");
    jCont.setAttribute("class", "preview-container");
    jCont.setAttribute("id", "preview-container-wrapper");

    CardPreview.appendContainerElement(jCont, "preview_left", "preview-left preview-top");
    CardPreview.appendContainerElement(jCont, "preview_right", "preview-right preview-top");
    CardPreview.appendContainerElement(jCont, "preview_left_bottom", "preview-left preview-bottom");
    CardPreview.appendContainerElement(jCont, "preview_right_bottom", "preview-right preview-bottom");

    document.body.prepend(jCont);
};


(function() {
    CardPreview.insertCss();
    CardPreview.insertContainer();
})();