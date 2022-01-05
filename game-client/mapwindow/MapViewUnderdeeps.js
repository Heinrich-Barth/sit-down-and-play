
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

}

/**
 * Simply create map. No further action necessary.
 */
new MapViewUnderdeeps().createInstance();
