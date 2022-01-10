
/**
 * Show Underdeeps Map
 */
class MapViewUnderdeeps extends MapView {

    constructor()
    {
        super("underdeeps");
    }

    getStartupLat()
    {
        return 66;
    }

    getStartLon()
    {
        return -90.800;
    }

    getZoomStart()
    {
        return 4;
    }

}

/**
 * Simply create map. No further action necessary.
 */
new MapViewUnderdeeps().createInstance();
