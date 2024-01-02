const fs = require("fs");

const loadList = function()
{
    try
    {
        const data = fs.readFileSync(__dirname + "/../data-local/stage-codes.json", "utf-8").toLowerCase();
        const val = JSON.parse(data);
        if (Array.isArray(val))
            return val;
    }
    catch (ex)
    {
        console.warn(ex);
    }

    return [];
}

const addKeyword = function(card)
{
    const sWord = "stage resource";
    if (card.keywords === null || card.keywords === undefined)
    {
        card.keywords = [sWord];
    }
    else if (Array.isArray(card.keywords))
    {
        card.keywords.push(sWord)
        card.keywords.sort();
    }
}

const addStageKeywordsToList = function(cards)
{
    const stages = loadList();
    if (stages.length === 0 || cards.length === 0)
        return 0;

    let count = 0;
    for (let card of cards)
    {
        if (stages.includes(card.code.toLowerCase()))
        {
            addKeyword(card);
            count++;
        }
    }

    return count;
}


exports.addStageCodes = function(cards)
{
    return addStageKeywordsToList(cards);
}