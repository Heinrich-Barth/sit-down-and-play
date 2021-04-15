
const MapBuilder =
{
    _userDir: "/cards",
    
    CardList : null,
    CardPreview: null,
    jMap : {},
    jMapSiteRegion : {},
    jMarkerRegions : {},
    jMarkerSites : {},
    jMarkerUnderdeeps : {},
    
    instanceLeafletjsMap : null,
    clickZoomLevel : 5,
    minZoom: 3,
    maxZoom: 6,
    
    getAdditionalAlignKeys : function()
    { 
        return ["fallenwizard", "fallenlord", "lord", "grey", "dragonlord", "warlord", "elflord", "atanilord", "dwarflord"]; 
    },
    
    config : {
        hero : true,
        minion : true,
        balrog : false,
        fallenwizard : true,
        heavenOnly : false,
        minor : false,
        major : false,
        greater : false,
        information : false,
        rings : false,
        
        getHero() { return MapBuilder.config.hero; },
        getMinion() { return MapBuilder.config.minion; },
        getBalrog() { return MapBuilder.config.balrog; },
        getFallenWizard() { return MapBuilder.config.fallenwizard; }
    },
    
    updateConfig : function(bHero, bMinion, bBalrog, bFallenwizard)
    {
        MapBuilder.config.hero = true === bHero;
        MapBuilder.config.minion = true === bMinion;
        MapBuilder.config.balrog = true === bBalrog;
        MapBuilder.config.fallenwizard = true === bFallenwizard;
    },
    
    clearMarker : function()
    {
    },
    
    MARKER : {
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
    },
    
    getSiteHoldMarkerByHold : function(jSite)
    {
        var sCode = null;
        if (typeof jSite.hero !== "undefined")
            sCode = jSite.hero.hold;
        else if (typeof jSite.minion !== "undefined")
            sCode = jSite.minion.hold;
        else if (typeof jSite.balrog !== "undefined")
            sCode = jSite.balrog.hold;

        return sCode === null || typeof sCode === "undefined" ? null : sCode;
    },
    
    getSiteHoldMarker : function(jSite)
    {
        const sCode = this.getSiteHoldMarkerByHold(jSite);
        switch(sCode)
        {
            case "Border-hold":
                return MapBuilder.MARKER.border;
                
            case "Dark-hold":
                return MapBuilder.MARKER.dark;
                
            case "Free-hold": 
                return MapBuilder.MARKER.free;
                
            case "Ruins & Lairs":
                return MapBuilder.MARKER.ruins;
                
            case "Shadow-hold": 
                return MapBuilder.MARKER.shadow;

            case "Darkhaven": 
            case "Elf-hold":
            case "Haven": 
            case "Lordhaven": 
            case "Wizardhaven":
            default:
                break;
        }
        
        return null;
    },
    
    getPlayableText : function(regionTitle, siteTitle, jSiteCard, isSiteCard)
    {
        function getPlayable(title, jSite, sClass)
        {
            var sRes = title + " Site";
            var sPlayable = "";
            
            if (jSite.hoard === true)
                sRes += " (Hoard)";
            
            sRes += " [" + jSite.hold + "]";
            
            if (jSite.minor === true)
                sPlayable += "<br>Minor Items";

            if (jSite.major === true)
                sPlayable += "<br>Major Items";

            if (jSite.greater === true)
                sPlayable += "<br>Greater Items";

            if (jSite.rings === true)
                sPlayable += "<br>Gold Rings";

            if (jSite.information === true)
                sPlayable += "<br>Information";
                
            return "<td class=\"" + sClass + "\">"+sRes+"<br>"+sPlayable+"</td>";
        }
        
        function createResult(title, isUnderdeep, hero, minion, balrog)
        {
            var sHtml = "<b>" + title + "</b>" + (isUnderdeep ? " (Underdeep)" : "") + "<br>";
            return sHtml + "<table class=\"site_leaflet\"><tr valign=\"top\">" + hero + minion + balrog + "</tr></table>";
        }
        
        function createAlignText(jSiteCard)
        {
            return {
                hero : !MapBuilder.config.hero || jSiteCard === null || typeof jSiteCard.hero === "undefined" ? "" : getPlayable("Heros", jSiteCard.hero, "td_hero"),
                minion : !MapBuilder.config.minion || jSiteCard === null || typeof jSiteCard.minion === "undefined" ? "" : getPlayable("Minion", jSiteCard.minion, "td_minion"),
                balrog : !MapBuilder.config.balrog || jSiteCard === null || typeof jSiteCard.balrog === "undefined" ? "" : getPlayable("Balrog", jSiteCard.balrog, "td_balrog"),
                isUnderdeep : jSiteCard === null || typeof jSiteCard["underdeep"] === "undefined" ? false : jSiteCard.underdeep
            };
        }
        
        if (isSiteCard)
        {        
            var res = createAlignText(jSiteCard);
            return createResult(siteTitle, res.isUnderdeep, res.hero, res.minion, res.balrog);
        }
        else
        {
            var type = typeof jSiteCard["region_type"] === "undefined" ? "" : " (" + jSiteCard["region_type"] + ")";
            var title = regionTitle + type;
            return createResult(title, false, "", "", "");    
        }
    },
    
    getTargetMakerJson : function(region, site, jSiteCard)
    {
        // region marker
        if (site === "" || jSiteCard === null)
            return MapBuilder.jMarkerRegions;

        const isUnderdeep = jSiteCard === null || typeof jSiteCard["underdeep"] === "undefined" ? false : jSiteCard.underdeep;
        if (isUnderdeep)
        {
            if (typeof MapBuilder.jMarkerUnderdeeps[region] === "undefined")
                MapBuilder.jMarkerUnderdeeps[region] = {};
            
            return MapBuilder.jMarkerUnderdeeps[region];
        }
        else
        {
            if (typeof MapBuilder.jMarkerSites[region] === "undefined")
                MapBuilder.jMarkerSites[region] = {};
            
            return MapBuilder.jMarkerSites[region];
        }
    },
    
    /**
     * Create a leafletjs marker and stores it in the target json
     * 
     * @param region Region Code
     * @param site Site Title
     * @param lat Latitude
     * @param lon Longitude
     * @param jSiteCard Json Card (either site or region)
     * @return Marker Instance
     */
    createMarker : function(region, site, lat, lon, jSiteCard, isSiteCard)
    {      
        function createMarker(markerText, lat,lon, _marker, sSiteTitle)
        {
            var elem;
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
                elem.on('click', function (e) 
                {
                    MapBuilder.events.onSiteMarkerClick(sSiteTitle);
                    MapBuilder.instanceLeafletjsMap.flyTo([e.target._latlng.lat, e.target._latlng.lng], MapBuilder.clickZoomLevel);
                });
            }

            elem.region = region;

            if (site !== "")
                elem.site = site;

            return elem;
        }
        
        var jMarkers = this.getTargetMakerJson(region, site, jSiteCard);

        const id = site === "" ? region : site;
        if (typeof jMarkers[id] !== "undefined")
        {
            if (this.instanceLeafletjsMap.hasLayer(jMarkers[id]))
            {
                this.instanceLeafletjsMap.removeLayer(jMarkers[id]);
                delete jMarkers[id];
            }
        }
        
        var _marker = null;
        if (site === "")
        {
            _marker = MapBuilder.MARKER.region;
            this.jMap[region].area = [lat,lon];
        }
        else
        {
            this.jMap[region].sites[site].area = [lat,lon];
            _marker = this.getSiteHoldMarker(this.jMap[region].sites[site]);
        }

        var markerText = this.getPlayableText(region, site, jSiteCard, isSiteCard);
        jMarkers[id] = createMarker(markerText, lat, lon, _marker, site);
        return jMarkers[id];
    },
    
    /**
     * Get the site card based on the codes provided
     * @param regionCode Region Code
     * @param siteCode Site Code
     * @return json or null
     */
    getRegionCard : function(regionCode)
    {
        if (regionCode === "" || typeof this.jMap[regionCode] === "undefined")
            return null;
        else
            return this.jMap[regionCode];
    },
    
    /**
     * Get the site card based on the codes provided
     * @param regionCode Region Code
     * @param siteCode Site Code
     * @return json or null
     */
    getSiteCard : function(regionCode, siteCode)
    {
        if (siteCode === "" || typeof this.jMap[regionCode] === "undefined")
            return null;
        
        var _region = this.jMap[regionCode];
        if (typeof _region.sites[siteCode] === "undefined")
            return null;
        else
            return _region.sites[siteCode];
    },
    
    /**
     * Get a site by its code
     * @param {String} sCode Site code
     * @return {MapBuilder@arr;jMap@arr;sites|MapBuilder.getSiteByCode._site} json or NULL
     */
    getSiteByCode : function(sCode)
    {
        var _keys = MapBuilder.getAdditionalAlignKeys();
        var _site;
        for (var key in this.jMap)
        {
            for (var _siteKey in this.jMap[key].sites)
            {
                _site = this.jMap[key].sites[_siteKey];
                if (typeof _site.hero !== "undefined" && _site.hero["code"] === sCode)
                    return _site.hero;
                else if (typeof _site.minion !== "undefined" && _site.minion["code"] === sCode)
                    return _site.minion;
                else if (typeof _site.balrog !== "undefined" && _site.balrog["code"] === sCode)
                    return _site.balrog;

                for(var i = 0; i < _keys.length; i++)
                {
                    if (typeof _site[_keys[i]] !== "undefined" && _site[_keys[i]]["code"] === sCode)
                        return _site[_keys[i]];
                }
            }
        }
        
        return null;
    },
    
    
    /**
     * Get a reggion by its site code
     * @param {String} sCode Site code
     * @return {MapBuilder@arr;jMap@arr;sites|MapBuilder.getSiteByCode._site} json or NULL
     */
    getRegionBySiteCode : function(sCode)
    {
        if (typeof MapBuilder.jMapSiteRegion[sCode] === "undefined")
            return null;
        else
        {
            const sRegionCode = MapBuilder.jMapSiteRegion[sCode];
            return MapBuilder.jMap[sRegionCode];
        }
    },
    
    /**
     * Get the Region json by given code
     * @param {String} sRegionCode
     * @return {json} json or null
     */
    getRegionByCode : function(sRegionCode)
    {
        var _region;
        for (var key in this.jMap)
        {
            _region = this.jMap[key];
            if (_region.code === sRegionCode)
                return _region;
        }
        
        return null;
    },
    
    /**
     * Load existing markers from the map json and create instances
     * to be shown on the map 
     * 
     * @param jMap Map
     */
    loadExistingMarker : function(jMap)
    {
        var _region;
        for (var key in jMap)
        {
            _region = jMap[key];
            if (typeof _region.area === "undefined")
                continue;
                
            if (_region.area.length === 2)
                this.createMarker(key, "", _region.area[0], _region.area[1], _region, false);
                
            for (var _site in jMap[key].sites)
            {
                _region = jMap[key].sites[_site];
                if (_region.area.length === 2)
                    this.createMarker(key, _site, _region.area[0], _region.area[1], _region, true);
            }
        }

    },
    
    onReady : function()
    {
        // callback function for map creator tool
    },
    
    
    onCreate : function(data)
    {
    },
    
    factory : 
    {
        /**
        * Create all position marker
        */
        createPositionMarker : function()
        {
            var LeafIconPosition = L.Icon.extend(
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
            
            MapBuilder.MARKER.pos_start = new LeafIconPosition({iconUrl: '/media/assets/leaflet/leaflet-images/leaf-green.png'});
            MapBuilder.MARKER.pos_end = new LeafIconPosition({iconUrl: '/media/assets/leaflet/leaflet-images/leaf-red.png'});
    
            var LeafIcon = L.Icon.extend(
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
            
            MapBuilder.MARKER.region = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-red.png"});
            MapBuilder.MARKER.free = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-free.png"});
            MapBuilder.MARKER.border = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-border.png"});
            MapBuilder.MARKER.dark = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-dark.png"});
            MapBuilder.MARKER.ruins = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-ruins.png"});
            MapBuilder.MARKER.shadow = new LeafIcon({iconUrl: "/media/assets/leaflet/leaflet-images/marker-icon-shadow.png"});
        },
        
        createMapInstance : function()
        {
            const map = L.map('map', 
            {
                minZoom: MapBuilder.minZoom,
                maxZoom: MapBuilder.maxZoom,
                dragging: true
            });

            let lat = 77.29788306692042;
            let lng = -107.138671875;

            let nZoom = MapBuilder.maxZoom - (window.location.search.indexOf("fullscreen=") === -1 ? 2 :  1);
            
            L.tileLayer('/media/maps/regions/{z}/tile_{x}_{y}.jpg').addTo(map);
            map.setView(L.latLng(lat, lng), nZoom);
            
            return map;
        },
        
        create : function(jMap, sImageCDNUrl)
        {           
            MapBuilder.CardPreview = CardPreview;
            MapBuilder.CardList = new CardList(jMap.images, null, true, false, sImageCDNUrl);
            MapBuilder.factory.doCreate(jMap.map);
        },
        
        destroy : function()
        {
            if (MapBuilder.instanceLeafletjsMap !== null)
            {
                
                MapBuilder.instanceLeafletjsMap.eachLayer(function (layer) 
                {
                    MapBuilder.instanceLeafletjsMap.removeLayer(layer);
                });

                MapBuilder.factory.destroyMarker(MapBuilder.jMarkerRegions);
                MapBuilder.factory.destroyMarker(MapBuilder.jMarkerSites);
                MapBuilder.factory.destroyMarker(MapBuilder.jMarkerUnderdeeps);

                MapBuilder.jMarkerRegions = {};
                MapBuilder.jMarkerSites = {};
                MapBuilder.jMarkerUnderdeeps = {};
   
                MapBuilder.instanceLeafletjsMap.remove();
                MapBuilder.instanceLeafletjsMap = null;
            }
            
            MapBuilder.events.onDestroy();
            MapBuilder.clearMarker();
        },
        
        destroyMarker : function(jMarkers)
        {
            for (var key in jMarkers)
            {
                if (MapBuilder.instanceLeafletjsMap.hasLayer(jMarkers[key]))
                    MapBuilder.instanceLeafletjsMap.removeLayer(jMarkers[key]);

                delete jMarkers[key];
            }
        },
        
        buildMap : function()
        {
            //this.destroy();

            /**
             * create leafletjs map instance
             */

            MapBuilder.instanceLeafletjsMap = MapBuilder.factory.createMapInstance();

            /**
             * show marker
             */
            MapBuilder.loadExistingMarker(MapBuilder.jMap);

            /**
             * Only show the region marker
             */
            MapBuilder.showRegionMarker();
            
            /**
             * allow callback
             */
            MapBuilder.onReady();
        },
        
        createSiteCodeRegionList : function(jMap)
        {
            MapBuilder.jMapSiteRegion = {};
            
            var _keys = MapBuilder.getAdditionalAlignKeys();
            var _region;
            var _regionCode = "";
            
            for (var key in jMap)
            {
                _region = jMap[key];
                if (typeof _region.area === "undefined")
                    continue;

                _regionCode = key;
                for (var _site in jMap[key].sites)
                {
                    _region = jMap[key].sites[_site];
                    
                    if (typeof _region.hero !== "undefined")
                       MapBuilder.jMapSiteRegion[_region.hero.code] = _regionCode;
                    if (typeof _region.minion !== "undefined")
                       MapBuilder.jMapSiteRegion[_region.minion.code] = _regionCode;
                    if (typeof _region.balrog !== "undefined")
                       MapBuilder.jMapSiteRegion[_region.balrog.code] = _regionCode;
                    
                    for(var i = 0; i < _keys.length; i++)
                    {
                        if (typeof _region[_keys[i]] !== "undefined")
                            MapBuilder.jMapSiteRegion[_region[_keys[i]].code] = _regionCode;
                    }
                }
            }
        },
    
        /**
         * Create a new Instance of the map
         */
        doCreate : function(jMap)
        {
            /**
             * load map data
             */
            MapBuilder.jMap = jMap;
            
            this.createSiteCodeRegionList(jMap);

            /**
             * create position marker
             */
            MapBuilder.factory.createPositionMarker();

           // MapBuilder.factory.buildMap();
            
            jQuery("#movement_accept").click(MapBuilder.events.onAccept);
            jQuery("#movement_cancel").click(MapBuilder.events.onCancel);
        }
    },
        
    onClickRegionMarker : function(e)
    {
        MapBuilder.events.onRegionClick(e.target.region);
        MapBuilder.instanceLeafletjsMap.flyTo([e.target._latlng.lat, e.target._latlng.lng], MapBuilder.clickZoomLevel);
    },
    
    showRegionMarker : function()
    {
        var _marker;
        for (var key in this.jMarkerRegions)
        {
            _marker = this.jMarkerRegions[key];
            _marker.off('click');
            _marker.on('click', MapBuilder.onClickRegionMarker);            
            _marker.addTo(MapBuilder.instanceLeafletjsMap);
        }
    },
    
    allowSite : function(jSite)
    {
        if (MapBuilder.config.minor && !jSite["minor"])
            return false;
        else if (MapBuilder.config.major && !jSite["major"])
            return false;
        else if (MapBuilder.config.greater && !jSite["greater"])
            return false;
        else if (MapBuilder.config.rings && !jSite["rings"])
            return false;
        else if (MapBuilder.config.information && !jSite["information"])
            return false;
        
        return true;
    },
    
    events : {
        
        denyRegionClick : true,
        activeRegion : "",
        vsVisibleSites : [],
        vsVisibleUnderdeeps : [],
        
        onRegionClick : function(regionCode)
        {
            if (MapBuilder.activeRegion === regionCode)
                return;
            
            this.hideVisibleSites();
            this.showSitesInRegion(regionCode);
            
            this.onRegionClickCallback(regionCode);
        },
        
        onSiteMarkerClick : function(sSiteTitle)
        {
            MapCreator.scrollToCardInList(sSiteTitle);
        },
        
        hideVisibleSites : function()
        {
            if ((this.vsVisibleUnderdeeps.length === 0 && this.vsVisibleSites.length === 0) || this.activeRegion === "")
                return;
            
            var regionCode = this.activeRegion;
            if (typeof MapBuilder.jMarkerSites[regionCode] === "undefined")
                return;

            var list;

            list = this.vsVisibleSites;
            var jRegion = MapBuilder.jMarkerSites[regionCode];
            for (var i = 0; i < list.length; i++)
                jRegion[list[i]].remove();
            
            list = this.vsVisibleUnderdeeps;
            var jRegion = MapBuilder.jMarkerUnderdeeps[regionCode];
            for (var i = 0; i < list.length; i++)
                jRegion[list[i]].remove();

            this.vsVisibleSites = [];
            this.vsVisibleUnderdeeps = [];
        },
        
        showSitesInRegion : function(regionCode)
        {
            this.activeRegion = regionCode;
            
            if (typeof MapBuilder.jMarkerSites[regionCode] === "undefined")
                return;

            var vsList;
            
            vsList = [];
            var _jSite, _show;
            var jSites = MapBuilder.jMarkerSites[regionCode];
            for (var key in jSites)
            {
                _show = false;
                _jSite = MapBuilder.jMap[regionCode].sites[key];
                
                if (MapBuilder.config.hero && typeof _jSite.hero !== "undefined")
                    _show = _show || MapBuilder.allowSite(_jSite.hero);
                if (MapBuilder.config.minion && typeof _jSite.minion !== "undefined")
                    _show = _show || MapBuilder.allowSite(_jSite.minion);
                if (MapBuilder.config.fallenwizard && typeof _jSite.fallenwizard !== "undefined")
                    _show = _show || MapBuilder.allowSite(_jSite.fallenwizard);
                if (MapBuilder.config.balrog && typeof _jSite.balrog !== "undefined")
                    _show = _show || MapBuilder.allowSite(_jSite.balrog);

                if (_show)
                {
                    jSites[key].addTo(MapBuilder.instanceLeafletjsMap);
                    vsList.push(key);
                }
            }
            this.vsVisibleSites = vsList;
            
            vsList = [];
            jSites = MapBuilder.jMarkerUnderdeeps[regionCode];
            for (var key in jSites)
            {
                jSites[key].addTo(MapBuilder.instanceLeafletjsMap);
                vsList.push(key);
            }
            this.vsVisibleUnderdeeps = vsList;
            
        },
        
        onDestroy : function()
        {
        },
        
        onRegionClickCallback : function(regionCode)
        {
        },
        
        onAccept : function()
        {
            const jRes = MapCreator.getMovementSites();
            if (jRes.target === "")
                return;

            if (MapBuilder.events.onCallback !== null)
                MapBuilder.events.onCallback(jRes.start, jRes.regions, jRes.target);
            
            MapBuilder.factory.destroy();
        },
        
        onCancel : function()
        {
            MapBuilder.factory.destroy();
            
            if (MapBuilder.events.onCancelCallback !== null)
                MapBuilder.events.onCancelCallback();
        },
        
        onCancelCallback : null,
        onSideCardClick : null,
        onCallback : null
    },
    
    loadMovementList : function(sStartLocationCode)
    {
        emptyChildren(jQuery("#site_movement div.site-list"));
        jQuery("#site_movement").addClass("hide");

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
        
        MapCreator.setupMovementList(jRegion, jSite);
        return true;
    },
    
    /**
     * Open this mapview to simply select a starting position
     * 
     * @param {function} funcCallback Callback on site click
     * @return {void}
     */
    onChooseLocationStart : function(funcCallback)
    {
        MapBuilder.events.onDestroy = function() { emptyChildren(jQuery("#found_sites")); };
        if (!MapBuilder.loadMovementList(""))
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Cannot load start map" }));
            return;
        }
        
        this.onChooseLocationGeneric(funcCallback);

        MapBuilder.events.onDestroy = function()
        {
            jQuery(".map_view_layer").addClass("hide");
        };
    },
    
    onChooseLocationGeneric : function(funcCallback)
    {
        jQuery(".map_view_layer").removeClass("hide");
        emptyChildren(jQuery("#found_sites"));
        MapBuilder.factory.buildMap();
        MapBuilder.events.onSideCardClick = funcCallback;
    },
    
    /**
     * Open map view to allow for complex movement
     * @param {String} sStartSiteCode Start Location
     * @param {function} funcCallback Callback
     * @return {void}
     */
    onChooseLocationMovement : function(sStartSiteCode, funcCallback, funcCancel)
    {
        MapBuilder.events.onDestroy = function() { };
        if (!MapBuilder.loadMovementList(sStartSiteCode))
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Cannot load movement map" }));
            return;
        }

        this.onChooseLocationGeneric(funcCallback);

        MapBuilder.events.onSideCardClick = MapBuilder.onClickMovement; //funcCallback;
        MapBuilder.events.onCallback = funcCallback;
        MapBuilder.events.onCancelCallback = funcCancel;
        MapBuilder.events.denyRegionClick = false;
        
        MapBuilder.events.onDestroy = function()
        {
            jQuery(".map_view_layer").addClass("hide");
            emptyChildren(jQuery("#found_sites"));
            emptyChildren(jQuery("#map"));
        };
        
        if (sStartSiteCode !== "")
        {
            var sRegionTitle = MapBuilder.jMapSiteRegion[sStartSiteCode];
            MapBuilder.jMarkerRegions[sRegionTitle].fire('click');
        }
    },
    
    onClickMovement : function(e, sCode, sLocationType)
    {
        if (sLocationType === "site")
        {
            MapCreator.setTargetSite(sCode);
        }
        else if (sLocationType === "location")
        {
            MapCreator.addRegionLocation(sCode);
        }
    }
    
    
};


const MapCreator = {
    
    onRegionClick : function(e)
    {
        MapBuilder.events.onRegionClick(e.target.region);
    },
    
    /**
    * Get the "site"
    * @return String
    */ 
    getCurrentSite : function()
    {
        var yourSelect = document.getElementById("sitelist");
        return yourSelect.options[ yourSelect.selectedIndex ].value;
    },
    
    showRegionMarker : function()
    {
        var _marker;
        for (var key in this.jMarkerRegions)
        {
            _marker = this.jMarkerRegions[key];
            
            _marker.off('click', MapCreator.onRegionClick);
            _marker.on('click', MapCreator.onRegionClick);
            
            _marker.addTo(MapBuilder.instanceLeafletjsMap);
        }
    },
    
    /**
     * Get the "region"
     * @return String
     */ 
    getCurrentRegion : function()
    {
        var yourSelect = document.getElementById("region");
        return yourSelect.options[ yourSelect.selectedIndex ].value;
    },

    _initDone : false,

    insertSearchTemplate : function()
    {
        if (jQuery(".mapchooser").length === 1)
            return;

        jQuery("body").append(`<div class="blue-box mapchooser hide">
            <form method="post" action="#">
                <div class="fields" style="margin: 0px;">

                    <div class="field">
                        <select id="region" name="region">
                            <option value="">Select Region</option>
                        </select>
                    </div>

                    <div class="field hide">
                        <select id="sitelist" name="region">
                            <option value="">Select Site</option>
                        </select>
                    </div>

                    <div class="field"><input type="text" name="card_text" id="card_text" placeholder="Search site/region title" /></div>

                    <div class="field padding10">
                        <h2>Alignment</h2>
                        <input type="checkbox" id="show_hero" name="hero" value="hero">
                        <label for="show_hero"><i class="fa fa-toggle-off" aria-hidden="true"></i> Hero Sites</label>

                        <input type="checkbox" id="show_minion" name="hero" value="hero">
                        <label for="show_minion"><i class="fa fa-toggle-off" aria-hidden="true"></i> Minion Sites</label>

                        <input type="checkbox" id="show_balrog" name="hero" value="hero">
                        <label for="show_balrog"><i class="fa fa-toggle-off" aria-hidden="true"></i> Balrog Sites</label>

                        <h2>Playable Items</h2>
                        <input type="checkbox" id="show_minor" name="hero" value="hero">
                        <label for="show_minor"><i class="fa fa-toggle-off" aria-hidden="true"></i> Minor</label>

                        <input type="checkbox" id="show_major" name="hero" value="hero">
                        <label for="show_major"><i class="fa fa-toggle-off" aria-hidden="true"></i> Major</label>

                        <input type="checkbox" id="show_greater" name="hero" value="hero">
                        <label for="show_greater"><i class="fa fa-toggle-off" aria-hidden="true"></i> Greater</label>

                        <input type="checkbox" id="show_rings" name="hero" value="hero">
                        <label for="show_rings"><i class="fa fa-toggle-off" aria-hidden="true"></i> Rings</label>

                        <input type="checkbox" id="show_info" name="hero" value="hero">
                        <label for="show_info"><i class="fa fa-toggle-off" aria-hidden="true"></i> Info</label>
                    </div>

                </div>
            </form>
        </div>`);

        document.getElementById("show_hero").onclick = function()
        {
            MapBuilder.config.hero = jQuery(this).is(':checked');
            MapCreator.updatePreference(jQuery(this));
        };
        
        
        document.getElementById("show_minion").onclick = function(e)
        {
            MapBuilder.config.minion = jQuery(this).is(':checked');
            MapCreator.updatePreference(jQuery(this));
        };
        
        
        document.getElementById("show_balrog").onclick = function(e)
        {
            MapBuilder.config.balrog = jQuery(this).is(':checked');
            MapCreator.updatePreference(jQuery(this));
        };

        document.getElementById("show_minor").onclick = function(e)
        {
            MapBuilder.config.minor = jQuery(this).is(':checked');
            MapCreator.updatePreference(jQuery(this));
        };
        
        document.getElementById("show_major").onclick = function(e)
        {
            MapBuilder.config.major = jQuery(this).is(':checked');
            MapCreator.updatePreference(jQuery(this));
        };
        document.getElementById("show_greater").onclick = function(e)
        {
            MapBuilder.config.greater = jQuery(this).is(':checked');
            MapCreator.updatePreference(jQuery(this));
        };
        document.getElementById("show_rings").onclick = function(e)
        {
            MapBuilder.config.rings = jQuery(this).is(':checked');
            MapCreator.updatePreference(jQuery(this));
        };
        document.getElementById("show_info").onclick = function(e)
        {
            MapBuilder.config.information = jQuery(this).is(':checked');
            MapCreator.updatePreference(jQuery(this));
        };

        jQuery(".map-search").get(0).onclick = function(e)
        {
            let jElem = jQuery(".mapchooser");
            if (jElem.hasClass("hide"))
                jElem.removeClass("hide");
            else
                jElem.addClass("hide");
        };

        if (MapBuilder.config.hero)
            jQuery(document.getElementById("show_hero")).click();

        if (MapBuilder.config.minion)
            jQuery(document.getElementById("show_minion")).click();

        if (MapBuilder.config.balrog)
            jQuery(document.getElementById("show_balrog")).click();      
    },
    
    init : function()
    {
        MapCreator.insertSearchTemplate();

        var jRegion = MapBuilder.jMap;
        
        var sel = document.getElementById('region');

        function appendOption(value, text)
        {
            var opt = document.createElement('option');
            opt.appendChild( document.createTextNode(text) );
            opt.value = value; 
            sel.appendChild(opt); 
        }
        
        // load regions
        var _region;
        var voRegions = jRegion;
        for (var key in voRegions)
        {
            _region = voRegions[key];
            
            var count = 0;
            for (var i in _region.sites)
                count++;
            
            if (count > 0)
                appendOption(key, _region.title + " (" + count + ")");
        }
        
        sel.onchange = function() 
        {
            var sRegionTitle = MapCreator.getCurrentRegion();
            if (sRegionTitle === "")
                return false;
            
            MapCreator.updateRegionSiteList(sRegionTitle);

            if (typeof MapBuilder.jMarkerRegions[sRegionTitle] !== "undefined" && !MapCreator.ignoreMarkerClickOnce)
                MapBuilder.jMarkerRegions[sRegionTitle].fire('click');
            
            MapCreator.ignoreMarkerClickOnce = false;
        };     
        
        var textBox = document.getElementById("card_text");
        textBox.onchange = MapCreator.onSearchByTitle;

        textBox.onkeypress = function (e)
        {
            if (e.which === 13)
            {
                e.preventDefault();
                MapCreator.onSearchByTitle();
                return false;
            }
        };
        
    },

    updatePreference : function(jElem)
    {
        let bIs = jElem.is(':checked');
        let jLabel = jElem.next().find("i");
        if (bIs)
        {
            jLabel.addClass("fa-toggle-on");
            jLabel.removeClass("fa-toggle-off");
        }
        else 
        {
            jLabel.addClass("fa-toggle-off");
            jLabel.removeClass("fa-toggle-on");
        }
    },
    
    onSearchByTitle : function()
    {
        var sText = document.getElementById("card_text").value.trim();
        if (sText.length < 3)
            return;

        for (var _region in MapBuilder.jMap)
        {
            if (_region.toLowerCase().indexOf(sText) > -1)
                MapCreator.getRegionImages(MapBuilder.jMap[_region]);

            for (var _site in MapBuilder.jMap[_region].sites)
            {
                if (_site.toLowerCase().indexOf(sText)  > -1)
                    MapCreator.getSiteImages(MapBuilder.jMap[_region].sites[_site]);
            }
        }

        MapCreator.fillSiteList();
    },
    
    getSiteImages : function(j)
    {
        function createEntry(jEntry)
        {
            return { set_code : jEntry["set_code"], image : jEntry["image"], code: jEntry["code"], site: true};
        }

        if (typeof this._temp === "undefined")
            this._temp = [];
        
        if (typeof j.hero !== "undefined" && MapBuilder.config.hero)
        {
            if (MapBuilder.allowSite(j.hero))
                this._temp.push(createEntry(j.hero));
        }
        if (typeof j.minion !== "undefined" && MapBuilder.config.minion)
        {
            if (MapBuilder.allowSite(j.minion))
                this._temp.push(createEntry(j.minion));
        }
        if (typeof j.balrog !== "undefined" && MapBuilder.config.balrog)
        {
            if (MapBuilder.allowSite(j.balrog))
                this._temp.push(createEntry(j.balrog));
        }
        
        let keys = MapBuilder.getAdditionalAlignKeys();
        var len = keys.length;
        for(var i = 0; i < len; i++)
        {
            if (typeof j[keys[i]] !== "undefined" && MapBuilder.allowSite(j[keys[i]]))
                this._temp.push(createEntry(j[keys[i]]));
        }
    },
    
    getRegionImages : function(j)
    {
        if (typeof this._temp === "undefined")
            this._temp = [];
        
        this._temp.push({ set_code : j["set_code"], image : j["image"], code: j["code"], site: false});            
    },
    
    updateRegionSiteList : function(selection)
    {
        var elemSites = document.getElementById("sitelist");
        elemSites.innerHTML = "";

        var len = elemSites.options.length - 1;
        for(var i = len; i >= 0; i--)
            elemSites.remove(i);
        
        var opt = document.createElement('option');
        opt.value = ""; 
        opt.appendChild( document.createTextNode(selection.toUpperCase()) );
        elemSites.appendChild(opt); 
        
        MapCreator.getRegionImages(MapBuilder.jMap[selection]);
            
        for (var key in MapBuilder.jMap[selection].sites)
        {
            opt = document.createElement('option');
            opt.appendChild(document.createTextNode(key));
            opt.value = key; 
            elemSites.appendChild(opt); 
            
            MapCreator.getSiteImages(MapBuilder.jMap[selection].sites[key]);
        }
        
        MapCreator.fillSiteList();
    },
    
    createImage : function(code, isSite)
    {
        const sType = isSite ? "site" : "location";
        const sTitle = this.removeQuotes(code) + " (" + sType + ")";
        const sUrl = isSite ? MapBuilder.CardList.getImageSite(code) : MapBuilder.CardList.getImageRegion(code);
        return `<img src="${sUrl}" data-code="${code}" data-location-type="${sType}" title="${sTitle}">`;
    },
    
    removeQuotes : function(sImage)
    {
        if (sImage.indexOf('"') === -1)
            return sImage;
        
        for (var i = 0; i < sImage; i++)
        {
            if (sImage[i] === '"')
                sImage[i] = "_";
        }
        
        return sImage;
    },
    
    
    getMovementSites : function()
    {
        var jRes = {
            start: this._MovementContainerStartSite().find("img").attr("data-code"),
            regions: [],
            target: ""
        };
        
        var jEnd = this._MovementContainerTargetSite().find("img");
        if (jEnd.length === 1)
            jRes.target = jEnd.attr("data-code");
        
        var jRegStart = this._MovementContainerStartRegion().find("img");
        if (jRegStart.length === 1)
            jRes.regions.push(jRegStart.attr("data-code"));
        
        this._MovementContainerOtherRegions().find("img").each(function()
        {
            var sCode = jQuery(this).attr("data-code");
            if (!jRes.regions.includes(sCode))
                jRes.regions.push(sCode);
        });
        
        var jRegEnd = this._MovementContainerTargetRegion().find("img");
        if (jRegEnd.length === 1)
        {
            var sCode = jRegEnd.attr("data-code");
            if (!jRes.regions.includes(sCode))
                jRes.regions.push(sCode);
        }
        
        return jRes;
    },
    
    _MovementContainer : function() { return jQuery("#site_movement"); },
    _MovementContainerStartSite : function() { return this._MovementContainer().find(".site_movement_start_site"); } ,
    _MovementContainerStartRegion : function() { return this._MovementContainer().find(".site_movement_start_region"); },

    _MovementContainerTargetRegion : function() { return this._MovementContainer().find(".site_movement_target_region"); },
    _MovementContainerTargetSite : function() { return this._MovementContainer().find(".site_movement_target_site"); },
    _MovementContainerOtherRegions : function() { return this._MovementContainer().find(".site_movement_other_region"); },

    
    _initContainers : function()
    {
    },
    
    setupMovementList : function(jRegionStart, jSiteStart)
    {
        this._initContainers();
        emptyChildren(this._MovementContainer().find(".site-list"));
        
        this._MovementContainerStartSite().append(MapCreator.createImage(jSiteStart["code"], true));
        this._MovementContainerStartRegion().append(MapCreator.createImage(jRegionStart["code"], false));

        this._MovementContainerStartSite().find("img").each(function()
        {
            MapBuilder.CardPreview.initMapViewCard(jQuery(this));
        });    
        
        this._MovementContainerStartRegion().find("img").each(function()
        {
            MapBuilder.CardPreview.initMapViewCard(jQuery(this));
        });    
        
        this._MovementContainer().removeClass("hide");
    },
    
    setTargetSite : function(sSiteCode)
    {
        const jRegion = MapBuilder.getRegionBySiteCode(sSiteCode);
        const jSite = MapBuilder.getSiteByCode(sSiteCode);
        
        emptyChildren(this._MovementContainerTargetSite());
        this._MovementContainerTargetSite().html(MapCreator.createImage(jSite["code"], true));

        emptyChildren(this._MovementContainerTargetRegion());
        this._MovementContainerTargetRegion().html(MapCreator.createImage(jRegion["code"], false));
        
        this._MovementContainerTargetSite().find("img").each(function()
        {
            MapBuilder.CardPreview.initMapViewCard(jQuery(this));
        });    
        
        this._MovementContainerTargetRegion().find("img").each(function()
        {
            MapBuilder.CardPreview.initMapViewCard(jQuery(this));
        });   
    },
    
    addRegionLocation : function(sRegionCode)
    {
        const jRegion = MapBuilder.getRegionByCode(sRegionCode);
        if (jRegion === null)
        {
            console.log("Cannot find region by its code " + sRegionCode);
            return;
        }
        
        var jElem = this._MovementContainerOtherRegions().find("[data-code='" + sRegionCode + "']"); 
        if (jElem.length === 1)
        {
            console.log("Allready there " + sRegionCode);
            return;
        }
        
        this._MovementContainerOtherRegions().append(MapCreator.createImage(sRegionCode, false));
        jElem = this._MovementContainerOtherRegions().find("[data-code='" + sRegionCode + "']"); 
        jElem.attr("title", "Click to remove");
        
        MapBuilder.CardPreview.initMapViewCard(jElem);
        jElem.click(function(e)
        {
            unbindAndRemove(jQuery(this));
        });
    },
    
    scrollToCardInList : function(sTitle)
    {
        var jList = jQuery("#found_sites img");
        jList.each(function()
        {
            var jThis = jQuery(this);
            if (jThis.attr("data-location-type") === "location")
                return;
            
            var _code = jThis.attr("data-code").toString();
            if (_code.startsWith(sTitle))
                jThis.removeClass("hide");
            else
                jThis.addClass("hide");
        });
    },
    
    fillSiteList : function()
    {
        var jTarget = jQuery("#found_sites");
        emptyChildren(jTarget);

        if (typeof MapCreator._temp === "undefined")
            return;
        
        for (var _card of MapCreator._temp)
            jTarget.append(MapCreator.createImage(_card["code"], _card["site"]));
        
        delete MapCreator._temp;

        if (MapBuilder.events.onSideCardClick !== null)
        {
            jTarget.find("img").click(function(e)
            {
                const jCard = jQuery(this);
                const sCode = jCard.attr("data-code");
                const sLocationType = jCard.attr("data-location-type");
                
                if (!MapBuilder.events.denyRegionClick || "location" !== sLocationType)
                    MapBuilder.events.onSideCardClick(e, sCode, sLocationType);
            });
        }
        
        jTarget.find("img").each(function()
        {
            MapBuilder.CardPreview.initMapViewCard(jQuery(this));
        });
    },
    
    
    ignoreMarkerClickOnce : false,
    
    onReady : function()
    {
        
    },
    
    onRegionClickCallback : function(regionCode)
    {
        var elemSites = document.getElementById("region");
        for (var i = 0; i < elemSites.options.length; ++i) 
        {
            if (elemSites.options[i].value === regionCode)
            {
                MapCreator.ignoreMarkerClickOnce = true;
                elemSites.options[i].selected = true;
                MapCreator.updateRegionSiteList(regionCode);
                break;
            }
        }
    }
};


MapBuilder.onReady = MapCreator.init;
MapBuilder.events.onRegionClickCallback = MapCreator.onRegionClickCallback;
