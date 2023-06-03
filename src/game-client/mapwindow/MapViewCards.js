
/**
 * Adds game card image functionality to the map. If shows card images and lists of site cards
 */
class MapViewCards extends MapView {

    constructor(images, assetFolder)
    {
        super(assetFolder);

        this.CardPreview = CardPreview;
        this.CardList = new CardList(images, []);

        this._temp = null;
    }

    static createEntry(jEntry)
    {
        return { set_code : jEntry["set_code"], image : jEntry["image"], code: jEntry["code"], site: true};
    }

    static getAdditionalAlignKeys()
    { 
        return ["fallenwizard", "fallenlord", "lord", "grey", "dragonlord", "warlord", "elflord", "atanilord", "dwarflord"]; 
    }

    static removeQuotes(sImage)
    {
        if (sImage.indexOf('"') === -1)
            return sImage;
        
        const len = sImage.length;
        for (let i = 0; i < len; i++)
        {
            if (sImage[i] === '"')
                sImage[i] = "_";
        }
        
        return sImage;
    }

    static getCardBacksideImageUrl()
    {
        return "/data/backside-region";
    }

    createImage(code, isSite, isTapped)
    {
        const sType = isSite ? "site" : "location";
        const sTapped = isTapped !== undefined && isTapped ? 'site-is-tapped' : "site-image";
        const sTitle = MapViewCards.removeQuotes(code) + " (" + sType + ")";
        const sUrl = isSite ? this.CardList.getImageSite(code) : this.CardList.getImageRegion(code);
        
        const img = document.createElement("img");
        img.setAttribute("decoding", "async");
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("class", sTapped);
        img.setAttribute("data-src", sUrl);
        img.setAttribute("src", MapViewCards.getCardBacksideImageUrl());
        img.setAttribute("data-code", code);
        img.setAttribute("data-location-type", sType);
        img.setAttribute("title", sTitle);
        return img;
    }

    createSearchLimitations()
    {
        const keys = MapViewCards.getAdditionalAlignKeys();
        const showAlignment = 
        {
            "hero": g_pRegionMapPreferences.showSite("hero"),
            "minion": g_pRegionMapPreferences.showSite("minion"),
            "balrog":  g_pRegionMapPreferences.showSite("balrog")
        }

        for(let key of keys)
            showAlignment[key] = g_pRegionMapPreferences.showSite(key);

        return showAlignment;
    }

    verifyTempArray()
    {
        if (this._temp === null)
            this._temp = [];
    }

    pollCardResultList()
    {
        if (this._temp === null)
            return [];
    
        const _res = this._temp;
        this._temp = null;
        return _res;
    }

    getRegionImages(j)
    {
        this.verifyTempArray();
        if (j !== undefined)
            this._temp.push({ set_code : j["set_code"], image : j["image"], code: j["code"], site: false});            
    }

    static lazyloadImageClasses(sSelector)
    {
        const list = document.querySelectorAll(sSelector);
        if (list === null || list.length === 0)
            return;

        const len = list.length;
        for (let i = 0; i < len; i++)
        {
            const _src = list[i].getAttribute("data-src");
            if (_src !== undefined && _src !== null && _src !== "")
            {
                list[i].setAttribute("src", list[i].getAttribute("data-src"));
                list[i].setAttribute("data-src", "");
            }
        }
    }
    
    static lazyloadImages()
    {
        setTimeout(() => MapViewCards.lazyloadImageClasses("img.site-image"), 50);
        setTimeout(() => MapViewCards.lazyloadImageClasses("img.site-is-tapped"), 50);
    }

    isSiteTapped()
    {
        return false;
    }

    fillSiteList()
    {
        DomUtils.removeAllChildNodes(document.getElementById("found_sites"));
        this.hideSearchTemplatePane();

        const res = this.pollCardResultList();
        if (res.length === 0)
            return null;
        
        const jTarget = document.getElementById("found_sites");
        for (let _card of res)
        {
            let _isTapped = this.isSiteTapped(_card["code"]);
            jTarget.appendChild(this.createImage(_card["code"], _card["site"], _isTapped));

        }

        return jTarget;        
    }
}