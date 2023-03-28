const ResultToken = require("../game-management/ResultToken");

const validateToken = function(req, res)
{
    const isValid = req.body && typeof req.body.token === "string" && ResultToken.validate(req.body.token);
    if (isValid)
        res.status(204).send("");
    else
        res.status(500).send("");
}

module.exports = function(SERVER, g_pExpress)
{
    const pageDir = __dirname + "/../pages";
    SERVER.instance.use("/tournament", g_pExpress.static(pageDir + "/tournament.html", SERVER.caching.headerData.generic));
    SERVER.instance.post("/tournament/validate", validateToken);
}