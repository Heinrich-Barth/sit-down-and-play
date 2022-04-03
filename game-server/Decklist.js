const fs = require('fs');

/**
 * Replace the givne prefix from a name
 * @param {String} name 
 * @param {String} sPrefix 
 * @returns 
 */
const stripPrefix = function(name, sPrefix)
{
    return name === "" || sPrefix === "" ? name : name.replace(sPrefix, "");
};

/**
 * Remove the file type
 * @param {String} file 
 * @returns file name
 */
const replaceType = function(file)
{
    let nPos = file.lastIndexOf(".");
    return nPos < 1 ? file : file.substring(0, nPos);
};

/**
 * Load all files in a given directory
 * @param {String} sDirectory 
 * @param {Object} _fs 
 * @returns Array of file names
 */
const getFileList = function(sDirectory)
{
    try
    {
        let _list = [];
        fs.readdirSync(sDirectory).forEach(file => _list.push(file));
        return _list;
    }
    catch(err)
    {
        console.warn(err.message);
    }

    return [];
}

/**
 * Create decks from files in given directory
 * @param {Object} _fs 
 * @param {Array} _list 
 * @param {String} sDirectory 
 * @param {String} sReplacePrefix 
 * @returns JSON
 */
const createDecks = function(_list, sDirectory, sReplacePrefix)
{
    let decks = { };

    const nSize = _list.length;
    for (let i = 0; i < nSize; i++)
    {
        try
        {
            let name = stripPrefix(replaceType(_list[i]), sReplacePrefix).trim();
            decks[name] = JSON.parse(fs.readFileSync(sDirectory + _list[i], 'utf8'));
        }
        catch (err)
        {
            console.warn(err.message);
        }
    }
    
    return decks;
}


/**
 * Load a deck
 * @param {Array} list 
 * @param {String} name 
 * @param {Object} _data 
 */
const load0 = function(list, name, _data)
{
    if (_data !== null)
    {
        list.push({
            name: name,
            decks : _data
        });
    }
}
 
/**
 * Obtain all decks in a given directory.
 * @param {String} sDirectory 
 * @param {String} sReplacePrefix 
 * @returns Array of decks
 */
const getDecks = function (sDirectory, sReplacePrefix) 
{
    if (sDirectory === undefined || sDirectory === "")
        return [];

    if (!sDirectory.endsWith("/"))
        sDirectory += "/";

    if (sReplacePrefix === undefined)
        sReplacePrefix = "";

    
    const _list = getFileList(sDirectory);
    return createDecks(_list, sDirectory, sReplacePrefix);
};

/**
  * Load deck files in given directory
  * 
  * @param {Object} pDeckLoader 
  * @param {String} sDir 
  * @returns 
  */
exports.load = function(sDir) 
{
    let decks = [];

    try
    {
        const folders = fs.readdirSync(sDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
        for (let folder of folders)
        {
            const dir = sDir + "/" + folder;
            load0(decks, folder, getDecks(dir));
        }    
    }
    catch (err)
    {
        console.warn(err.message);
    }

    return decks;
}
 
