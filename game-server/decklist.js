
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
const getFileList = function(sDirectory, _fs)
{
    let _list = [];
    _fs.readdirSync(sDirectory).forEach(file => _list.push(file));
    return _list;
}

/**
 * Create decks from files in given directory
 * @param {Object} _fs 
 * @param {Array} _list 
 * @param {String} sDirectory 
 * @param {String} sReplacePrefix 
 * @returns JSON
 */
const createDecks = function(_fs, _list, sDirectory, sReplacePrefix)
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

/**
 * Obtain all decks in a given directory.
 * @param {String} sDirectory 
 * @param {String} sReplacePrefix 
 * @returns Array of decks
 */
exports.getDecks = function (sDirectory, sReplacePrefix) 
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
};
