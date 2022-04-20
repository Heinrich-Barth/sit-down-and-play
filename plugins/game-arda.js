
const createCardEntry = function(jTarget, sName)
{
    jTarget[sName] = 1;
};

const addRingwraithsToPoolAndSideboard = function(jDeck)
{
    jDeck.pool = { };
    jDeck.sideboard = { };

    createCardEntry(jDeck.pool, "Akhôrahil the Ringwraith (LE)");
    createCardEntry(jDeck.pool, "Adûnaphel the Ringwraith (LE)");
    createCardEntry(jDeck.pool, "Dwar the Ringwraith (LE)");
    createCardEntry(jDeck.pool, "Hoarmûrath the Ringwraith (LE)");
    createCardEntry(jDeck.pool, "Indûr the Ringwraith (LE)");
    createCardEntry(jDeck.pool, "Khamûl the Ringwraith (LE)");
    createCardEntry(jDeck.pool, "Ren the Ringwraith (LE)");
    createCardEntry(jDeck.pool, "The Witch-king (LE)");
    createCardEntry(jDeck.pool, "Ûvatha the Ringwraith (LE)");
}

const isHeroDeck = function(pGameCardProvider, jDeck)
{
    if (jDeck === undefined)
        return true;

    let nHeros = 0;
    let nMinions = 0;

    for(let k in jDeck)
    {
        let count = jDeck[k];
        if (count === 0)
            continue;

        let _code = k.replace(/"/g, '');
        let card = _code === "" ? null : pGameCardProvider.getCardByCode(_code);
        if (card === null || card.alignment === undefined)
            continue;

        if ("Minion" === card.alignment)
            nMinions++;
        else if ("Hero" === card.alignment)
            nHeros++;
    }

    return nHeros >= nMinions;
};

/**
 * Add avatars to deck pool and remove others categories if necessary
 * 
 * @param {Object} pGameCardProvider 
 * @param {JSON} jDeck 
 * @param {boolean} keepOthers 
 */
exports.prepareDeck = function(pGameCardProvider, jDeck, keepOthers)
{
    if (pGameCardProvider === null || pGameCardProvider === undefined || jDeck === undefined || keepOthers === undefined)
        return;

    /** make sure the avatars are available to all players */
    if (!isHeroDeck(pGameCardProvider, jDeck.playdeck))
    {
        addRingwraithsToPoolAndSideboard(jDeck);
        jDeck.sideboard = { };
    }

    /** only the first player should have the valid arda deck */
    if (!keepOthers)
        jDeck.playdeck = {};
};
