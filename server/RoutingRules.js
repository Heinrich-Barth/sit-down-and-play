
exports.setup = function(SERVER, g_pExpress)
{
    const pageDir = __dirname + "/../pages";
    SERVER.instance.use("/rules/against-the-shadow", g_pExpress.static(pageDir + "/rules-against-the-shadow.html", SERVER.cacheResponseHeader));
    SERVER.instance.use("/rules/balrog", g_pExpress.static(pageDir + "/rules-balrog.html", SERVER.cacheResponseHeader));
    SERVER.instance.use("/rules/dark-minions", g_pExpress.static(pageDir + "/rules-dark-minions.html", SERVER.cacheResponseHeader));
    SERVER.instance.use("/rules/dragons", g_pExpress.static(pageDir + "/rules-dragons.html", SERVER.cacheResponseHeader));
    SERVER.instance.use("/rules/lidless-eye", g_pExpress.static(pageDir + "/rules-lidless-eye.html", SERVER.cacheResponseHeader));
    SERVER.instance.use("/rules/white-hand", g_pExpress.static(pageDir + "/rules-white-hand.html", SERVER.cacheResponseHeader));
    SERVER.instance.use("/rules/wizards", g_pExpress.static(pageDir + "/rules-wizards.html", SERVER.cacheResponseHeader));
    SERVER.instance.use("/rules/arda", g_pExpress.static(pageDir + "/rules-arda.html", SERVER.cacheResponseHeader));
}