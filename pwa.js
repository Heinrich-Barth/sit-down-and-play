

module.exports = function(SERVER, g_pExpress, pAuthenticator)
{
    SERVER.instance.get("/pwa/running", SERVER.caching.expires.jsonCallback, (req, res) => 
    {
        const data = {
            pwa: pAuthenticator.isSignedInPWA(req)
        };

        res.send(data).status(200);
    });

    SERVER.instance.get("/pwa", pAuthenticator.signInFromPWA, (_req, res) => res.redirect("/pwa/app.html"));
    SERVER.instance.use("/serviceWorker.js", g_pExpress.static(__dirname + "/serviceWorker.js"));
}