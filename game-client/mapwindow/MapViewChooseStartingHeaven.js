/**
 * Show map and only allow to choose a starting site. Once a site has been clicked,
 * the map will be closed again.
 */
class MapViewChooseStartingHeaven extends MapViewMovementSelection
{
    
    createInstance()
    {
        super.createInstance();

        DomUtils.removeAllChildNodes(document.getElementById("found_sites"));
        document.getElementById("found_sites").innerHTML = '<span class="caption">Click on any region marker and<br>choose a starting site</span>';
    }

    onProcessEvent(region, image, isSite, code)
    {
        if (isSite)
            super.sendMovement(code);
    }

}