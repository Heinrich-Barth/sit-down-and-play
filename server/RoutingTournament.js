const ResultToken = require("../game-management/ResultToken");
const ServerModule = require("../Server");
const g_pExpress = require('express');

const validateToken = function(req, res)
{
    const isValid = req.body && typeof req.body.token === "string" && ResultToken.validate(req.body.token);
    if (isValid)
        res.status(204).send("");
    else
        res.status(500).send("");
}

module.exports = function()
{
    const pageDir = __dirname + "/../pages";
    ServerModule.Server.getServerInstance().use("/tournament", g_pExpress.static(pageDir + "/tournament.html", ServerModule.Caching.headerData.generic));
    ServerModule.Server.getServerInstance().post("/tournament/validate", validateToken);
}