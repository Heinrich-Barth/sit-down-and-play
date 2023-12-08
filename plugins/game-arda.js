

/**
 * Add avatars to deck pool and remove others categories if necessary
 * 
 * @param {Object} pGameCardProvider 
 * @param {JSON} jDeck 
 * @param {boolean} keepOthers 
 */
exports.prepareDeck = function(jDeck, keepOthers)
{
    /** only the first player should have the valid arda deck */
    if (!keepOthers && jDeck !== undefined)
        jDeck.playdeck = {};
};
