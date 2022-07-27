
/**
 * Error endpoint.
 * This also deletes all available cookies
 */
const ClearCookies = require("./ClearCookies");

module.exports = function(SERVER, g_pExpress)
{
    const path = require('path');
    const rootDir = path.join(__dirname, "/../pages");

    SERVER.instance.use("/error", ClearCookies.clearCookiesCallback, g_pExpress.static(rootDir + "/error.html", SERVER.caching.headerData.generic));
    SERVER.instance.use("/error/https-required", ClearCookies.clearCookiesCallback, g_pExpress.static(rootDir + "/error-https-required.html", SERVER.caching.headerData.generic));
    SERVER.instance.use("/error/denied", ClearCookies.clearCookiesCallback, g_pExpress.static(rootDir + "/error-access-denied.html", SERVER.caching.headerData.generic));
    SERVER.instance.use("/error/login", ClearCookies.clearCookiesCallback, g_pExpress.static(rootDir + "/error-login.html",SERVER.caching.headerData.generic));   
}
