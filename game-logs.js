const fs = require("fs");
const ServerModule = require("./Server");
const g_pExpress = require('express');

const GameLogs = {

    _timeLogs : 0,
    _listLogs : [],

    useCache : function()
    {
        return Date.now() - this._timeLogs < 1000 * 60;
    },

    getLogs : function()
    {
        if (!this.useCache())
            this.updateLogs();
        
        return this._listLogs;
    },

    updateLogs : function()
    {
        fs.readdir("logs", (err, files) => {
    
            if (err)
            {
                console.error(err.message);
                return;
            }

            let list = [];
            files.forEach(file => 
            {
                if (file.endsWith(".txt"))
                    list.push(file);
            });
            
            this._timeLogs = Date.now();
            this._listLogs = list;
        });
    }
}

GameLogs.updateLogs();

module.exports = function()
{
    ServerModule.Server.getServerInstance().use("/logs", g_pExpress.static("logs"));
    ServerModule.Server.getServerInstance().get("/games/history", (_req, res) => res.status(200).json(GameLogs.getLogs()));
}
