
/**
 * Card Image Files
 * 
 * @param {json} jsonCardList 
 */
function CardList(images, quests, useImagesDC, useImagesIC) 
{ 
    this._list = images === undefined ? {} : images;
    this._fliped = quests === undefined ? [] : quests;
    this._useImagesDC = useImagesDC === undefined ? true : useImagesDC;
    this._useImagesIC = useImagesIC === undefined ? false : useImagesIC;

    this._imageBacksideDefault = "/data/backside";
    this._imageNotFound = "/data/card-not-found-generic";
    this._imageNotFoundRegion = "/data/card-not-found-region";
    this._imageNotFoundSite = "/data/card-not-found-site";
    this._imageCDNUrl = "";
    this._isReady = false;

    if (document.body.hasAttribute("data-use-dce") && document.body.getAttribute("data-use-dce") === "false")
        this._useImagesDC = false;

    const pThat = this;
    if (Object.keys(this._list).length === 0)
    {
        fetch("/data/list/images")
        .then((response) => response.json())
        .then((cards) => 
        {
            pThat._list = cards.images;
            if (cards.fliped !== undefined)
                pThat._fliped = cards.fliped;

            pThat._isReady = true;
        })
        .catch(() => document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch image list." })));
    }
}

CardList.prototype.isReady = function() 
{
    return this._isReady;
};

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

CardList.prototype.setUseImagesDC = function(bUse)
{
    this._useImagesDC = bUse !== false;
};

CardList.prototype.useImagesDC = function()
{
    return typeof GamePreferences === "undefined" ? this._useImagesDC : GamePreferences.useImagesDC();
};
CardList.prototype.useImagesIC = function()
{
    return typeof GamePreferences === "undefined" ? this._useImagesIC : GamePreferences.useImagesIC();
};

CardList.prototype.getImageByCode = function(code, sDefault) 
{
    code = this.removeQuotes(code);
            
    if (typeof this._list[code] === "undefined" || typeof this._list[code].image === "undefined")
        return sDefault;
    
    const image = this._list[code];
    if (this.useImagesDC())
    {
        let _url = this.getImageErratumDc(image);
        if (_url !== undefined && _url !== "")
            return _url;
    }
    else if (this.useImagesIC() && image.errata_ic !== undefined && image.errata_ic !== "")
        return image.errata_ic;

    return image.image
};

CardList.prototype.getImageErratumDc = function(image)
{
    if (image.ImageNameErrataDC !== undefined && image.ImageNameErrataDC !== "")
        return image.ImageNameErrataDC;
    else if (image.errata_dc !== undefined && image.errata_dc !== "")
        return image.errata_dc;
    else
        return "";

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
    for (let key in this._list)
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

