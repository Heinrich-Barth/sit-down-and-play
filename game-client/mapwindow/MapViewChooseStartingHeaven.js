/**
 * Show map and only allow to choose a starting site. Once a site has been clicked,
 * the map will be closed again.
 */
class MapViewChooseStartingHeaven extends MapViewRegionsMovementFilterable
{
    constructor(jMap, jTappedSites)
    {
        super(jMap, jTappedSites);
    }

    onSideCardClick(sCode)
    {
        this.sendMovement(sCode, [], sCode);
        this.destroy();
    }

    getMovementSites()
    {
        return {
            start: "",
            regions: [],
            target: ""
        };
    }

    onChooseLocationMovement()
    {
        this.denyRegionClick = true;
        DomUtils.removeAllChildNodes(document.getElementById("found_sites"));
        document.getElementById("found_sites").innerHTML = '<span class="caption">Click on any region marker and<br>choose a starting site</span>';
    }

    loadMovementList()
    {
        return true;
    }
}