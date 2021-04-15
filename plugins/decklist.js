
module.exports = 
{
    load : function(pDeckLoader, sDir) 
    {
        let decks = [];

        _load(pDeckLoader, "DC Challenge Decks", sDir + "/data/decks/cddc", "CDDC -", decks);
        _load(pDeckLoader, "FirstFolk Sample Decks", sDir + "/data/decks/firstfolk", "MEFB - ", decks);
        _load(pDeckLoader, "Standard Challenge Decks", sDir + "/data/decks/standard", "", decks);

        return decks;
    }

}


function _load(pDeckLoader, name, dir, sReplace, list)
{
    let _data = pDeckLoader.getDecks(dir, sReplace);
    if (_data !== null)
    {
        list.push({
            name: name,
            decks : _data
        });
    }

}