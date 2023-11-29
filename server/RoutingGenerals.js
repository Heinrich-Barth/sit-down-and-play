const path = require('path');
const rootDir = path.join(__dirname, "/..");
const ServerModule = require("../Server");
const g_pExpress = require('express');

module.exports = function()
{
    /**
     * This is a blank (black) page. Necessary for in-game default page
     */
    ServerModule.Server.getServerInstance().use("/blank", g_pExpress.static(rootDir + "/pages/blank.html", ServerModule.Caching.headerData.generic));

    /**
     * Simple PING
     */
    ServerModule.Server.getServerInstance().get("/ping", ServerModule.Caching.expires.generic, (_req, res) => res.send("" + Date.now()).status(200));

    /**
     * This allows dynamic scoring categories. Can be cached, because it will not change.
     */
    ServerModule.Server.getServerInstance().use("/robots.txt", g_pExpress.static(rootDir + "/robots.txt"));

    ServerModule.Server.getServerInstance().post("/csp-violation", (_req, res) => res.status(204).end());
}
