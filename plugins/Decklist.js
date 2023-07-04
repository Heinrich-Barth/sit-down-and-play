const fs = require('fs');

const g_vpDedckList = [];
const g_pDeckById = { };
let g_lId = 0;
const g_pId = require("crypto").randomUUID().toString();

const requireDeckId = function()
{
    return g_pId + "-" + (++g_lId);
}

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
    const decks = { };
    for (let file of _list)
    {
        try
        {
            const deckid = requireDeckId();
            const content = fs.readFileSync(sDirectory + file, 'utf8');

            if (content.indexOf("#") !== -1)
            {
                const name = stripPrefix(replaceType(file), sReplacePrefix).trim();
                decks[name] = deckid;
            
                g_pDeckById[deckid] = content;
            }
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
const load0 = function(name, _data)
{
    g_vpDedckList.push({
        name: name,
        decks : _data
    });
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
        return {};

    if (!sDirectory.endsWith("/"))
        sDirectory += "/";

    if (sReplacePrefix === undefined)
        sReplacePrefix = "";
    
    const _list = getFileList(sDirectory);
    return createDecks(_list, sDirectory, sReplacePrefix);
};

const loadDeckList = function(sDir)
{
    try
    {
        const folders = fs.readdirSync(sDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
        for (let folder of folders)
        {
            const dir = sDir + "/" + folder;
            load0(folder, getDecks(dir));
        }    
    }
    catch (err)
    {
        console.warn(err.message);
    }

    if (g_lId > 0)
        console.info(g_lId + " deck(s) available");
}

loadDeckList(__dirname + "/../public/decks");

/**
  * Load deck files in given directory
  * 
  * @param {Object} pDeckLoader 
  * @param {String} sDir 
  * @returns 
  */
exports.load = function(SERVER)
{
    if (g_lId === 0)
    {
        SERVER.instance.get("/data/decks", (_req, res) => res.json([]).status(200));
    }
    else
    {
        SERVER.instance.get("/data/decks", SERVER.caching.expires.jsonCallback, (_req, res) => res.json(g_vpDedckList).status(200));
        SERVER.instance.get("/data/decks/:id", SERVER.caching.expires.jsonCallback, (req, res) => 
        {
            res.setHeader('content-type', 'text/plain');
            res.status(200);
            if (req.params.id && g_pDeckById[req.params.id])
                res.send(g_pDeckById[req.params.id]);
            else
                res.send("");
        });
    }
}
 
