/**
 * Add movement functionality to the map. Choose
 * target site and add regions on the way
 */
class MapViewMovement extends MapViewMovementSelection {

    constructor(jMap)
    {
        super();

        console.log(jMap);
        this.jMap = jMap.map === undefined ? {} : jMap.map;
        this.jMapSiteRegion = jMap.mapregions === undefined ? {} : jMap.mapregions;
        this.CardList = new CardList(jMap.images, []);
        this.CardPreview = CardPreview;
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

    static _MovementContainer() { return document.getElementById("site_movement"); }
    static _MovementContainerStartSite() { return document.getElementById("site_movement_start_site"); } 
    static _MovementContainerStartRegion() { return document.getElementById("site_movement_start_region"); }

    static _MovementContainerTargetRegion() { return document.getElementById("site_movement_target_region"); }
    static _MovementContainerTargetSite() { return document.getElementById("site_movement_target_site"); }
    static _MovementContainerOtherRegions() { return document.getElementById("site_movement_other_region"); }

    ignoreMarkerClickOnce()
    {
        return this.bIgnoreMarkerClickOnce;
    }
        
    setIgnoreMarkerClickOnce(b)
    {
        this.bIgnoreMarkerClickOnce = b;
    }

    /**
     * Get a site by its code
     * @param {String} sCode Site code
     */
    getSiteByCode(sCode)
    {
        if (sCode === "")
            return null;

        let _keys, _key;
        let _site;
        let len;

        for (let _region in this.jMap)
        {
            for (let _siteKey in this.jMap[_region].sites)
            {
                if (sCode.indexOf(_siteKey) !== 0)
                    continue;

                _site = this.jMap[_region].sites[_siteKey];
                _keys = Object.keys(_site);
                len = _keys.length;
                for (let i = 0; i < len; i++)
                {
                    _key = _keys[i];
                    if (_site[_key]["code"] !== undefined && _site[_key]["code"] === sCode)
                        return _site[_key];
                }
            }
        }
        
        return null;
    }

    isSiteTapped(code)
    {
        return this.jTappedSites[code] !== undefined;
    }

    destroy()
    {
        document.querySelector(".map_view_layer").classList.add("hide");
        DomUtils.removeAllChildNodes(document.getElementById("found_sites"));
        DomUtils.removeAllChildNodes(document.getElementById("map"));
    }

    sendMovement(codeStart, regions, codeTarget)
    {
        if (codeStart === "")
            return;

        if (regions === undefined)
            regions = [];

        if (codeTarget === undefined)
            codeTarget = "";

        const data = {
            start : codeStart,
            regions: regions,
            target: codeTarget
        }
        document.body.dispatchEvent(new CustomEvent("meccg-map-selected-movement", { "detail":  data }));
    }

    onAcceptMovement()
    {
        const jRes = this.getMovementSites();
        if (jRes.target !== "")
        {
            this.sendMovement(jRes.start, jRes.regions, jRes.target);
            this.destroy();
        }
    }

    onCancelMovement()
    {
        this.destroy();

        document.body.dispatchEvent(new CustomEvent("meccg-map-cancel", { "detail": "" }));
    } 

    getMovementSites()
    {
        let jRes = {
            start: MapViewMovement._MovementContainerStartSite().querySelector("img").getAttribute("data-code"),
            regions: [],
            target: ""
        };
        
        const jEnd = MapViewMovement._MovementContainerTargetSite().querySelector("img");
        if (jEnd !== null)
            jRes.target = jEnd.getAttribute("data-code");
        
        const jRegStart = MapViewMovement._MovementContainerStartRegion().querySelector("img");
        if (jRegStart !== null)
            jRes.regions.push(jRegStart.getAttribute("data-code"));
        
        ArrayList(MapViewMovement._MovementContainerOtherRegions()).find("img").each((_elem) =>
        {
            const sCode = _elem.getAttribute("data-code");
            if (!jRes.regions.includes(sCode))
                jRes.regions.push(sCode);
        });
        
        const jRegEnd = MapViewMovement._MovementContainerTargetRegion().querySelector("img");
        if (jRegEnd !== null)
        {
            const sCode = jRegEnd.getAttribute("data-code");
            if (!jRes.regions.includes(sCode))
                jRes.regions.push(sCode);
        }
        
        return jRes;
    }
    
    /**
     * Get a reggion by its site code
     * @param {String} sCode Site code
     */
     getRegionBySiteCode(sCode)
     {
         console.log(this.jMapSiteRegion);
         if (sCode === ""  || typeof this.jMapSiteRegion[sCode] === "undefined")
             return null;
         else
         {
             const sRegionCode = this.jMapSiteRegion[sCode];
             return this.jMap[sRegionCode];
         }
     }

    createImage(code, isSite)
    {
        const sType = isSite ? "site" : "location";
        const sTapped = "site-image";
        const sUrl = isSite ? this.CardList.getImageSite(code) : this.CardList.getImageRegion(code);
        
        const img = document.createElement("img");
        img.setAttribute("decoding", "async");
        img.setAttribute("class", sTapped);
        img.setAttribute("data-src", sUrl);
        img.setAttribute("src", MapViewSiteImages.getCardBacksideImageUrl());
        img.setAttribute("data-code", code);
        img.setAttribute("data-location-type", sType);
        img.setAttribute("title", code);
        return img;
    }

    setTargetSite(sSiteCode)
    {
        const jRegion = this.getRegionBySiteCode(sSiteCode);
        
        DomUtils.empty(MapViewMovement._MovementContainerTargetSite());
        DomUtils.empty(MapViewMovement._MovementContainerTargetRegion());

        MapViewMovement._MovementContainerTargetSite().appendChild(this.createImage(sSiteCode, true));
        MapViewMovement._MovementContainerTargetRegion().appendChild(this.createImage(jRegion["code"], false));
        
        ArrayList(MapViewMovement._MovementContainerTargetSite()).find("img").each((_e) => this.CardPreview.initMapViewCard(_e));
        ArrayList(MapViewMovement._MovementContainerTargetRegion()).find("img").each((_e) => this.CardPreview.initMapViewCard(_e));

        /** lazy load images */
        this.lazyloadImages();
    }

    onProcessEvent(region, image, isSite, code)
    {
        if (!isSite)
            this.addRegionLocation(code);
        else
            this.setTargetSite(code);
    }

    /**
      * Get the Region json by given code
      * @param {String} sRegionCode
      * @return {json} json or null
      */
     getRegionByCode(sRegionCode)
     {
         let _region;
         for (let key in this.jMap)
         {
             _region = this.jMap[key];
             if (_region.code === sRegionCode)
                 return _region;
         }
         
         return null;
     }
    
    addRegionLocation(sRegionCode)
    {
        const jRegion = this.getRegionByCode(sRegionCode);
        if (jRegion === null)
        {
            console.log("Cannot find region by its code " + sRegionCode);
            return;
        }
        
        var jElem = MapViewMovement._MovementContainerOtherRegions().querySelector("[data-code='" + sRegionCode + "']"); 
        if (jElem !== null)
        {
            console.log("Allready there " + sRegionCode);
            return;
        }
        
        MapViewMovement._MovementContainerOtherRegions().appendChild(this.createImage(sRegionCode, false));
        jElem = MapViewMovement._MovementContainerOtherRegions().querySelector("[data-code='" + sRegionCode + "']"); 
        jElem.setAttribute("title", "Click to remove");
        
        this.CardPreview.initMapViewCard(jElem);
        jElem.onclick = (e) => DomUtils.removeNode(e.target);

        /** lazy load images */
        this.lazyloadImages();
    }

    createInstance(sStartSiteCode)
    {
        super.createInstance();

        document.getElementById("movement_accept").onclick = this.onAcceptMovement.bind(this);
        document.getElementById("movement_cancel").onclick = this.onCancelMovement.bind(this);    

        this.onChooseLocationMovement(sStartSiteCode);
        return true;
    }

    /**
     * Open map view to allow for complex movement
     * @param {String} sStartSiteCode Start Location
     * @return {void}
     */
    onChooseLocationMovement(sStartSiteCode)
    {
        if (!this.loadMovementList(sStartSiteCode))
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Cannot load movement map" }));
    }

    loadMovementList(sStartLocationCode)
    {
        DomUtils.empty(document.getElementById("site_movement").querySelector("div.site-list"));
        document.getElementById("site_movement").classList.add("hide");

        if (sStartLocationCode === undefined || sStartLocationCode === "")
            return true;
        
        const jRegion = this.getRegionBySiteCode(sStartLocationCode);
        const jSite = this.getSiteByCode(sStartLocationCode);
        
        if (jRegion === null)
        {
            console.log("Cannot load site region " + sStartLocationCode);
            return false;
        }
        else if (jSite === null)
        {
            console.log("Cannot load site " + sStartLocationCode);
            return false;
        }
        
        this.setupMovementList(jRegion, jSite);
        return true;
    }

    setupMovementList(jRegionStart, jSiteStart)
    {
        DomUtils.empty(MapViewMovement._MovementContainer().querySelector(".site-list"));

        MapViewMovement._MovementContainerStartSite().appendChild(this.createImage(jSiteStart["code"], true));
        MapViewMovement._MovementContainerStartRegion().appendChild(this.createImage(jRegionStart["code"], false));

        const pThis = this;
        ArrayList(MapViewMovement._MovementContainerStartSite()).find("img").each((_e) => pThis.CardPreview.initMapViewCard(_e));
        ArrayList(MapViewMovement._MovementContainerStartRegion()).find("img").each((_e) => pThis.CardPreview.initMapViewCard(_e));
        
        MapViewMovement._MovementContainer().classList.remove("hide");

        /** lazy load images */
        this.lazyloadImages();
    }
}
