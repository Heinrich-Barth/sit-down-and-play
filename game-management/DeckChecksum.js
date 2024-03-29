const crypto = require('crypto');

const CHECKSUM_SECRET = typeof process.env.SECRET_DECKCHECKSUM !== "undefined" ? process.env.SECRET_DECKCHECKSUM : "" + Date.now();

const createDecklist = function(jDeck)
{
    const targetList = [];

    for (let key in jDeck)
        createSectionList(jDeck[key], key, targetList);

    targetList.sort();
    return targetList.join("");
};

const createSectionList = function(jDeck, prefix, targetList)
{
    for (let key in jDeck)
        targetList.push(prefix + jDeck[key] + key);
};

const createChecksum = function(input)
{
    return crypto
        .createHmac('sha256', CHECKSUM_SECRET)
        .update(input, 'utf8')
        .digest('hex');
}

exports.calculateChecksum = function(jDeck)
{
    const val = createDecklist(jDeck);
    return createChecksum(val);
}