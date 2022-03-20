let g_isInit = false;

const MapInstanceRendererUd = {

    _isMovementSelection: true,

    sendResultMovement: function (e) 
    {
        const sCodeStart = e.detail.start;
        const vsRegions = e.detail.regions;
        const sCodeTarget = e.detail.target;

        if (MapInstanceRendererUd._isMovementSelection && (sCodeStart === "" || sCodeTarget === "" || vsRegions.length === 0)) {
            MapInstanceRendererUd.cancel();
        }
        else if (!MapInstanceRendererUd._isMovementSelection && sCodeStart === "") {
            MapInstanceRendererUd.cancel();
        }
        else {
            parent.postMessage({
                type: "set",
                start: sCodeStart,
                regions: vsRegions,
                target: sCodeTarget,
            }, "*");
        }
    },

    cancel: function () 
    {
        parent.postMessage("cancel", {});
    },

    getStartCode: function () {
        let query = window.location.search;
        let pos = typeof query === "undefined" ? -1 : query.indexOf("=");

        if (pos !== -1)
            return decodeURI(query.substring(pos + 1));
        else
            return "";
    },

    onInitDefault: function (data, tapped) {
        const sCode = MapInstanceRendererUd.getStartCode();
        MapInstanceRendererUd._isMovementSelection = sCode !== "";

        const pMap = new MapViewUnderdeeps(data, tapped);
        pMap.createInstance(sCode);
        pMap.populateSites(sCode);
        g_isInit = true;
    },

    onInit: function (data, tapped) {

        MapInstanceRendererUd.onInitDefault(data, tapped);
        g_isInit = true;
    }
};


const showErrorLoading = function (err) 
{
    let error = "Could not load map. Sorry.";
    if (err !== undefined)
    {
        console.err(err);
        if (err.message !== undefined)
            error = err.message;
    }

    document.getElementById("map_view_layer_loading").innerHTML = `<p>${error}</p>`;
};

const fetchMap = function (tappedSites) {
    fetch("/data/list/underdeeps").then((response) => {
        if (response.status === 200)
            response.json().then((map) => MapInstanceRendererUd.onInit(map, tappedSites));
        else
            throw new Error("Could not load map");
    }).catch((err) => showErrorLoading(err));
};

const fetchTappedSites = function () 
{
    if (g_isInit)
        return;

    fetch("/data/list/sites-tapped").then((response) => {
        if (response.status === 200)
            response.json().then(fetchMap);
        else
            throw new Error("Could not load tapped sites");
    }).catch((err) => showErrorLoading(err));
};


const onKeyUp = function(ev) 
{
    switch (ev.which) {
        /* ESC */
        case 27:
            MapInstanceRendererUd.cancel();
            break;

        /* ENTER */
        case 13:
            const elem = document.getElementById("movement_accept");
            if (elem !== null)
                document.getElementById("movement_accept").dispatchEvent(new Event('click'));
            else
                MapInstanceRendererUd.cancel();
            break;

        default:
            break;
    }
};

document.body.addEventListener("keyup", onKeyUp, false);
document.body.addEventListener("meccg-map-selected-movement", MapInstanceRendererUd.sendResultMovement, false);
document.body.addEventListener("meccg-map-cancel", MapInstanceRendererUd.cancel, false);

(function () {
    fetchTappedSites();
})();