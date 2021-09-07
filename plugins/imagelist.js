

let g_ImageList = {};
let g_QuestList = {};

let g_nCountErrataDC = 0;
let g_nCountErrataIC = 0;

const removeEndingSlash = function(imageUrl)
{
    if (imageUrl.endsWith("/"))
        return imageUrl.substring(0, imageUrl.length - 1);
    else
        return imageUrl;
};

const createImageUrl = function(imageName, setCode, imageUrl)
{
    return imageUrl + "/" + setCode + "/" + imageName;
};

const imageListJson = function(card, imageUrl) 
{
    let isDCErratum = card.erratum !== undefined && card.erratum === true;
    let isICErratum = card.ice_errata !== undefined && card.ice_errata === true;
    
    if (isDCErratum)
        g_nCountErrataDC++;

    if (isICErratum)
        g_nCountErrataIC++;

    return {
        title: card.title,
        image: createImageUrl(card.ImageName, card.set_code.toUpperCase(), imageUrl),
        errata_dc : !isDCErratum ? "" : createImageUrl("dce-" + card.ImageName, card.set_code.toUpperCase(), imageUrl),
        errata_ic : !isICErratum  ? "" : createImageUrl("ice-" + card.ImageName, card.set_code.toUpperCase(), imageUrl),
        set_code: card.set_code.toUpperCase()
    };
};

const createImageList = function (jsonCards, imageUrl) 
{
    let list = {};

    for (let card of jsonCards) 
        list[card.code] = imageListJson(card, imageUrl);

    console.log("\t-image url prefix: " + imageUrl);
    console.log("\t-IC errata images available: " + g_nCountErrataIC);
    console.log("\t-DC errata images available: " + g_nCountErrataDC);

    return list;
};

exports.init = function(jsonCards, imageUrl)
{
    if (imageUrl === undefined)
        imageUrl = "";

    g_ImageList = createImageList(jsonCards, removeEndingSlash(imageUrl));
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