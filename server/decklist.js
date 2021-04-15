function stripPrefix(name, sPrefix)
{
    return name === "" || sPrefix === "" ? name : name.replace(sPrefix, "");
}

function replaceType(file)
{
    let nPos = file.lastIndexOf(".");
    return nPos < 1 ? file : file.substring(0, nPos);
}

function getFileList(sDirectory, _fs)
{
    let _list = [];
    _fs.readdirSync(sDirectory).forEach(file => 
    {
        _list.push(file);
    });
    return _list;
}

function createDecks(_fs, _list, sDirectory, sReplacePrefix)
{
    let decks = { };

    const nSize = _list.length;
    for (let i = 0; i < nSize; i++)
    {
        try
        {
            let name = stripPrefix(replaceType(_list[i]), sReplacePrefix).trim();
            decks[name] = JSON.parse(_fs.readFileSync(sDirectory + _list[i], 'utf8'));
        }
        catch (err)
        {
            console.log(err);
        }
    }
    
    return decks;
}

function loadDecksFromDirectory(sDirectory, sReplacePrefix) 
{
    if (sDirectory === undefined || sDirectory === "")
        return [];

    if (!sDirectory.endsWith("/"))
        sDirectory += "/";

    if (sReplacePrefix === undefined)
        sReplacePrefix = "";

    const _fs = require('fs');
    const _list = getFileList(sDirectory, _fs);
    return createDecks(_fs, _list, sDirectory, sReplacePrefix);
}


module.exports = 
{
    getDecks : function(sDirectory, sReplacePrefix) 
    {
        return loadDecksFromDirectory(sDirectory, sReplacePrefix);
    }
};
