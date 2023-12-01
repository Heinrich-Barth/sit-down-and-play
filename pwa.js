const g_pExpress = require('express');
const g_pAuthentication = require("./authentication");
const SERVER = require("./Server").Server;

const onPwaRunning = function(req, res)
{
    const data = {
        pwa: g_pAuthentication.isSignedInPWA(req)
    };

    res.send(data).status(200);
}

module.exports = function()
{
    SERVER.getServerInstance().get("/pwa/running", SERVER.caching.expires.jsonCallback, onPwaRunning);
    SERVER.getServerInstance().get("/pwa", g_pAuthentication.signInFromPWA, (_req, res) => res.redirect("/pwa/app.html"));
    SERVER.getServerInstance().use("/serviceWorker.js", g_pExpress.static(__dirname + "/serviceWorker.js"));
}