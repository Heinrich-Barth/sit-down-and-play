
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

    onInitEditor: function (data) {

        MapInstanceRenderer._isMovementSelection = false;

        new MapViewSiteImages(data).createInstance();

        const pMap = new MapViewPositioning(data);
        pMap.createInstance();
    },

    onInitDefault: function (data, tapped, listPreferredCodes) {
        const sCode = MapInstanceRenderer.getStartCode();
        MapInstanceRenderer._isMovementSelection = sCode !== "";

        new MapViewRegionsFilterable().createInstance(data.map);
        new MapViewSiteImages(data, tapped, listPreferredCodes).createInstance();

        const pMap = new MapViewRegions(data);
        pMap.createInstance(sCode);
        pMap.preselectRegionSite(sCode);

        if (sCode === "")
            new MapViewChooseStartingHeaven().createInstance();
        else
            new MapViewMovement(data).createInstance(sCode);

        g_isInit = true;
    },

    isEditor: function()
    {
        return typeof MapViewPositioning !== "undefined";
    },

    onInit: function (data, tapped) {

        if (!MapInstanceRenderer.isEditor())
            MapInstanceRenderer.onInitDefault(data, tapped, fetchPreferredSitesFromLocalStorage());
        else
            MapInstanceRenderer.onInitEditor(data);
        
        g_isInit = true;
    }
};

const showErrorLoading = function (err) {
    let error = "Could not load map. Sorry.";
    if (err !== undefined)
        console.log('Error :-S', err);

    if (err.message !== undefined)
        error = err.message;

    DomUtils.empty(document.getElementById("map_view_layer_loading")); 

    const p = document.createElement("p");

    const i1 = document.createElement("i");
    i1.setAttribute("class", "fa fa-exclamation-circle");
    p.appendChild(i1);

    p.appendChild(document.createTextNode(error));

    const i2 = document.createElement("i");
    i2.setAttribute("class", "fa fa-exclamation-circle");
    p.appendChild(i2);

    document.getElementById("map_view_layer_loading").appendChild(p);
};

const getCurrentDate = function()
{
    const sVal = new Date().toISOString();
    const nPos = sVal.indexOf("T");
    if (nPos === -1)
        return "" + Date.now();
    else
        return sVal.substring(0, nPos);
}

const updateLoadingInfo = function(sValue)
{
    const elem = document.getElementById("map_view_layer_loading_desc");
    if (elem !== null && sValue)
        elem.innerText = sValue;
}

const fetchFromLocalStorage = function()
{
    updateLoadingInfo("map from local storage");

    if (localStorage.getItem("game_data"))
    {
        try
        {
            return JSON.parse(localStorage.getItem("game_data")).map;
        }
        catch(err)
        {
            console.error(err);
        }
    }

    return null;
}

const fetchPreferredSitesFromLocalStorage = function()
{
    if (localStorage.getItem("sitelist"))
    {
        try
        {
            const res = JSON.parse(localStorage.getItem("sitelist"));
            if (Array.isArray(res) && res.length > 0)
                return res;
        }
        catch(err)
        {
            console.error(err);
        }
    }

    return [];
}

const fetchMap = async function (tappedSites) {

    const localData = fetchFromLocalStorage();
    if (localData !== null)
    {
        MapInstanceRenderer.onInit(localData, tappedSites);
        return;
    }

    updateLoadingInfo("map data (this may take a while)");

    setTimeout(() => {
        fetch("/data/list/map?t=" + getCurrentDate())
        .then((response) => response.json())
        .then((map) => MapInstanceRenderer.onInit(map, tappedSites))
        .catch((err) => showErrorLoading(err));
    }, 10);

};

const fetchTappedSites = function () {
    if (g_isInit)
        return;

    updateLoadingInfo("already tapped sites");

    fetch("/data/list/sites-tapped")
    .then((response) => response.json())
    .then(fetchMap)
    .catch((err) => showErrorLoading(err));
};

function onKeyUp(ev) {
    let code = "";
    if (ev.key !== undefined)
        code = ev.key;
    else if (ev.keyIdentifier !== undefined)
        code = e.keyIdentifier;

    switch (code) {
        /* ESC */
        case "Escape":
            parent.postMessage({ type: "cancel" }, "*")
            break;

        /* ENTER */
        case "Enter":
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