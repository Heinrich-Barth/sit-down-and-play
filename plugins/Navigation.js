const navigationEntry = function(url, label)
{
    return { url: url, label: label };
};


const getNavigationJson = function(_req, res)
{
    let targetList = [];
    targetList.push(navigationEntry("/cards", "Card Browser"));
    targetList.push(navigationEntry("/deckbuilder", "Deckbuilder"));
    targetList.push(navigationEntry("/converter", "Import a deck"));
    targetList.push(navigationEntry("/", "Play a game"));
    targetList.push(navigationEntry("/map/regions", "Region Map"));
    targetList.push(navigationEntry("/map/underdeeps", "Underdeeps Map"));
    targetList.push(navigationEntry("/about", "About"));
    res.send(targetList).status(200)
};


module.exports = function(SERVER, g_pExpress, g_pAuthentication, htmlDir)
{
    /**
     * Get the navigation
     */
    SERVER.instance.get("/data/navigation", SERVER.caching.cache.jsonCallback, getNavigationJson);

    SERVER.instance.use("/about", g_pExpress.static(htmlDir + "/pages/about.html", SERVER.caching.headerData.generic));
    SERVER.instance.use("/converter", g_pExpress.static(htmlDir + "/pages/converter.html", SERVER.caching.headerData.generic));
    SERVER.instance.use("/help", g_pExpress.static(htmlDir + "/pages/help.html", SERVER.caching.headerData.generic));
    SERVER.instance.use("/deckbuilder", g_pAuthentication.isSignedInDeckbuilder, g_pExpress.static(htmlDir + "/pages/deckbuilder.html", SERVER.caching.headerData.generic));
    SERVER.instance.use("/cards", g_pAuthentication.isSignedInCards, g_pExpress.static(htmlDir + "/pages/card-browser.html", SERVER.caching.headerData.generic));

}