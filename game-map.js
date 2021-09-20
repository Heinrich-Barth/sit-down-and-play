

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

const getCookieValue = function(cookies, name, value)
{
    return cookies === undefined || cookies["map" + name] === undefined ? value : cookies["map" +name];
}


const getMapFilterCookies = function(cookies)
{
    return {
        hero : getCookieValue(cookies, "hero", true),
        minion : getCookieValue(cookies, "minion", true),
        fallenwizard : getCookieValue(cookies, "fallenwizard", true),
        balrog : getCookieValue(cookies, "balrog", false),
        elf : getCookieValue(cookies, "elf", true),
        dwarf : getCookieValue(cookies, "dwarf", true),
        lord : getCookieValue(cookies, "lord", true),
        fallenlord : getCookieValue(cookies, "fallenlord", true),
        dragon : getCookieValue(cookies, "dragon", false)
    };
};
const updateMapFilterCookies = function(req, res)
{
    try
    {
        const jData = req.body;
        const val = jData.value === true;
        switch(jData.name)
        {
            case "hero":
            case "minion":
            case "fallenwizard":
            case "balrog":
            case "elf":
            case "dwarf":
            case "lord":
            case "fallenlord":
            case "dragon":
                res.cookie("map" + jData.name, val, g_bIsProduction);
                console.log("updated cookie " + jData.name + " to " + jData.value);
                break;
            default:
                console.log("Unknown cookie type " + jData.name);
                break;
        }
    }
    catch (e)
    {
        console.log(e);
    }
}

let g_bIsProduction = false;

exports.setup = function(SERVER, g_pExpress, fnGetHtmlCspPage)
{
    if (fnGetHtmlCspPage !== undefined)
        getHtmlCspPage = fnGetHtmlCspPage;

    g_bIsProduction = SERVER.environment.isProduction;

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

    SERVER.instance.get("/data/map/filters", (req, res) => SERVER.expireResponse(res, "application/json").send(getMapFilterCookies(req.cookies)).status(200));
    SERVER.instance.post("/data/map/filters", (req, res) =>  { 
        updateMapFilterCookies(req, res); 
        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });

    /**
     * Get a list of tapped sites. This endpoint requiers cookie information. If these are not available,
     * the endpoint returns an empty map object.
     */
    SERVER.instance.get("/data/list/sites-tapped", (req, res) => SERVER.expireResponse(res, "application/json").send(getTappedSites(SERVER, req.cookies)).status(200));
   
};