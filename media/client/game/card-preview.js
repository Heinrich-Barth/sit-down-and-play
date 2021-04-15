
const CardPreview = { };

CardPreview.getTargetContainer = function(bLeft, bTop)
{
    if (bLeft)
        return bTop ? jQuery("#preview_left") : jQuery("#preview_left_bottom");
    else
        return bTop ? jQuery("#preview_right") : jQuery("#preview_right_bottom");
}

CardPreview.addHover = function(id, bRight, bTop)
{
    if (typeof bTop === "undefined")
        bTop = true;
    
    CardPreview.init(jQuery("#" + id), !bRight, bTop);
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
    if (img === "" || img.indexOf(".") === -1)
        return;
    
    if (typeof bTop === "undefined")
        bTop = true;

    var elem = CardPreview.getTargetContainer(bLeft, bTop);
    elem.html("<img src=\"" + img + "\">");
    elem.removeClass("hidden");
};

CardPreview.hide = function(bLeft, bTop)
{
    var elem = CardPreview.getTargetContainer(bLeft, bTop);
    elem.addClass("hidden");
    elem.empty();
};

CardPreview.hideAll = function()
{
    CardPreview.hide(true, true);
    CardPreview.hide(true, false);
    CardPreview.hide(false, true);
    CardPreview.hide(false, false);
};

CardPreview.initMapViewCard = function(jImg)
{
    jImg.hover(function()
    {
        CardPreview.show(this.src, true, true);
    },
    function()
    {
        CardPreview.hide(true, true);
    });
},

CardPreview.isLeft = function(jElem)
{
    return jElem.attr("data-view-left") === "true";
};

CardPreview.isTop = function(jElem)
{
    return jElem.attr("data-view-top") === "true";
};

CardPreview.isShowAlways = function(jElem)
{
    return jElem.attr("data-view-always") === "true";
};

CardPreview.setPosition = function(pThis, bLeft, bTop, bShowAlways)
{
    let jImg = jQuery(pThis);
    jImg.attr("data-view-left", bLeft);
    jImg.attr("data-view-top", bTop);
    jImg.attr("data-view-always", bShowAlways);
};

CardPreview.initGeneric = function(jCardDiv, bLeft, bTop, bShowAlways)
{
    jCardDiv.find("img.card-icon").each(function()
    {
        CardPreview.setPosition(this, bLeft, bTop, bShowAlways);
        jCardDiv.get(0).onmouseover = CardPreview._doHoverOnGuard;        
        jCardDiv.get(0).onmouseout = CardPreview.hideAll;
    });
};

CardPreview.initOnGuard = function(jCardDiv, bLeft, bTop)
{
    CardPreview.initGeneric(jCardDiv, bLeft, bTop, true);
};

CardPreview.init = function(jCardDiv, bLeft, bTop)
{
    CardPreview.initGeneric(jCardDiv, bLeft, bTop, false);
};

CardPreview._getImage = function(elem)
{
    //let bAlways = CardPreview.isShowAlways(elem);
    let bAlways = CardPreview._isMyCard(elem);
    let src = elem.attr("src");
    if (!bAlways || !CardPreview._isBackside(src))
        return src;
    else 
        return elem.attr("data-img-image");
};

CardPreview._isBackside = function(src)
{
    return src.indexOf("/backside") !== -1
};

CardPreview._isMyCard = function(elem)
{
    let sVal = elem.attr("data-owner");
    return typeof sVal === "undefined" || sVal === "";
};

/**
 * Hovering an on GUARD card is a bit tricky: the backside will be shown by default, but the preview
 * needs to show the front side. AND also regard that an onguard card might have been
 * flipped so it is visible.
 */
CardPreview._doHoverOnGuard = function()
{
    /* THIS points to the element being hovered */
    let elem = jQuery(this).find("img");
    CardPreview.show(CardPreview._getImage(elem), CardPreview.isLeft(elem), CardPreview.isTop(elem));
};

CardPreview._initView = function(sId)
{
    let elem = document.getElementById(sId);
    if (elem !== null)
        elem.onmouseover = CardPreview._hidePreviewBox;
};

CardPreview._hidePreviewBox = function()
{
    let jElem = jQuery(this);
    jElem.addClass("hidden");
    jElem.empty();
};

CardPreview._isReady = false;

CardPreview.onDocumentReady = function()
{
    if (CardPreview._isReady)
        return;

    /** add CSS  */
    jQuery("<link>", {
        rel: "stylesheet",
        type: "text/css",
        href: "/media/assets/css/card-preview.css"
    }).appendTo('head');

    /** insert container */
    const jCont = jQuery("<div>", {
        class: "preview-container"
    });

    jCont.html('<div id="preview_left" class="hidden preview-left preview-top"></div><div id="preview_right" class="hidden preview-right preview-top"></div><div id="preview_left_bottom" class="hidden preview-left preview-bottom"></div><div id="preview_right_bottom" class="hidden preview-right preview-bottom"></div>');
    jQuery("body").prepend(jCont);

    CardPreview._initView("preview_left");
    CardPreview._initView("preview_left_bottom");
    CardPreview._initView("preview_right");
    CardPreview._initView("preview_right_bottom");

    CardPreview._isReady = true;
}


jQuery(document).ready(CardPreview.onDocumentReady);
