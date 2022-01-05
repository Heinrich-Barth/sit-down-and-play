/**
 * Add region marker and add site layers per region.
 * If a region is clied, the sites in it will be shown in a list
 * and if a site is clicked, it will be added to the movement
 */
class MapViewRegions extends MapViewCards {

    constructor(images)
    {
        super(images, "regions");

        this.MARKER = {
            region : null,
            free : null,
            border : null,
            dark : null,
            ruins : null,
            shadow : null,
            any : null,
            darkhaven : null,
            elfhold : null,
            haven : null,
            lordhaven : null,
            wizardhaven : null,
            pos_start : null,
            pos_end : null
        };

        this.jMarkerRegions = {};
        this.jMarkerSites = {};
        this.jMarkerUnderdeeps = {};

        this.activeRegion = "";
        this.vsVisibleSites = [];
        this.vsVisibleUnderdeeps = [];
    }

    fireRegionClick(sRegionTitle)
    {
        if (sRegionTitle !== "" && typeof this.jMarkerRegions[sRegionTitle] !== "undefined")
            this.jMarkerRegions[sRegionTitle].fire('click');
    }



    getStartupLat()
    {
        return 77.29788306692042;
    }

    getStartLon()
    {
        return -107.138671875;
    }

    createInstance()
    {
        let LeafIconPosition = L.Icon.extend(
        {
            options: 
            {
                shadowUrl: "/media/assets/leaflet/leaflet-images/leaf-shadow.png",
                iconSize:     [38, 95],
                shadowSize:   [50, 64],
                iconAnchor:   [22, 94],
                shadowAnchor: [4, 62],
                popupAnchor:  [-3, -76]
            }
        });
        
        this.MARKER.pos_start = new LeafIconPosition({iconUrl: '/media/assets/leaflet/leaflet-images/leaf-green.png'});
        this.MARKER.pos_end = new LeafIconPosition({iconUrl: '/media/assets/leaflet/leaflet-images/leaf-red.png'});

        let LeafIcon = L.Icon.extend(
        {
            options: 
            {
                iconUrl: "",
                shadowUrl: '/media/assets/leaflet/leaflet-images/marker-shadow.png',
                iconSize:     [25, 41], // size of the icon
                shadowSize:   [41, 41], // size of the shadow
                iconAnchor:   [24, 41], // point of the icon which will correspond to marker's location
                shadowAnchor: [24, 24],  // the same for the shadow
                popupAnchor:  [-3, -41] // point from which the popup should open relative to the iconAnchor
            }
        });
        
        this.MARKER.region = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-red.png"});
        this.MARKER.free = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-free.png"});
        this.MARKER.border = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-border.png"});
        this.MARKER.dark = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-dark.png"});
        this.MARKER.ruins = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-ruins.png"});
        this.MARKER.shadow = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-shadow.png"});

        return super.createInstance();
    }

    destroyMarker(jMarkers)
    {
        const pMap = this.getMapInstance();
        if (pMap === null || jMarkers === undefined)
            return;

        for (let key in jMarkers)
        {
            if (pMap.hasLayer(jMarkers[key]))
                pMap.removeLayer(jMarkers[key]);

            delete jMarkers[key];
        }
    }

    destroy()
    {
        this.destroyMarker(this.jMarkerRegions);
        this.destroyMarker(this.jMarkerSites);
        this.destroyMarker(this.jMarkerUnderdeeps);

        this.jMarkerRegions = {};
        this.jMarkerSites = {};
        this.jMarkerUnderdeeps = {};      
        
        super.destroy();
    }

    showRegionMarker()
    {
        const pThis = this;
        for (let key in this.jMarkerRegions)
        {
            let _marker = this.jMarkerRegions[key];
            
            _marker.off('click', (e) => pThis.onRegionClick(e.target.region));
            _marker.on('click', (e) => pThis.onRegionClick(e.target.region));
            
            _marker.addTo(this.getMapInstance());
        }
    }

    /**
     * Load existing markers from the map json and create instances
     * to be shown on the map 
     * 
     * @param jMap Map
     */
    loadExistingMarker(jMap)
    {
        let _region;
        for (let key in jMap)
        {
            _region = jMap[key];
            if (typeof _region.area === "undefined")
                continue;
                
            if (_region.area.length === 2)
                this.createMarker(key, "", _region.area[0], _region.area[1], _region, false);
                
            for (let _site in jMap[key].sites)
            {
                _region = jMap[key].sites[_site];
                if (_region.area.length === 2)
                    this.createMarker(key, _site, _region.area[0], _region.area[1], _region, true);
            }
        }
    }

    showSitesInRegion (regionCode)
    {
        this.activeRegion = regionCode;
        
        if (typeof this.jMarkerSites[regionCode] === "undefined")
            return;

        let vsList = [];
        let _jSite, _show;
        let jSites = this.jMarkerSites[regionCode];
        for (let key in jSites)
        {
            _show = false;
            _jSite = this.jMap[regionCode].sites[key];
            jSites[key].addTo(this.instanceLeafletjsMap);
            vsList.push(key);
        }

        this.vsVisibleSites = vsList;
        
        vsList = [];
        jSites = this.jMarkerUnderdeeps[regionCode];
        for (let key in jSites)
        {
            jSites[key].addTo(this.instanceLeafletjsMap);
            vsList.push(key);
        }

        this.vsVisibleUnderdeeps = vsList;
    }

    onRegionClick(regionCode)
    {
        if (regionCode === undefined || regionCode === "" || this.activeRegion === regionCode)
            return;
        
        this.hideVisibleSites();
        this.showSitesInRegion(regionCode);
    }

    hideVisibleSites()
    {
        if ((this.vsVisibleUnderdeeps.length === 0 && this.vsVisibleSites.length === 0) || this.activeRegion === "")
            return;
        
        const regionCode = this.activeRegion;
        if (typeof this.jMarkerSites[regionCode] === "undefined")
            return;

        let list = this.vsVisibleSites;
        let jRegion = this.jMarkerSites[regionCode];
        for (let _elem of  list)
            jRegion[_elem].remove();
        
        list = this.vsVisibleUnderdeeps;
        jRegion = this.jMarkerUnderdeeps[regionCode];
        for (let _elem of list)
            jRegion[_elem].remove();

        this.vsVisibleSites = [];
        this.vsVisibleUnderdeeps = [];
    }

    _createMarker(markerText, lat, lon, _marker, sSiteTitle)
    {
        let elem;
        if (_marker !== null)
            elem = L.marker([lat,lon], {icon: _marker});
        else
            elem = L.marker([lat,lon]);
        
        elem.bindPopup(markerText);
        elem.on('mouseover', function (e) 
        {
            this.openPopup();
        });
        
        elem.on('mouseout', function (e) 
        {
            this.closePopup();
        });
        
        if (sSiteTitle !== "")
        {
            const pThis = this;
            elem.on('click', function (e) 
            {
                pThis.onSiteMarkerClick(sSiteTitle);
                pThis.flyTo(e);
            });
        }
        
        return elem;
    }

    onSiteMarkerClick(sTitle)
    {
        ArrayList(document.getElementById("found_sites")).find("img").each(function(el)
        {
            if (el.getAttribute("data-location-type") === "location")
                return;
            
            const _code = el.getAttribute("data-code");
            if (_code !== null && _code.startsWith(sTitle))
                el.classList.remove("hide");
            else
                el.classList.add("hide");
        });
    }

    getTargetMakerJson(region, site, jSiteCard)
    {
        // region marker
        if (site === "" || jSiteCard === null)
            return this.jMarkerRegions;

        const isUnderdeep = jSiteCard === null || typeof jSiteCard["underdeep"] === "undefined" ? false : jSiteCard.underdeep;
        if (isUnderdeep)
        {
            if (typeof this.jMarkerUnderdeeps[region] === "undefined")
                this.jMarkerUnderdeeps[region] = {};
            
            return this.jMarkerUnderdeeps[region];
        }
        else
        {
            if (typeof this.jMarkerSites[region] === "undefined")
                this.jMarkerSites[region] = {};
            
            return this.jMarkerSites[region];
        }
    }
    
    onClickRegionMarker(e)
    {
        this.onRegionClick(e.target.region);
        this.flyTo(e);
    }

    createMarker(region, site, lat, lon, jSiteCard, isSiteCard)
    {              
        let jMarkers = this.getTargetMakerJson(region, site, jSiteCard);

        const id = site === "" ? region : site;
        if (typeof jMarkers[id] !== "undefined")
        {
            if (this.instanceLeafletjsMap.hasLayer(jMarkers[id]))
            {
                this.instanceLeafletjsMap.removeLayer(jMarkers[id]);
                delete jMarkers[id];
            }
        }
        
        let _marker = null;
        if (site === "")
        {
            _marker = this.MARKER.region;
            this.jMap[region].area = [lat,lon];
        }
        else
        {
            this.jMap[region].sites[site].area = [lat,lon];
            _marker = this.getSiteHoldMarker(this.jMap[region].sites[site]);
        }

        const markerText = MapViewRegions.getPlayableText(region, site, isSiteCard);
        let elem = this._createMarker(markerText, lat, lon, _marker, site, region)
        
        elem.region = region;
        if (site !== "")
            elem.site = site;

        jMarkers[id] = elem;
        return jMarkers[id];
    }

    static getPlayableText(regionTitle, siteTitle, isSiteCard)
    {
        if (isSiteCard)
            return `<b>${siteTitle}</b>`;
        else
            return `<b>${regionTitle}</b>`;
    }

    setStartingSite(sStartSiteCode)
    {
        const jRegion = this.getRegionBySiteCode(sStartSiteCode);
        const sRegionTitle = jRegion !== null ? jRegion.title : "";
        
        this.fireRegionClick(sRegionTitle);
    }

    getSiteHoldMarkerByHold(jSite)
    {
        let sCode = null;
        if (typeof jSite.hero !== "undefined")
            sCode = jSite.hero.hold;
        else if (typeof jSite.minion !== "undefined")
            sCode = jSite.minion.hold;
        else if (typeof jSite.balrog !== "undefined")
            sCode = jSite.balrog.hold;

        return sCode === null || typeof sCode === "undefined" ? null : sCode;
    }

    getSiteHoldMarker(jSite)
    {
        const sCode = this.getSiteHoldMarkerByHold(jSite);
        switch(sCode)
        {
            case "Border-hold":
                return this.MARKER.border;
                
            case "Dark-hold":
                return this.MARKER.dark;
                
            case "Free-hold": 
                return this.MARKER.free;
                
            case "Ruins & Lairs":
                return this.MARKER.ruins;
                
            case "Shadow-hold": 
                return this.MARKER.shadow;

            case "Darkhaven": 
            case "Elf-hold":
            case "Haven": 
            case "Lordhaven": 
            case "Wizardhaven":
            default:
                break;
        }
        
        return null;
    }

    /**
     * Get a reggion by its site code
     * @param {String} sCode Site code
     */
     getRegionBySiteCode(sCode)
     {
         if (sCode === ""  || typeof this.jMapSiteRegion[sCode] === "undefined")
             return null;
         else
         {
             const sRegionCode = this.jMapSiteRegion[sCode];
             return this.jMap[sRegionCode];
         }
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
}

