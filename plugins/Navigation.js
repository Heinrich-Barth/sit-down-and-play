const Authentication = require("../authentication");
const ServerModule = require("../Server");
const g_pExpress = require('express');

const navigationEntry = function(url, label, blank)
{
    return { url: url, label: label, blank: blank };
};


const getNavigationJson = function(_req, res)
{
    const targetList = [];
    targetList.push(navigationEntry("/play", "Play a game", false));
    targetList.push(navigationEntry("/tournament", "Tournament", false));
    targetList.push(navigationEntry("/deckbuilder", "Deckbuilder", false));
    targetList.push(navigationEntry("/converter", "Import Deck", false));
    targetList.push(navigationEntry("/map/regions", "Region Map", true));
    targetList.push(navigationEntry("/map/underdeeps", "Underdeeps Map", true));
    targetList.push(navigationEntry("/help", "Learn to play", false));
    targetList.push(navigationEntry("/about", "About", false));
    res.send(targetList).status(200)
};


module.exports = function(htmlDir)
{
    /**
     * Get the navigation
     */
    ServerModule.Server.getServerInstance().get("/data/navigation", ServerModule.Caching.cache.jsonCallback, getNavigationJson);

    ServerModule.Server.getServerInstance().use("/about", g_pExpress.static(htmlDir + "/pages/about.html", ServerModule.Caching.headerData.generic));
    ServerModule.Server.getServerInstance().use("/converter", ServerModule.Server.endpointVisits.increase, g_pExpress.static(htmlDir + "/pages/converter.html", ServerModule.Caching.headerData.generic));
    ServerModule.Server.getServerInstance().use("/help", g_pExpress.static(htmlDir + "/pages/help.html", ServerModule.Caching.headerData.generic));
    ServerModule.Server.getServerInstance().use("/deckbuilder", Authentication.isSignedInDeckbuilder, ServerModule.Server.endpointVisits.increase, g_pExpress.static(htmlDir + "/pages/deckbuilder.html", ServerModule.Caching.headerData.generic));
}