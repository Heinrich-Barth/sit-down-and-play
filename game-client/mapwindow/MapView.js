/**
 * Show a generic map
 */
class MapView {

    constructor(assetFolder)
    {
        this.minZoom = 3;
        this.maxZoom = 6;
        this.instanceLeafletjsMap = null;
        this.assetFolder = assetFolder;
        this.clickZoomLevel = 5;
    }

    getMapInstance()
    {
        return this.instanceLeafletjsMap;
    }

    getStartupLat()
    {
        return 0;
    }

    getStartLon()
    {
        return 0;
    }

    flyTo(e)
    {
        let nZoom = this.instanceLeafletjsMap.getZoom();
        if (nZoom < this.clickZoomLevel)
            nZoom = this.clickZoomLevel;
            
        this.instanceLeafletjsMap.flyTo([e.target._latlng.lat, e.target._latlng.lng], nZoom);
    }

    createInstance()
    {
        if (this.assetFolder === "" || this.assetFolder.indexOf("..") !== -1)
            throw new Error("Invalid asset folder");

        this.instanceLeafletjsMap = L.map('map', 
        {
            minZoom: this.minZoom,
            maxZoom: this.maxZoom,
            dragging: true
        });

        const lat = this.getStartupLat();
        const lng = this.getStartLon();

        const nZoom = this.maxZoom - 1;
        
        L.tileLayer('/media/maps/' + this.assetFolder + '/{z}/tile_{x}_{y}.jpg').addTo(this.instanceLeafletjsMap);
        this.instanceLeafletjsMap.setView(L.latLng(lat, lng), nZoom);
        
        return true;
    }

    destroy()
    {
        if (this.instanceLeafletjsMap !== null)
        {
            const pThis = this;  
            this.instanceLeafletjsMap.eachLayer(function (layer) 
            {
                pThis.instanceLeafletjsMap.removeLayer(layer);
            });

            this.instanceLeafletjsMap.remove();
            this.instanceLeafletjsMap = null;
        }
    }
}
