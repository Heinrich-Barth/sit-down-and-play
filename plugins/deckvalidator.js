
const isEmpty = function(_deck)
{
    return _deck == undefined || Object.keys(_deck).length === 0;
};

const copyGenericCards = function(jDeck, pCardRepository)
{
    let res = { };

    let count;
    for(let k in jDeck)
    {
        count = jDeck[k];
        if (count < 1)
            continue;
        
        let _code = k.replace(/"/g, '');
        res[_code] = {
            count: count,
            code: _code,
            type: pCardRepository.getCardType(_code)
        }
    }

    return res;
};


exports.validate = function(jDeck, pCardRepository)
{
    if (jDeck === undefined || isEmpty(jDeck.pool) || isEmpty(jDeck.chars) || (isEmpty(jDeck.hazards) && isEmpty(jDeck.resources)))
        return null;
    else
        return {
            pool: copyGenericCards(jDeck.pool, pCardRepository),
            sideboard: copyGenericCards(jDeck.sideboard, pCardRepository),
            chars : copyGenericCards(jDeck.chars, pCardRepository),
            resources : copyGenericCards(jDeck.hazards, pCardRepository),
            hazards : copyGenericCards(jDeck.resources, pCardRepository)
        };
};