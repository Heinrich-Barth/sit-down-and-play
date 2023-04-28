
const fs = require('fs');

const loadFile = function()
{
    try
    {
        const data = fs.readFileSync("./RELEASENOTES.MD", "utf-8");
        if (data === null || data === "")
            return "";
        
        const pattern = "| --- | --- |";
        const pos = data.indexOf("| --- | --- |");
        if (pos == -1)
            return "";

        return data.substring(pos + pattern.length).trim();        
    }
    catch (errIgnore)
    {

    }

    return "";
}

const splitCells = function(row)
{
    const cells = row.substring(1, row.length - 1).trim().split("|")
    return {
        type: cells[0].trim(),
        description: cells[1].trim()
    }
}

const loadRows = function(data)
{
    if (data === "")
        return [];

    const list = []

    for (let row of data.split("\n"))
    {
        if (row.indexOf("|") !== -1)
            list.push(splitCells(row))
    }

    return list;
}

const listRows = loadRows(loadFile());

module.exports = (Server) => Server.instance.get("/data/releasenotes", Server.caching.cache.jsonCallback6hrs, (_req, res) => res.status(200).json(listRows));
