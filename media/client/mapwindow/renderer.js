



/**
 * Empty all content and remove any card bindings
 * @param {jQuery} jOwner
 * @return {void}
 */
function emptyChildren(jOwner)
{
    jOwner.empty();
}

/**
 * 
 * @param {type} jElem
 * @return {undefined}
 */
function removeDraggable(jElem)
{
    unbindAndRemove(jElem);
}

function removeDraggableInContainer(jElem)
{
    unbindAndRemove(jElem);
}

function unbindAndRemove(jElement)
{
    jElement.remove();
}

let g_isInit = false;

const MapInstanceRenderer = {

    sendResultStart : function (e, sCode, sLocationType)
    {
        parent.postMessage({
            type : "set",
            start: sCode,
            regions: [],
            target: "",
        }, "*");
    },

    sendResultMovement : function(sCodeStart, vsRegions, sCodeTarget)
    {
        if (sCodeStart === undefined || sCodeStart === "")
            this.cancel();
        else if (typeof sCodeTarget === "undefined" || sCodeTarget === "" || typeof vsRegions === "undefined" || vsRegions.length === 0)
            this.cancel();
        else
        {
            parent.postMessage({
                type : "set",
                start: sCodeStart,
                regions: vsRegions,
                target: sCodeTarget,
            }, "*");
        }
    },

    cancel : function()
    {
        parent.postMessage("/cancel", { });
    },

    chooseStartSite : function()
    {
        MapBuilder.onChooseLocationStart(MapInstanceRenderer.sendResultStart);
    },

    onChooseLocationMovement : function(startCode)
    {
        MapBuilder.onChooseLocationMovement(startCode, MapInstanceRenderer.sendResultMovement, MapInstanceRenderer.cancel);
    },

    onInit : function(data, tapped)
    {
        MapBuilder.factory.create(data, g_sImageCDNUrl, tapped);

        let sCode = "";
        let query = window.location.search;
        let pos = typeof query === "undefined" ? -1 : query.indexOf("=");

        if (pos !== -1)
            sCode = decodeURI(query.substring(pos+1));

        if (sCode === "")
            MapInstanceRenderer.chooseStartSite();
        else
            MapInstanceRenderer.onChooseLocationMovement(sCode);

        g_isInit = true;
    }


};

jQuery(document).ready(function ()
{
    if (g_isInit)
        return;

    jQuery.get("/data/list/sites-tapped", { }, function(tapped)
    {
        jQuery.get("/data/list/map", { }, function(data)
        {
            MapInstanceRenderer.onInit(data, tapped);
        });
    });

    
});

function onKeyUp(ev)
{
    switch(ev.which)
    {
        /* ESC */
        case 27:
            parent.postMessage({ type : "cancel" }, "*")
            break;

        /* ENTER */
        case 13:
            jQuery("#movement_accept").click();
            break;

        default:
            break;
    }

}

document.body.addEventListener("keyup", onKeyUp, false);
