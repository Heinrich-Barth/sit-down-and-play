const Logger = require("../Logger");
const Configuration = require("../Configuration");
const CardDataProvider = require("../plugins/CardDataProvider");
const ServerModule = require("../Server");
const g_pExpress = require('express');

const onGetTappedSites = function(req, res)
{
    res.send(getTappedSites(req.cookies)).status(200);
}

const getTappedSites = function(cookies)
{
    try
    {
        if (cookies?.room !== undefined && cookies?.userId !== undefined)
            return ServerModule.Server.getRoomManager().getTappedSites(cookies.room, cookies.userId);
    }
    catch(e)
    {
        Logger.error(e);
    }

    return { };
};


const CookiePreferences = require("./CookiePreferences");
class MapCookiePreferences extends CookiePreferences
{
    sanatizeValue(val)
    {
        return val === true;
    }
}

const pCookiePreferences = new MapCookiePreferences();
pCookiePreferences.addPreference("hero", true);
pCookiePreferences.addPreference("minion", true);
pCookiePreferences.addPreference("fallenwizard", true);
pCookiePreferences.addPreference("balrog", true);
pCookiePreferences.addPreference("elf", true);
pCookiePreferences.addPreference("dwarf", true);
pCookiePreferences.addPreference("lord", true);
pCookiePreferences.addPreference("fallenlord", true);
pCookiePreferences.addPreference("dragon", false);
pCookiePreferences.addPreference("dreamcards", true);

if (!Configuration.isProduction())
    pCookiePreferences.setProduction(false);

module.exports = function()
{
    /* Map images should be cached */
    ServerModule.Server.getServerInstance().use("/media/map-black-tile", g_pExpress.static(__dirname + "/../public/media/map-tile.jpg", ServerModule.Caching.headerData.generic));

    /**
     * Show Map Pages
     */
    ServerModule.Server.getServerInstance().use("/map/underdeeps", g_pExpress.static(__dirname + "/../pages/map-underdeeps.html"));
    ServerModule.Server.getServerInstance().use("/map/regions", g_pExpress.static(__dirname + "/../pages/map-regions.html"));
    ServerModule.Server.getServerInstance().use("/map/regions/edit", g_pExpress.static(__dirname + "/../pages/map-regions-marking.html"));
    
    /**
     * Provide the map data with all regions and sites for the map windows
     */
    ServerModule.Server.getServerInstance().get("/data/list/map", ServerModule.Caching.cache.jsonCallback6hrs, (_req, res) => res.send(CardDataProvider.getMapdata()).status(200));
    ServerModule.Server.getServerInstance().get("/data/list/underdeeps", ServerModule.Caching.cache.jsonCallback6hrs, (_req, res) => res.send(CardDataProvider.getUnderdeepMapdata()).status(200));

    ServerModule.Server.getServerInstance().get("/data/preferences/map", ServerModule.Caching.expires.jsonCallback, (req, res) => res.send(pCookiePreferences.get(req.cookies)).status(200));
    ServerModule.Server.getServerInstance().post("/data/preferences/map", (req, res) =>  { 
        pCookiePreferences.update(req, res); 
        res.setHeader('Content-Type', 'text/plain');
        res.send("").status(200); 
    });

    /**
     * Get a list of tapped sites. This endpoint requiers cookie information. If these are not available,
     * the endpoint returns an empty map object.
     */
    ServerModule.Server.getServerInstance().get("/data/list/sites-tapped", ServerModule.Caching.expires.jsonCallback, onGetTappedSites);
   
};