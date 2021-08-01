

let g_ImageList = {};
let g_QuestList = {};

let g_nCountErrataDC = 0;
let g_nCountErrataIC = 0;

const imageListJson = function(card) 
{
    let isDCErratum = card.erratum !== undefined && card.erratum === true;
    let isICErratum = card.ice_errata !== undefined && card.ice_errata === true;
    
    if (isDCErratum)
        g_nCountErrataDC++;

    if (isICErratum)
        g_nCountErrataIC++;

    return {
        title: card.title,
        image: card.ImageName,
        errata_dc : isDCErratum,
        errata_ic : isICErratum,
        set_code: card.set_code.toUpperCase()
    };
}

const createImageList = function (jsonCards) 
{
    let list = {};

    for (let card of jsonCards) 
        list[card.code] = imageListJson(card);

    console.log("\t- IC errata images available: " + g_nCountErrataIC);
    console.log("\t- DC errata images available: " + g_nCountErrataDC);

    return list;
};

exports.init = function(jsonCards)
{
    g_ImageList = createImageList(jsonCards);
    g_QuestList = require("./cards-quests").identifyQuests(jsonCards);
};

exports.getImages = () => g_ImageList;

exports.getList = function()
{
    return {
        images: g_ImageList,
        fliped : g_QuestList
    };
};