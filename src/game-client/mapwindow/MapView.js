/**
 * Show a generic map
 */
class MapView {

    #minZoom = 3;
    #maxZoom = 6;
    #clickZoomLevel = 5;
    #instanceLeafletjsMap = null;

    #assetFolder;

    constructor(assetFolder)
    {
        this.#assetFolder = assetFolder;
    }

    getMapInstance()
    {
        return this.#instanceLeafletjsMap;
    }

    getStartupLat()
    {
        return 0;
    }

    getStartLon()
    {
        return 0;
    }

    getZoomStart()
    {
        return this.#maxZoom - 1;
    }

    flyTo(e)
    {
        let nZoom = this.#instanceLeafletjsMap.getZoom();
        if (nZoom < this.#clickZoomLevel)
            nZoom = this.#clickZoomLevel;
            
        this.#instanceLeafletjsMap.flyTo([e.target._latlng.lat, e.target._latlng.lng], nZoom);
    }

    removeOverlays()
    {
        DomUtils.removeNode(document.getElementById("map_view_layer_loading"));    
        const sElems = document.querySelector(".map_view_layer");
        if (sElems !== null && sElems !== undefined)
            sElems.classList.remove("hide");
    }

    #getPageSwitcherUrl()
    {
        if (window.location.pathname.includes("underdeeps"))
        {
            return {
                url: window.location.pathname.replace("underdeeps", "regions"),
                label: "Region Map"
            }
        }
        else
        {
            return {
                url: window.location.pathname.replace("regions", "underdeeps"),
                label: "Underdeeps Map"
            }
        }
    }

    #insertPageSwitch()
    {
        const elem = document.createElement("div");
        elem.setAttribute("class", "map-view-switcher cursor-pointer blue-box");

        const data = this.#getPageSwitcherUrl();

        const a = document.createElement("a");
        a.innerText = "Switch to " + data.label;
        a.setAttribute("href", data.url + window.location.search);

        elem.append(a);
        document.body.append(elem);
    }

    createInstance()
    {
        if (this.#assetFolder === "" || this.#assetFolder.indexOf("..") !== -1)
            throw new Error("Invalid asset folder");

        this.removeOverlays();

        this.#instanceLeafletjsMap = L.map('map', 
        {
            minZoom: this.#minZoom,
            maxZoom: this.#maxZoom,
            dragging: true
        });

        const lat = this.getStartupLat();
        const lng = this.getStartLon();
        
        L.tileLayer('/media/maps/' + this.#assetFolder + '/{z}/tile_{x}_{y}.jpg').addTo(this.#instanceLeafletjsMap);
        this.#instanceLeafletjsMap.setView(L.latLng(lat, lng), this.getZoomStart());
        
        this.#insertPageSwitch();
        return true;
    }

    destroy()
    {
        if (this.#instanceLeafletjsMap !== null)
        {
            this.#instanceLeafletjsMap.eachLayer((layer) => this.#instanceLeafletjsMap.removeLayer(layer));
            this.#instanceLeafletjsMap.remove();
            this.#instanceLeafletjsMap = null;
        }
    }
}
