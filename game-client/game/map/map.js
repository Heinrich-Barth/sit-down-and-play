
const MapWindow = {

    _lastMapRequestId : -1,

    assertValidMessage : function(id)
    {
        if (typeof id !== "undefined" && MapWindow._lastMapRequestId < id)
        {
            MapWindow._lastMapRequestId = id;
            return true;
        }
        else
            return false;
    },

    /**
     * Get IFrame message
     * @param {json} e Data from iframe
     */
    onMessage : function(e)
    {
        let sCompany = MapWindow.close();
        let jData = e.data;

        if (jData.type === "set" && typeof sCompany !== "undefined" && sCompany !== "")
        {
            MeccgApi.send("/game/company/location/set-location", {
                companyUuid: sCompany,
                start: jData.start, 
                regions: jData.regions, 
                destination: jData.target
            });
        }
    },

    /**
     * Clear the map window container, hide it and get the affected company id
     * 
     * @returns companyId
     */
    close : function()
    {
        document.body.classList.remove("on-show-map-window");

        const pMap = document.getElementById("map-window");
        if (!pMap.classList.contains("hide"))
            pMap.classList.add("hide");

        const sCompany = document.getElementById("map-iframe").getAttribute("data-company") || "";
        DomUtils.removeAllChildNodes(pMap);
        return sCompany;
    },

    /**
     * Event function to close the map iframe by clearing the container
     *  
     * @param {Evelt} e 
     * @returns false
     */
    onClose : function(e)
    {
        MapWindow.close();

        e.preventDefault();
        return false;
    },

    insertCss()
    {
        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.setAttribute("href", "/media/client/game/map/map.css");
        document.head.appendChild(styleSheet);
    },


    /**
     * Create the map container and assign the custom event listener, but only if necessary
     * (avoids duplicate creation and assignment)
     */
    init : function()
    {
        let elem = document.getElementById("map-window");
        if (elem === null)
        {
            this.insertCss();

            const div = document.createElement("div");
            div.setAttribute("id", "map-window");
            div.setAttribute("class", "map-window hide");
            document.body.appendChild(div);

            /* Getting the message from the iframe */
            window.onmessage = MapWindow.onMessage;
        }
    },

    /**
     * Show the iframe and load the given url. This will create the iframe element and adding it to the cleared
     * map window container.
     * 
     * @param {String} sUrl 
     * @param {String} company 
     * @returns 
     */
    showIframe : function(sUrl, company)
    {
        if (document.body.classList.contains("on-show-map-window") || document.getElementById("map-iframe") !== null)
            return;

        const jWrapper = document.getElementById("map-window");
        if (jWrapper === null)
            return;
            
        document.body.classList.add("on-show-map-window");

        const jOverlay = document.createElement("div");
        jOverlay.setAttribute("class", "map-overlay");
        jOverlay.setAttribute("id", "map-window-overlay");

        DomUtils.removeAllChildNodes(jWrapper); /** just make sure it is empty */

        /** add the overlay to allow closing it again */
        jWrapper.appendChild(jOverlay);

        /** show the overlay */
        jWrapper.classList.remove("hide");

        /** create iframe and add it to the container. */
        let jFrame = document.createElement("iframe");
        jFrame.setAttribute("class", "map-view");
        jFrame.setAttribute("id", "map-iframe");
        jFrame.setAttribute("data-company", company);
        jFrame.setAttribute("src", sUrl);

        jWrapper.appendChild(jFrame);

        /** 
         * this is weired Chrome behaviour. It seems the click event of the overlay is
         * being triggered immediately after the iframe is supposed to be shown.
         * This is only an issue in Chrome.
         * 
         * The solution is not very elegant, but should do the trick:
         * We simply add the click event to the map-overlay a bit later. This should give the window enough time
         * to load.
         */
         setTimeout(MapWindow.addWindowOverlayClickEvent, 3000);
    },

    /**
     * Add the overlay click event once, but only if the element exists.
     */
    addWindowOverlayClickEvent : function()
    {
        const elem = document.getElementById("map-window-overlay");
        if (elem !== null)
            elem.onclick = MapWindow.onClose;
    },

    /**
     * Show Rules
     * @param {String} sRule 
     */
    showRules : function(sRule)
    {
        MapWindow.showIframe("/rules/" + sRule, "");
    },

    showMap : function(company, code, messageId, regionMap)
    {
        if (!MapWindow.assertValidMessage(messageId) || company === undefined || company === "" || typeof messageId === "undefined")
            return;

        if (code === undefined)
            code = "";

        if (document.getElementById("map-window").classList.contains("hide"))
        {
            const url = regionMap ? "/map/regions" : "/map/underdeeps";
            MapWindow.showIframe(url + "?code=" + code, company);
        }
    },

    /** Custom event to show the map iframe.  */
    onShowMapMessageEvent : function(e)
    {
        MapWindow.showMap(e.detail.company, e.detail.code, e.detail.id, e.detail.regionmap);
    },
};

document.body.addEventListener("meccg-map-show", MapWindow.onShowMapMessageEvent, false);
document.body.addEventListener("meccg-init-ready", MapWindow.init.bind(MapWindow), false);
