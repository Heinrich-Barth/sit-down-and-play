



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

jQuery(document).ready(function ()
{
    if (g_isInit)
        return;

    g_isInit = true;

    /**
     * load map data file and init everything else
     */
    jQuery.get("/data/list/map", { }, function(data)
    {
        MapBuilder.factory.create(data, g_sImageCDNUrl);

        let sCode = "";
        let query = window.location.search;
        let pos = typeof query === "undefined" ? -1 : query.indexOf("=");

        if (pos !== -1)
            sCode = decodeURI(query.substring(pos+1));

        if (sCode === "")
        {
            MapBuilder.onChooseLocationStart(function (e, sCode, sLocationType)
            {
                parent.postMessage({
                    type : "set",
                    start: sCode,
                    regions: [],
                    target: "",
                }, "*");
            });
        }
        else
        {
            MapBuilder.onChooseLocationMovement(sCode, function (sCodeStart, vsRegions, sCodeTarget)
            {
                if (sCodeTarget === "")
                    parent.postMessage("/cancel", { });
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
            function ()
            {
                parent.postMessage({ type : "cancel" }, "*");
            });
        }
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
