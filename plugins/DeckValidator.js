
/**
 * Check if given object is empty
 * @param {Object} _deck 
 * @returns 
 */
const isEmpty = function(_deck)
{
    return _deck == undefined || Object.keys(_deck).length === 0;
};

/**
 * Get a list of given field values by code (e.g. for filter list)
 * @param {JSON} jDeck Deck
 * @param {Object} pCardRepository Repository
 * @param {Function} isMatcher Match Function
 * @returns 
 */
const extractBySecondary = function(jDeck, pCardRepository, isMatcher)
{
    let res = { };

    const keys = Object.keys(jDeck);
    for(let _key of keys)
    {
        let _code = _key.replace(/"/g, '');
        
        const card = pCardRepository.getCardByCode(_code);
        if (card !== null && isMatcher(card))
        {
            res[_code] = jDeck[_key];
            delete jDeck[_key];
        }
    }

    return res;
};

/**
 * Extract all minor items
 * @param {JSON} jDeck Deck
 * @param {Object} pCardRepository Repository
 * @returns 
 */
const extractMinorItems = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.Secondary.toLowerCase() === "minor item" || card.isQuest || card.isStartable;
    });
};

/**
 * Extract all Hazards
 * @param {JSON} jDeck Deck
 * @param {Object} pCardRepository Repository
 * @returns 
 */
const extractHazards = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.alignment.toLowerCase() === "neutral" || (card.type !== undefined && card.type === "Hazard");
    });
};

/**
 * Extract all Avatars
 * @param {JSON} jDeck Deck
 * @param {Object} pCardRepository Repository
 * @returns 
 */
 const removeAvatars = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.Secondary === "Avatar" && card.type === "Character";
    });
};

/**
 * Extract all marshalling points
 * 
 * @param {JSON} jDeck Deck
 * @param {Object} pCardRepository Repository
 * @returns 
 */
 const extractMarshallingPoints = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.type !== undefined && card.type === "Resource" && card.MPs !== undefined && card.MPs !== 0;
    });
};

/**
 * Extract all characters
 * 
 * @param {JSON} jDeck Deck
 * @param {Object} pCardRepository Repository
 * @returns 
 */
const extractCharacters = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.type !== undefined && card.type === "Character";
    });
};


/**
 * Extract all special characters
 * 
 * @param {JSON} jDeck Deck
 * @param {Object} pCardRepository Repository
 * @returns 
 */
const extractCharactersSpecial = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.type !== undefined && card.code === "fram framson (td)";
    });
};

/**
 * Extract all characters with mind of 7+
 * 
 * @param {JSON} jDeck Deck
 * @param {Object} pCardRepository Repository
 * @returns 
 */
const extractCharactersMindMin7 = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.type === "Character" && card.Mind !== undefined && card.Mind >= 6;
    });
};

const copyGenericCards = function(res, jDeck, pCardRepository)
{
    if (isEmpty(jDeck) || res === undefined || pCardRepository === undefined)
        return 0;

    let nAdded = 0;
    let count, _code;
    for(let k in jDeck)
    {
        count = jDeck[k];
        if (count === 0)
            continue;

        _code = pCardRepository.getVerifiedCardCode(k.replace(/"/g, '').toLowerCase());
        if (_code === "")
            continue;        

        if (res[_code] === undefined)
            res[_code] = count;
        else
            res[_code] += count;

        nAdded += count;
    }

    return nAdded;
};

/**
 * Validate a given deck
 * 
 * @param {Object} jDeck 
 * @returns Object or NULL
 */
const validateDeck = function(jDeck, pCardRepository)
{
    if (isEmpty(jDeck))
        return null;
    
    let res = {
        pool : {},
        playdeck : {},
        sideboard : {}
    }

    let count = 0;
    
    count += copyGenericCards(res.pool, jDeck.pool, pCardRepository);
    count += copyGenericCards(res.sideboard, jDeck.sideboard, pCardRepository);

    count += copyGenericCards(res.playdeck, jDeck.chars, pCardRepository);
    count += copyGenericCards(res.playdeck, jDeck.resources, pCardRepository);
    count += copyGenericCards(res.playdeck, jDeck.hazards, pCardRepository);

    return count === 0 ? null : res;
};

/**
 * Validate a given deck
 * @param {JSON} jDeck 
 * @returns Deck or NULL
 */
exports.validate = validateDeck;

/**
 * Validate an ARDA deck
 * @param {JSON} jDeck 
 * @param {Object} pCardRepository 
 * @returns Deck or NULL
 */
exports.validateArda = function(jDeck, pCardRepository)
{
    jDeck = jDeck === null ? null : validateDeck(jDeck, pCardRepository);
    if (jDeck !== null)
    {
        /** make sure there are no avatars in the playdeck anymore */
        removeAvatars(jDeck.playdeck, pCardRepository);

        jDeck.minors = extractMinorItems(jDeck.playdeck, pCardRepository);
        jDeck.mps = extractMarshallingPoints(jDeck.playdeck, pCardRepository);
        jDeck.chars_special = extractCharactersSpecial(jDeck.playdeck, pCardRepository);
        jDeck.chars_mind7 = extractCharactersMindMin7(jDeck.playdeck, pCardRepository);
        jDeck.chars_others = extractCharacters(jDeck.playdeck, pCardRepository);

        console.log("Arda deck summary:");
        console.log("- Minor Items: " + Object.keys(jDeck.minors).length);
        console.log("- Marshalling point cards: " + Object.keys(jDeck.mps).length);
        console.log("- Characters with mind of > 5: " + Object.keys(jDeck.chars_mind7).length);
        console.log("- Characters with mind of < 6: " + (Object.keys(jDeck.chars_others).length + Object.keys(jDeck.chars_special).length));
        console.log("- Cards in playdeck: " + Object.keys(jDeck.playdeck).length);
    }

    return jDeck;
};

/**
 * Validate a singleplayer deck
 * 
 * @param {JSON} jDeck 
 * @param {Object} pCardRepository 
 * @returns Deck or NULL
 */
exports.validateSingleplayer = function(jDeck, pCardRepository)
{
    jDeck = jDeck === null ? null : validateDeck(jDeck, pCardRepository);
    if (jDeck !== null)
    {
        jDeck.minors = { };
        jDeck.chars_special = { };
        jDeck.chars_mind7 = { };
        jDeck.chars_others = { }
        jDeck.mps = extractHazards(jDeck.playdeck, pCardRepository);
    }

    return jDeck;
};
