
/**
 * Load a deck
 * @param {Array} list 
 * @param {String} name 
 * @param {Object} _data 
 */
function load0(list, name, _data)
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
 * Load deck files in given directory
 * 
 * @param {Object} pDeckLoader 
 * @param {String} sDir 
 * @returns 
 */
exports.load = function(pDeckLoader, sDir) 
{
    let decks = [];

    load0(decks, "DC Challenge Decks", pDeckLoader.getDecks(sDir + "/data/decks/cddc", "CDDC -"));
    load0(decks, "Arda Decks", pDeckLoader.getDecks(sDir + "/data/decks/arda", "arda-"));
    load0(decks, "FirstFolk Sample Decks", pDeckLoader.getDecks(sDir + "/data/decks/firstfolk", "MEFB - "));
    load0(decks, "Standard Challenge Decks", pDeckLoader.getDecks(sDir + "/data/decks/standard", ""));

    return decks;
}
