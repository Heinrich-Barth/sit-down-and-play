
const createCardEntry = function(jTarget, sName)
{
    jTarget[sName] = 1;
};

const addAvatarsToPool = function(jDeck)
{
    jDeck.pool = { };

    createCardEntry(jDeck.pool, "Alatar [H] (TW)");
    createCardEntry(jDeck.pool, "Gandalf [H] (TW)");
    createCardEntry(jDeck.pool, "Pallando [H] (TW)");
    createCardEntry(jDeck.pool, "Radagast [H] (TW)");
    createCardEntry(jDeck.pool, "Saruman [H] (TW)");
};

const organizeArdaCards = function(jDeck)
{
    jDeck.sideboard = { };
};

const clearNonPool = function(jDeck)
{
    jDeck.sideboard = {};
    jDeck.playdeck = {};
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
    addAvatarsToPool(jDeck);

    /** only the first player should have the valid arda deck */
    if (!keepOthers)
        clearNonPool(jDeck);
    else
        organizeArdaCards(jDeck);
};

exports.onDeckAdded = function(playerId, PLAYBOARD_MANAGER)
{
    /** 
     * 
     */
};