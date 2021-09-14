
const isEmpty = function(_deck)
{
    return _deck == undefined || Object.keys(_deck).length === 0;
};

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

const extractMinorItems = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.Secondary.toLowerCase() === "minor item" || card.isQuest || card.isStartable;
    });
};


const extractHazards = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.alignment.toLowerCase() === "neutral";
    });
};

const removeAvatars = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.Secondary === "Avatar" && card.type === "Character";
    });
};

const extractMarshallingPoints = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.type !== undefined && card.type === "Resource" && card.MPs !== undefined && card.MPs !== 0;
    });
};

const extractCharacters = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.type !== undefined && card.type === "Character";
    });
};

const extractCharactersSpecial = function(jDeck, pCardRepository)
{
    return res = extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.type !== undefined && card.code === "Fram Framson (TD)";
    });
};

const extractCharactersMindMin7 = function(jDeck, pCardRepository)
{
    return extractBySecondary(jDeck, pCardRepository, function(card) 
    {
        return card.type === "Character" && card.Mind !== undefined && card.Mind >= 6;
    });
};

const copyGenericCards = function(res, jDeck)
{
    if (isEmpty(jDeck) || res === undefined)
        return 0;

    let nAdded = 0;
    let count, _code;
    for(let k in jDeck)
    {
        count = jDeck[k];
        if (count === 0)
            continue;

        _code = k.replace(/"/g, '');
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

const validateDeck = function(jDeck)
{
    if (isEmpty(jDeck))
        return null;
    
    let res = {
        pool : {},
        playdeck : {},
        sideboard : {}
    }

    let count = 0;
    
    count += copyGenericCards(res.pool, jDeck.pool);
    count += copyGenericCards(res.sideboard, jDeck.sideboard);

    count += copyGenericCards(res.playdeck, jDeck.chars);
    count += copyGenericCards(res.playdeck, jDeck.resources);
    count += copyGenericCards(res.playdeck, jDeck.hazards);

    if (count === 0)
        return null;
    else
        return res;
}

exports.validate = validateDeck;

exports.validateArda = function(jDeck, pCardRepository)
{
    jDeck = jDeck === null ? null : validateDeck(jDeck);
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

exports.validateSingleplayer = function(jDeck, pCardRepository)
{
    jDeck = jDeck === null ? null : validateDeck(jDeck);
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
