

let g_sRegionMap = "";

/**
 * Callback function
 * @returns Empty String
 */
function getHtmlCspPage()
{
    return "";
}

/**
 * Show Region Map.
 * 
 * Since the map will be used regularly and many times per game, the HTML will be prepared
 * exactly ONCE and then be loaded from a cached variable
 * instead of creating it many times over and over again.
 */
const getRegionMap = function()
{
    if (g_sRegionMap === "")
        g_sRegionMap = getHtmlCspPage("map-regions.html");

    return g_sRegionMap;
};

const getTappedSites = function(SERVER, cookies)
{
    try
    {
        if (cookies !== undefined && cookies.room !== undefined && cookies.userId !== undefined)
            return SERVER.roomManager.getTappedSites(cookies.room, cookies.userId);
    }
    catch(e)
    {
        console.log(e);
    }

    return { };
};


const CookiePreferences = require("./cookiepreferences");
class MapCookiePreferences extends CookiePreferences
{
    constructor(sPrefix)
    {
        super(sPrefix);
    }

    sanatizeValue(val)
    {
        return val === true;
    }
}

const pCookiePreferences = new MapCookiePreferences();
pCookiePreferences.addPreference("hero", true);
pCookiePreferences.addPreference("minion", true);
pCookiePreferences.addPreference("fallenwizard", true);
pCookiePreferences.addPreference("balrog", false);
pCookiePreferences.addPreference("elf", true);
pCookiePreferences.addPreference("dwarf", true);
pCookiePreferences.addPreference("lord", true);
pCookiePreferences.addPreference("fallenlord", true);
pCookiePreferences.addPreference("dragon", false);

exports.setup = function(SERVER, g_pExpress, fnGetHtmlCspPage)
{
    if (fnGetHtmlCspPage !== undefined)
        getHtmlCspPage = fnGetHtmlCspPage;

    pCookiePreferences.setProduction(SERVER.environment.isProduction);

    /* Map images should be cached */
    SERVER.instance.use("/media/maps", g_pExpress.static("media/maps", SERVER.cacheResponseHeader));

    /**
     * Show Map Pages
     */
    SERVER.instance.use("/map/underdeeps", g_pExpress.static(__dirname + "/pages/map-underdeeps.html", SERVER.cacheResponseHeader));

    /**
     * Region Map. Importantly, this must not be cached!
     */
    SERVER.instance.get("/map/regions", (req, res) => SERVER.expireResponse(res, "text/html").send(getRegionMap()).status(200));

    /**
     * Provide the map data with all regions and sites for the map windows
     */
    SERVER.instance.get("/data/list/map", (req, res) => SERVER.cacheResponse(res, "application/json").send(SERVER.cards.getMapdata()).status(200));

    SERVER.instance.get("/data/preferences/map", (req, res) => SERVER.expireResponse(res, "application/json").send(pCookiePreferences.get(req.cookies)).status(200));
    SERVER.instance.post("/data/preferences/map", (req, res) =>  { 
        pCookiePreferences.update(req, res); 
        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });

    /**
     * Get a list of tapped sites. This endpoint requiers cookie information. If these are not available,
     * the endpoint returns an empty map object.
     */
    SERVER.instance.get("/data/list/sites-tapped", (req, res) => SERVER.expireResponse(res, "application/json").send(getTappedSites(SERVER, req.cookies)).status(200));
   
};