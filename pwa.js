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
    SERVER.instance.get("/pwa/running", SERVER.caching.expires.jsonCallback, onPwaRunning);
    SERVER.instance.get("/pwa", g_pAuthentication.signInFromPWA, (_req, res) => res.redirect("/pwa/app.html"));
    SERVER.instance.use("/serviceWorker.js", g_pExpress.static(__dirname + "/serviceWorker.js"));
}