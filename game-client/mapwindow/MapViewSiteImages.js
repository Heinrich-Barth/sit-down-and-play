/**
 * Adds game card image functionality to the map. If shows card images and lists of site cards
 */
 class MapViewSiteImages  {

    constructor(jMap, tapped)
    {
        this.CardPreview = CardPreview;
        this.CardList = new CardList(jMap.images, []);

        this._temp = null;
        this.tapped = tapped === undefined ? {} : tapped;
        this.jMap = jMap.map === undefined ? {} : jMap.map;
    }

    isSiteTapped(code)
    {
        return code !== undefined && code !== "" && this.tapped[code] !== undefined;
    }

    createEntry(jEntry, isSite, region, siteSitle)
    {
        this._temp.push({ 
            code: jEntry["code"], 
            site: isSite === true, 
            region: region,
            siteSitle : siteSitle === undefined ? "" : siteSitle,
            tapped : this.isSiteTapped(jEntry["code"])
        });
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

    createInstance()
    {
        document.body.addEventListener("meccg-map-show-images", this.onShowImages.bind(this), false);
        document.body.addEventListener("meccg-map-search", this.onSearch.bind(this), false);

        document.body.classList.add("mapwindow");
    }

    onSearch(e)
    {
        const region = e.detail.region === undefined ? "" : e.detail.region.trim();
        const text = e.detail.text === undefined ? "" : e.detail.text.trim();

        if (region !== "")
            this.showImages(region, text);
        else if (text !== "")
            this.showImagesSearchAll(text.toLowerCase());
    }

    showImages(region, site)
    {
        if (region === "" && site === "")
            return;
        
        const jRegion = this.jMap[region];
        if (jRegion === undefined)
            return;
            
        const showAlignment = this.createSearchLimitations();
        if (showAlignment.dreamcards || !region.dreamcard)
        {
            this.pushRegion(jRegion, region);
            for (let key in jRegion.sites)
            {
                if (site === "" || site === key)
                    this.getSiteImages(jRegion.sites[key], showAlignment, region, key);
            }
        }
        
        this.fillSiteList();
        this.lazyloadImages();

        document.body.dispatchEvent(new CustomEvent("meccg-map-show-images-done", { "detail":  "found_sites" }));
    }

    showImagesSearchAll(text)
    {
        const showAlignment = this.createSearchLimitations();

        for (let region in this.jMap)
        {
            const jRegion = this.jMap[region];
            for (let key in jRegion.sites)
            {
                if (key.toLowerCase().indexOf(text) !== -1)
                    this.getSiteImages(jRegion.sites[key], showAlignment, region, key);
            }
        }

        this.fillSiteList();
        this.lazyloadImages();

        document.body.dispatchEvent(new CustomEvent("meccg-map-show-images-done", { "detail":  "found_sites" }));
    }

    onShowImages(e)
    {
        const region = e.detail.region === undefined ? "" : e.detail.region;
        const site = e.detail.site === undefined ? "" : e.detail.site;

        this.showImages(region, site);
    }

    createImage(code, isSite, region, siteTitle, isTapped)
    {
        const sType = isSite ? "site" : "location";
        const sTitle = siteTitle === "" ? region : siteTitle;
        const sUrl = isSite ? this.CardList.getImageSite(code) : this.CardList.getImageRegion(code);
        
        const img = document.createElement("img");
        img.setAttribute("decoding", "async");
        img.setAttribute("crossorigin", "anonymous");

        if (isTapped !== true)
            img.setAttribute("class", "site-image");
        else
            img.setAttribute("class", "site-image site-is-tapped");

        img.setAttribute("data-src", sUrl);
        img.setAttribute("src", MapViewSiteImages.getCardBacksideImageUrl());
        img.setAttribute("data-code", code);
        img.setAttribute("data-location-type", sType);
        img.setAttribute("title", sTitle);
        img.setAttribute("data-site", sTitle)
        img.setAttribute("data-region", region)
        img.onclick = this.onClickCard.bind(this);
        return img;
    }

    onClickCard(e)
    {
        const elem = e.target;
        const image = elem.getAttribute("src");
        const code = elem.getAttribute("data-code");
        const isSite = "site" === elem.getAttribute("data-location-type");
        const regionName = elem.getAttribute("data-region");
        const title = elem.getAttribute("data-site");
        document.body.dispatchEvent(new CustomEvent("meccg-map-siteclick", { "detail":  {
            region: regionName,
            code: code,
            imgage: image,
            isSite : isSite,
            title : title
        } }));
    }


    createSearchLimitations()
    {
        const keys = MapViewSiteImages.getAdditionalAlignKeys();
        const showAlignment = 
        {
            "hero": g_pRegionMapPreferences.showSite("hero"),
            "minion": g_pRegionMapPreferences.showSite("minion"),
            "balrog":  g_pRegionMapPreferences.showSite("balrog"),
            "dreamcards": g_pRegionMapPreferences.showDreamcards()
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
        if (this._temp === null || this._temp.length === 0)
            return [];
    
        /** first element is always the region */
        const _region = this._temp[0].site === false ? this._temp.shift() : null;
        const _res = this._temp;

        this._temp = null;
          
        _res.sort((a, b) => a.code < b.code ? -1 : 1);

        /** add region if available */
        if (_region !== null)
            _res.unshift(_region);

        return _res;
    }

    pushRegion(j, region)
    {
        this.verifyTempArray();
        if (j !== undefined)
            this.createEntry(j, false, region);
    }

    /**
     * Add a site image
     * @param {JSON} j Site entry
     * @param {JSON} showAlignment Show alignments
     * @param {String} region Region
     * @param {String} site Site
     */
    getSiteImages(j, showAlignment, region, site)
    {
        this.verifyTempArray();
        const showDC = showAlignment.dreamcards;

        if (typeof j.hero !== "undefined" && showAlignment.hero && (showDC || !j.hero.dreamcard))
            this.createEntry(j.hero, true, region, site);

        if (typeof j.minion !== "undefined" && showAlignment.minion && (showDC || !j.minion.dreamcard))
            this.createEntry(j.minion, true, region, site);

        if (typeof j.balrog !== "undefined" && showAlignment.balrog && (showDC || !j.balrog.dreamcard))
            this.createEntry(j.balrog, true, region, site);
        
        const keys = MapViewSiteImages.getAdditionalAlignKeys();
        for(let key of keys)
        {
            if (typeof j[key] !== "undefined" && showAlignment[key] && (showDC || j[key].dreamcard === showDC))
                this.createEntry(j[key], true, region, site);
        }
    }

    lazyloadImageClasses(sSelector)
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

                this.CardPreview.initMapViewCard(list[i]);
            }
        }
    }
    
    lazyloadImages()
    {
        setTimeout(() => this.lazyloadImageClasses("img.site-image"), 50);
        setTimeout(() => this.lazyloadImageClasses("img.site-is-tapped"), 50);
    }

    destroy()
    {
        DomUtils.removeAllChildNodes(document.getElementById("found_sites"));
    }

    fillSiteList()
    {
        DomUtils.removeAllChildNodes(document.getElementById("found_sites"));

        const res = this.pollCardResultList();
        if (res.length === 0)
            return;
        
        const jTarget = document.getElementById("found_sites");
        for (let _card of res)
            jTarget.appendChild(this.createImage(_card.code, _card.site, _card.region, _card.siteSitle, _card.tapped));
    }
}