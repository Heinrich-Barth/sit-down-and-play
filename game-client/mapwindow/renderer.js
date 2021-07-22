
let g_isInit = false;

const SelectedMovement = function(codeStart, regions, codeTarget)
{
    if (regions === undefined)
        regions = [];

    if (codeTarget === undefined)
        codeTarget = "";

    return {
        start : codeStart,
        regions: regions,
        target: codeTarget
    }
};

const MapInstanceRenderer = {

    _isMovementSelection : true,

    sendResultMovement : function (e)
    {
        const sCodeStart = e.detail.start;
        const vsRegions = e.detail.regions;
        const sCodeTarget = e.detail.target;

        if (MapInstanceRenderer._isMovementSelection && (sCodeStart === "" || sCodeTarget === "" || vsRegions.length === 0))
        {
            console.log("invalid1");
            MapInstanceRenderer.cancel();
        }
        else if (!MapInstanceRenderer._isMovementSelection && sCodeStart === "")
        {
            console.log("invalid2");
            MapInstanceRenderer.cancel();
        }
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

    onInit : function(data, tapped)
    {
        MapBuilder.factory.create(data, tapped);

        let sCode = "";
        let query = window.location.search;
        let pos = typeof query === "undefined" ? -1 : query.indexOf("=");

        if (pos !== -1)
            sCode = decodeURI(query.substring(pos+1));

        MapInstanceRenderer._isMovementSelection = sCode !== "";
        document.body.dispatchEvent(new CustomEvent("meccg-map-load-location", { "detail": sCode }));

        g_isInit = true;
    }
};

const showErrorLoading = function(err)
{
    let error = "Could not load map. Sorry.";
    if (err !== undefined)
        console.log('Error :-S', err);

    if (err.message !== undefined)
        error = err.message;

    document.getElementById("map_view_layer_loading").innerHTML = `<p>${error}</p>`;
};

const fetchMap = function(tappedSites)
{
    fetch("/data/list/map").then((response) => 
    {
        if (response.status === 200)
            response.json().then((map) => MapInstanceRenderer.onInit(map, tappedSites));
        else
            throw "Could not load map";
    })
    .catch((err) => showErrorLoading(err));
};

const fetchTappedSites = function()
{
    if (g_isInit)
        return;

    fetch("/data/list/sites-tapped").then((response) => 
    {
        if (response.status === 200)
            response.json().then(fetchMap);
        else
            throw "Could not load tapped sites";
    })
    .catch((err) => showErrorLoading(err));
};

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
            document.getElementById("movement_accept").dispatchEvent(new Event('click'));
            break;

        default:
            break;
    }

}

document.body.addEventListener("keyup", onKeyUp, false);
document.body.addEventListener("meccg-map-selected-movement", MapInstanceRenderer.sendResultMovement, false);
document.body.addEventListener("meccg-map-cancel", MapInstanceRenderer.cancel, false);

(function() 
{
    fetchTappedSites();
})();