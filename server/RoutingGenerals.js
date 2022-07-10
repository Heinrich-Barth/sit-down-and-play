const path = require('path');
const rootDir = path.join(__dirname, "/..");

module.exports = function(SERVER, g_pExpress)
{
    /**
     * This is a blank (black) page. Necessary for in-game default page
     */
    SERVER.instance.use("/blank", g_pExpress.static(rootDir + "/pages/blank.html", SERVER.cacheResponseHeader));

    /**
     * Simple PING
     */
    SERVER.instance.get("/ping", (_req, res) => SERVER.expireResponse(res, "text/plain").send("" + Date.now()).status(200));

    /**
     * This allows dynamic scoring categories. Can be cached, because it will not change.
     */
    SERVER.instance.use("/robots.txt", g_pExpress.static(rootDir + "/robots.txt"));
}
