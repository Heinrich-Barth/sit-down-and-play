

const MapData = require("./MapData");
const MapDataUnderdeeps = require("./MapDataUnderdeeps");

const pMapData = new MapData();
let pMapDataUnderDeeps = null;
let g_UnderdeepJson = MapDataUnderdeeps.getEmptyResult();

exports.init = function(jsonCards, mapPositionsFile)
{
    pMapData.init(jsonCards, mapPositionsFile);

    pMapDataUnderDeeps = new MapDataUnderdeeps(jsonCards);
};

exports.getMapdata = function(_imageList)
{
    const data = pMapData.getMapdata();
    data.images = _imageList;
    return data;
};

exports.getSiteList = () => pMapData.getSiteList();

exports.getUnderdeepsData = function(_imageList)
{
    if (pMapDataUnderDeeps !== null)
    {
        g_UnderdeepJson = pMapDataUnderDeeps.get(_imageList);
        pMapDataUnderDeeps = null;
    }

    return g_UnderdeepJson;
} 