
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
        MapBuilder.factory.create(data, tapped);

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

(function() 
{
    fetchTappedSites();
})();