const CardListSanatizeUrl = function(sImageCDNUrl)
{
    if (sImageCDNUrl === undefined || sImageCDNUrl === "")
        return "";

    sImageCDNUrl = sImageCDNUrl.trim();
    if (sImageCDNUrl === "/")
        sImageCDNUrl = "";
    else if (sImageCDNUrl.endsWith("/"))
        sImageCDNUrl = sImageCDNUrl.substring(0, sImageCDNUrl.length-1);

    return sImageCDNUrl;
}

/**
 * Card Image Files
 * 
 * @param {json} jsonCardList 
 */
function CardList(images, quests, useImagesDC, useImagesIC) 
{ 
    this._list = images === undefined ? null : images;
    this._fliped = quests === undefined ? [] : quests;
    this._useImagesDC = useImagesDC === undefined ? true : useImagesDC;
    this._useImagesIC = useImagesIC === undefined ? false : useImagesIC;

    this._imageBacksideDefault = "/media/assets/images/cards/backside.jpg";
    this._imageNotFound = "/media/assets/images/cards/notfound-generic.jpg";
    this._imageNotFoundRegion = "/media/assets/images/cards/notfound-region.jpg";
    this._imageNotFoundSite = "/media/assets/images/cards/notfound-site.jpg";
    this._imageCDNUrl = "";

    const pThat = this;

    fetch("/data/image-cdn").then((response) => response.text().then((val) => pThat._imageCDNUrl = CardListSanatizeUrl(val)));
    
    if (this._list === null)
    {
        fetch("/data/list/images").then((response) => 
        {
            response.json().then((cards) => {
                pThat._list = cards.images;
                if (cards.fliped !== undefined)
                    pThat._fliped = cards.fliped;
            });
        })
        .catch(() => document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch image list." })));
    }
}

CardList.prototype.getImage = function(code) 
{
    return this.getImageByCode(code, this._imageNotFound);
};

CardList.prototype.getImageSite = function(code)
{
    return this.getImageByCode(code, this._imageNotFoundSite);
};

CardList.prototype.getImageRegion = function(code)
{
    return this.getImageByCode(code, this._imageNotFoundRegion);
};

CardList.prototype.getFlipSide = function(code) 
{
    code = this.removeQuotes(code);
    let sBacksideCode = this._fliped[code];
    if (sBacksideCode === undefined)
        return this._imageBacksideDefault;
    else
        return this.getImage(sBacksideCode);
};

CardList.prototype.useImagesDC = function()
{
    return typeof Preferences === "undefined" ? this._useImagesDC : Preferences.useImagesDC();
};
CardList.prototype.useImagesIC = function()
{
    return typeof Preferences === "undefined" ? this._useImagesIC : Preferences.useImagesIC();
};

CardList.prototype.createImageUrl = function(sSet, sImage) 
{
    return this._imageCDNUrl + "/" + sSet.toUpperCase() + "/" + sImage;
};

CardList.prototype.getImageByCode = function(code, sDefault) 
{
    code = this.removeQuotes(code);
            
    if (typeof this._list[code] === "undefined" || typeof this._list[code].image === "undefined")
        return sDefault;
    
    let useDC =  this.useImagesDC();
    let useIC =  this.useImagesIC();

    let _prefix = "";
    if (useDC && this._list[code].errata_dc)
        _prefix = "dce-";
    else if (useIC && this._list[code].errata_ic)
        _prefix = "ice-";
    
    return this.createImageUrl(this._list[code].set_code, _prefix + this._list[code].image);
};

CardList.prototype.removeSetInformation = function(_code)
{
    let nPos = _code.lastIndexOf("(");
    if (nPos === -1)
        return _code;
    else
        return _code.substring(0, nPos+1);
};

CardList.prototype.getMostRecentCardCode = function(_code)
{
    _code = this.removeSetInformation(_code);
    for (var key in this._list)
    {
        if (key.indexOf(_code) === 0)
            return key;
    }

    return "";
};

CardList.prototype.getSafeCode = function(code)
{
    return this.removeQuotes(code);
};

CardList.prototype.removeQuotes = function(sCode)
{
    if (sCode.indexOf('"') === -1)
        return sCode;
    else
        return sCode.replace(/"/g, "");
};

CardList.prototype.getSafeTitle = function(code)
{
    return this.removeQuotes(code);
};

