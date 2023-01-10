

module.exports = function(SERVER, g_pExpress, pAuthenticator)
{
    SERVER.instance.use("/pwa/app.html", pAuthenticator.signInFromPWA);
    SERVER.instance.get("/pwa/running", SERVER.caching.expires.jsonCallback, (req, res) => {
        const data = {
            pwa: pAuthenticator.isSignedInPWA(req)
        };

        res.send(data).status(200)
    });
    SERVER.instance.use("/pwa", g_pExpress.static(__dirname + "/pwa"));
}