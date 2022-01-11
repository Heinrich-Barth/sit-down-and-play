/**
 * Add movement functionality to the map. Choose
 * target site and add regions on the way
 */
class MapViewRegionsMovement extends MapViewRegions {

    constructor(jMap, jTappedSites)
    {
        super(jMap.images);


        this.jMap = jMap.map === undefined ? {} : jMap.map;
        this.jMapSiteRegion = jMap.mapregions === undefined ? {} : jMap.mapregions;

        if (jTappedSites !== undefined)
            this.jTappedSites = jTappedSites;

        this.bIgnoreMarkerClickOnce = false;
    }

    getMapData()
    {
        return this.jMap;
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
        super.destroy();

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

        console.log(data);
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
    
    /**
    * Get the "site"
    * @return String
    */ 
    static getCurrentSite()
    {
         const yourSelect = document.getElementById("sitelist");
         return yourSelect.options[ yourSelect.selectedIndex ].value;
    }

    /**
     * Get the "region"
     * @return String
     */ 
    static getCurrentRegion()
    {
        const yourSelect = document.getElementById("region");
        return yourSelect.options[ yourSelect.selectedIndex ].value;
    }
    
    onRegionClick(regionCode)
    {
        super.onRegionClick(regionCode);

        const elemSites = document.getElementById("region");
        if (elemSites === null)
            return;

        for (let _option of elemSites.options)
        {
            if (_option.value === regionCode)
            {
                this.setIgnoreMarkerClickOnce(true);
                _option.selected = true;
                this.updateRegionSiteList(regionCode);
                break;
            }
        }
    }

    getMovementSites()
    {
        let jRes = {
            start: MapViewRegionsMovement._MovementContainerStartSite().querySelector("img").getAttribute("data-code"),
            regions: [],
            target: ""
        };
        
        const jEnd = MapViewRegionsMovement._MovementContainerTargetSite().querySelector("img");
        if (jEnd !== null)
            jRes.target = jEnd.getAttribute("data-code");
        
        const jRegStart = MapViewRegionsMovement._MovementContainerStartRegion().querySelector("img");
        if (jRegStart !== null)
            jRes.regions.push(jRegStart.getAttribute("data-code"));
        
        ArrayList(MapViewRegionsMovement._MovementContainerOtherRegions()).find("img").each((_elem) =>
        {
            const sCode = _elem.getAttribute("data-code");
            if (!jRes.regions.includes(sCode))
                jRes.regions.push(sCode);
        });
        
        const jRegEnd = MapViewRegionsMovement._MovementContainerTargetRegion().querySelector("img");
        if (jRegEnd !== null)
        {
            const sCode = jRegEnd.getAttribute("data-code");
            if (!jRes.regions.includes(sCode))
                jRes.regions.push(sCode);
        }
        
        return jRes;
    }

    updateRegionSiteList(selection)
    {
        const elemSites = document.getElementById("sitelist");
        DomUtils.removeAllChildNodes(elemSites);

        const len = elemSites.options.length - 1;
        for(var i = len; i >= 0; i--)
            elemSites.remove(i);
        
        let opt = document.createElement('option');
        opt.value = ""; 
        opt.appendChild( document.createTextNode(selection.toUpperCase()) );
        elemSites.appendChild(opt); 
        
        this.getRegionImages(this.jMap[selection]);
        const showAlignment = this.createSearchLimitations();
        for (let key in this.jMap[selection].sites)
        {
            opt = document.createElement('option');
            opt.appendChild(document.createTextNode(key));
            opt.value = key; 
            elemSites.appendChild(opt); 
            
            this.getSiteImages(this.jMap[selection].sites[key], showAlignment);
        }
        
        this.fillSiteList();
    }

    fillSiteList()
    {
        const jTarget = super.fillSiteList();
        if (jTarget === null)
            return;

        const pThis = this;
        ArrayList(jTarget).find("img").each( (ee) => ee.onclick = function(e)
        {
            const sCode = e.target.getAttribute("data-code") || "";
            const sLocationType = e.target.getAttribute("data-location-type") || "";
            
            if (!this.denyRegionClick || "location" !== sLocationType)
                pThis.onSideCardClick(sCode, sLocationType);
        });
        
        ArrayList(jTarget).find("img").each((_el) => pThis.CardPreview.initMapViewCard(_el));

        /** lazy load images */
        MapViewRegionsMovement.lazyloadImages();
    }

    onSideCardClick(sCode, sLocationType)
    {
        if (sLocationType === "site")
            this.setTargetSite(sCode);
        else if (sLocationType === "location")
            this.addRegionLocation(sCode);
    }

    setTargetSite(sSiteCode)
    {
        const jRegion = this.getRegionBySiteCode(sSiteCode);
        const jSite = this.getSiteByCode(sSiteCode);
        
        DomUtils.empty(MapViewRegionsMovement._MovementContainerTargetSite());
        DomUtils.empty(MapViewRegionsMovement._MovementContainerTargetRegion());

        MapViewRegionsMovement._MovementContainerTargetSite().appendChild(this.createImage(jSite["code"], true));
        MapViewRegionsMovement._MovementContainerTargetRegion().appendChild(this.createImage(jRegion["code"], false));
        
        ArrayList(MapViewRegionsMovement._MovementContainerTargetSite()).find("img").each((_e) => this.CardPreview.initMapViewCard(_e));
        ArrayList(MapViewRegionsMovement._MovementContainerTargetRegion()).find("img").each((_e) => this.CardPreview.initMapViewCard(_e));

        /** lazy load images */
        MapViewRegionsMovement.lazyloadImages();
    }
    
    addRegionLocation(sRegionCode)
    {
        const jRegion = this.getRegionByCode(sRegionCode);
        if (jRegion === null)
        {
            console.log("Cannot find region by its code " + sRegionCode);
            return;
        }
        
        var jElem = MapViewRegionsMovement._MovementContainerOtherRegions().querySelector("[data-code='" + sRegionCode + "']"); 
        if (jElem !== null)
        {
            console.log("Allready there " + sRegionCode);
            return;
        }
        
        MapViewRegionsMovement._MovementContainerOtherRegions().appendChild(this.createImage(sRegionCode, false));
        jElem = MapViewRegionsMovement._MovementContainerOtherRegions().querySelector("[data-code='" + sRegionCode + "']"); 
        jElem.setAttribute("title", "Click to remove");
        
        this.CardPreview.initMapViewCard(jElem);
        jElem.onclick = (e) => DomUtils.removeNode(e.target);

        /** lazy load images */
        MapViewRegionsMovement.lazyloadImages();
    }

    createInstance(sStartSiteCode)
    {
        DomUtils.removeNode(document.getElementById("map_view_layer_loading"));    
        document.querySelector(".map_view_layer").classList.remove("hide");

        if (!super.createInstance())
            return false;

        document.getElementById("movement_accept").onclick = this.onAcceptMovement.bind(this);
        document.getElementById("movement_cancel").onclick = this.onCancelMovement.bind(this);    

        this.loadExistingMarker(this.jMap);
        this.showRegionMarker();

        this.onChooseLocationMovement(sStartSiteCode);
        this.setStartingSite(sStartSiteCode);
        return true;
    }

    /**
     * Open map view to allow for complex movement
     * @param {String} sStartSiteCode Start Location
     * @return {void}
     */
    onChooseLocationMovement(sStartSiteCode)
    {
        if (sStartSiteCode === undefined)
            sStartSiteCode = "";

        if (!this.loadMovementList(sStartSiteCode))
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Cannot load movement map" }));
            return;
        }

        this.denyRegionClick = false;
    }

    loadMovementList(sStartLocationCode)
    {
        DomUtils.empty(document.getElementById("site_movement").querySelector("div.site-list"));
        document.getElementById("site_movement").classList.add("hide");

        if (sStartLocationCode === "")
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
        DomUtils.empty(MapViewRegionsMovement._MovementContainer().querySelector(".site-list"));

        MapViewRegionsMovement._MovementContainerStartSite().appendChild(this.createImage(jSiteStart["code"], true));
        MapViewRegionsMovement._MovementContainerStartRegion().appendChild(this.createImage(jRegionStart["code"], false));

        const pThis = this;
        ArrayList(MapViewRegionsMovement._MovementContainerStartSite()).find("img").each((_e) => pThis.CardPreview.initMapViewCard(_e));
        ArrayList(MapViewRegionsMovement._MovementContainerStartRegion()).find("img").each((_e) => pThis.CardPreview.initMapViewCard(_e));
        
        MapViewRegionsMovement._MovementContainer().classList.remove("hide");

        /** lazy load images */
        MapViewRegionsMovement.lazyloadImages();
    }
}
