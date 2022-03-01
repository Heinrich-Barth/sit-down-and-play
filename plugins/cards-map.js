

const MapData = require("./MapData");
const pMapData = new MapData();

exports.init = function(jsonCards, mapPositionsFile)
{
    pMapData.init(jsonCards, mapPositionsFile);
}

exports.getMapdata = function(_imageList)
{
    const data = pMapData.getMapdata();
    data.images = _imageList;
    return data;
};

exports.getSiteList = () => pMapData.getSiteList();
