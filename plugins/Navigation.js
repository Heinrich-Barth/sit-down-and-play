const navigationEntry = function(url, label, blank)
{
    return { url: url, label: label, blank: blank };
};


const getNavigationJson = function(_req, res)
{
    let targetList = [];
    targetList.push(navigationEntry("/play", "Play a game", false));
    targetList.push(navigationEntry("/deckbuilder", "Deckbuilder", false));
    targetList.push(navigationEntry("/converter", "Import Deck", false));
    targetList.push(navigationEntry("/map/regions", "Region Map", true));
    targetList.push(navigationEntry("/map/underdeeps", "Underdeeps Map", true));
    targetList.push(navigationEntry("/about", "About", false));
    res.send(targetList).status(200)
};


module.exports = function(SERVER, g_pExpress, g_pAuthentication, htmlDir)
{
    /**
     * Get the navigation
     */
    SERVER.instance.get("/data/navigation", SERVER.caching.cache.jsonCallback, getNavigationJson);

    SERVER.instance.use("/about", g_pExpress.static(htmlDir + "/pages/about.html", SERVER.caching.headerData.generic));
    SERVER.instance.use("/converter", SERVER.endpointVisits.increase, g_pExpress.static(htmlDir + "/pages/converter.html", SERVER.caching.headerData.generic));
    SERVER.instance.use("/help", g_pExpress.static(htmlDir + "/pages/help.html", SERVER.caching.headerData.generic));
    SERVER.instance.use("/deckbuilder", g_pAuthentication.isSignedInDeckbuilder, SERVER.endpointVisits.increase, g_pExpress.static(htmlDir + "/pages/deckbuilder.html", SERVER.caching.headerData.generic));

}