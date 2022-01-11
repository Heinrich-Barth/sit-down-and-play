
let g_isInit = false;

const MapInstanceRenderer = {

    _isMovementSelection: true,

    sendResultMovement: function (e) {
        const sCodeStart = e.detail.start;
        const vsRegions = e.detail.regions;
        const sCodeTarget = e.detail.target;

        if (MapInstanceRenderer._isMovementSelection && (sCodeStart === "" || sCodeTarget === "" || vsRegions.length === 0)) {
            MapInstanceRenderer.cancel();
        }
        else if (!MapInstanceRenderer._isMovementSelection && sCodeStart === "") {
            MapInstanceRenderer.cancel();
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

    cancel: function () {
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

    onInit: function (data, tapped) {
        const sCode = MapInstanceRenderer.getStartCode();
        MapInstanceRenderer._isMovementSelection = sCode !== "";

        new MapViewRegionsFilterable().createInstance(data.map);
        new MapViewSiteImages(data, tapped).createInstance();

        const pMap = new MapViewRegions(data);
        pMap.createInstance(sCode);
        pMap.preselectRegionSite(sCode);

        if (sCode === "" || sCode === undefined)
            new MapViewChooseStartingHeaven().createInstance();
        else
            new MapViewMovement(data).createInstance(sCode);

        g_isInit = true;
    }
};

const showErrorLoading = function (err) {
    let error = "Could not load map. Sorry.";
    if (err !== undefined)
        console.log('Error :-S', err);

    if (err.message !== undefined)
        error = err.message;

    document.getElementById("map_view_layer_loading").innerHTML = `<p>${error}</p>`;
};

const fetchMap = function (tappedSites) {
    fetch("/data/list/map").then((response) => {
        if (response.status === 200)
            response.json().then((map) => MapInstanceRenderer.onInit(map, tappedSites));
        else
            throw new Error("Could not load map");
    })
        .catch((err) => showErrorLoading(err));
};

const fetchTappedSites = function () {
    if (g_isInit)
        return;

    fetch("/data/list/sites-tapped").then((response) => {
        if (response.status === 200)
            response.json().then(fetchMap);
        else
            throw new Error("Could not load tapped sites");
    })
        .catch((err) => showErrorLoading(err));
};

function onKeyUp(ev) {
    switch (ev.which) {
        /* ESC */
        case 27:
            parent.postMessage({ type: "cancel" }, "*")
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

(function () {
    fetchTappedSites();
})();