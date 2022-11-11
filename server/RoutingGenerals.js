const path = require('path');
const rootDir = path.join(__dirname, "/..");

module.exports = function(SERVER, g_pExpress)
{
    /**
     * This is a blank (black) page. Necessary for in-game default page
     */
    SERVER.instance.use("/blank", g_pExpress.static(rootDir + "/pages/blank.html", SERVER.caching.headerData.generic));

    /**
     * Simple PING
     */
    SERVER.instance.get("/ping", SERVER.caching.expires.generic, (_req, res) => res.send("" + Date.now()).status(200));

    /**
     * This allows dynamic scoring categories. Can be cached, because it will not change.
     */
    SERVER.instance.use("/robots.txt", g_pExpress.static(rootDir + "/robots.txt"));


    SERVER.instance.post("/csp-violation", (req, res) => 
    {
        console.warn("CSP violation at " + (req.headers.referrer || req.headers.referer));
        res.status(204).end();
    });
    
}
