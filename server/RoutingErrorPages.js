
/**
 * Error endpoint.
 * This also deletes all available cookies
 */
const ClearCookies = require("./ClearCookies");
const ServerModule = require("../Server");
const g_pExpress = require('express');

module.exports = function()
{
    const path = require('path');
    const rootDir = path.join(__dirname, "/../pages");

    ServerModule.Server.getServerInstance().use("/error", ClearCookies.clearCookiesCallback, g_pExpress.static(rootDir + "/error.html", ServerModule.Caching.headerData.generic));
    ServerModule.Server.getServerInstance().use("/error/https-required", ClearCookies.clearCookiesCallback, g_pExpress.static(rootDir + "/error-https-required.html", ServerModule.Caching.headerData.generic));
    ServerModule.Server.getServerInstance().use("/error/denied", ClearCookies.clearCookiesCallback, g_pExpress.static(rootDir + "/error-access-denied.html", ServerModule.Caching.headerData.generic));
    ServerModule.Server.getServerInstance().use("/error/login", ClearCookies.clearCookiesCallback, g_pExpress.static(rootDir + "/error-login.html",ServerModule.Caching.headerData.generic));   
    ServerModule.Server.getServerInstance().use("/error/nosuchroom", ClearCookies.clearCookiesCallback, g_pExpress.static(rootDir + "/error-nosuchroom.html",ServerModule.Caching.headerData.generic));   
}
