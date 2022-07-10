
/**
 * Error endpoint.
 * This also deletes all available cookies
 */
const ClearCookies = require("./ClearCookies");

module.exports = function(SERVER)
{
    const path = require('path');
    const rootDir = path.join(__dirname, "/../pages");
    SERVER.instance.get("/error", ClearCookies.clearCookiesCallback, () => SERVER.sendFile(rootDir + "//error.html"));
    SERVER.instance.get("/error/https-required", ClearCookies.clearCookiesCallback, () => SERVER.sendFile(rootDir + "/error-https-required.html"));
    SERVER.instance.get("/error/denied", ClearCookies.clearCookiesCallback, () => SERVER.sendFile(rootDir + "/error-access-denied.html"));
    SERVER.instance.get("/error/login", ClearCookies.clearCookiesCallback, () => SERVER.sendFile(rootDir + "/error-login.html"));   
}
