const fs = require('fs');
const Logger = require("../Logger");
const CardDataProvider = require("../plugins/CardDataProvider");
const ServerModule = require("../Server");

const g_vpDedckList = [];
const g_pDeckById = { };
const g_pDeckSummaries = { };

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
        Logger.error(err);
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
            
                g_pDeckById[deckid] = {
                    deck: content,
                    images: { }
                };
            }
        }
        catch (err)
        {
            Logger.warn(err.message);
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
        decks : _data,
        meta: { }
    });
}

const saveDeckMetadata = function(id, meta)
{
    for (let data of g_vpDedckList)
    {
        for (let key in data.decks)
        {
            if (data.decks[key] === id)
            {
                data.meta[id] = meta;
                return;
            }
        }
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
        Logger.warn(err.message);
    }

    if (g_lId > 0)
        Logger.info(g_lId + " deck(s) available");
}

const identifyCardCode = function(line)
{
    if (line.length < 3)
        return "";

    try
    {
        const val = line.substring(0, 2).trim();
        if (val === "")
            return line;

        const num = parseInt(val);
        if (num < 1)
            return "";
        
        if (num > 0)
            return line.substring(2).trim();
        else
            return line;
    }
    catch(err)
    {
        Logger.error(err);
    }

    return ""
};

const getDeckCodeList = function(content)
{
    const list = [];
    for (let line of content.split("\n"))
    {
        if (line.length < 4)
            continue;

        if (!line.endsWith(")") && !line.endsWith("]"))
            continue;

        const first = line.substring(0,1);
        if (first === "#" || first === "=")
            continue;

        const card = identifyCardCode(line).toLowerCase();
        if (card !== "" && !list.includes(card))
            list.push(card);
    }

    return list;
}

const extractPart = function(content, delim)
{
    const pattern = "#\n" + delim + "\n#";
    const pos = content.indexOf(pattern);
    if (pos === -1)
        return "";

    const pos2 = content.indexOf("\n##", pos + pattern.length);
    if (pos2 === -1)
        return content.substring(pos + pattern.length);
    else
        return content.substring(pos + pattern.length, pos2);
}

const loadDeckMetadata = function(content)
{
    const result = {
        avatar: "",
        pool: countDeck(extractPart(content, "Pool")),
        sideboard: countDeck(extractPart(content, "Pool")),
        character: 0,
        resources: 0,
        hazards: 0,
        summary: ""
    }

    const identifiers = {
        "# Hazard": "hazards",
        "# Character": "character",
        "# Resource": "resources",
    }
    
    let key = "";

    for (let line of extractPart(content, "Deck").split("\n"))
    {
        if (line.length < 4)
            continue;

        if (line.startsWith("# "))
        {
            const pos = line.lastIndexOf(" (");
            if (pos === -1)
                key = "";
            else
            {
                const _t = line.substring(0, pos).trim();
                key = identifiers[_t] === undefined ? "" : identifiers[_t];
            }
                
            continue;
        }

        if (key === "" || !line.endsWith(")") && !line.endsWith("]") || line.startsWith("="))
            continue;

        const first = line.substring(0,1);
        const val = parseInt(first);
        if (!isNaN(val))
            result[key] += val;
    }

    return result;
}

const countDeck = function(data)
{
    let count = 0;
    for (let line of data.split("\n"))
    {
        if (line.length < 4 || !line.endsWith(")") && !line.endsWith("]"))
            continue;

        const first = line.substring(0,1);
        if (first === "#" || first === "=")
            continue;

        const val = parseInt(first);
        if (!isNaN(val))
            count += val;
    }
    return count;
}

const updateCardImages = function()
{
    for (let key in g_pDeckById)
    {
        const data = g_pDeckById[key];

        const meta = loadDeckMetadata(data.deck);
        const list = getDeckCodeList(data.deck);
        for (let code of list)
        {
            const img = CardDataProvider.getImageByCode(code);
            if (typeof img === "string" && img !== "")
            {
                data.images[code] = img;

                if (meta.avatar === "" && CardDataProvider.isAvatar(code))
                    meta.avatar = img;
            }
        }

        saveDeckMetadata(key, meta);
    }
}

loadDeckList(__dirname + "/../public/decks");
updateCardImages();

exports.getDeckList = function()
{
    if (g_vpDedckList.length > 0)
        g_vpDedckList.splice(0, g_vpDedckList.length);
    
    loadDeckList(__dirname + "/../public/decks");
    console.log(g_pDeckById)
    return g_vpDedckList;
}

/**
  * Load deck files in given directory
  * 
  * @param {Object} pDeckLoader 
  * @param {String} sDir 
  * @returns 
  */
module.exports = function()
{
    if (g_lId === 0)
    {
        ServerModule.Server.getServerInstance().get("/data/decks", (_req, res) => res.json([]).status(200));
        return;
    }    

    
    ServerModule.Server.getServerInstance().get("/data/decks", ServerModule.Caching.expires.jsonCallback, (_req, res) => res.json(g_vpDedckList).status(200));
    ServerModule.Server.getServerInstance().get("/data/decks/:id", ServerModule.Caching.expires.jsonCallback, (req, res) => 
    {
        res.status(200);
        if (req.params.id && g_pDeckById[req.params.id])
            res.json(g_pDeckById[req.params.id]);
        else
            res.json({})
    });
}
 
