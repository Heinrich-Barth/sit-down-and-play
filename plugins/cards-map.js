

const MapData = require("./MapData");
const pMapData = new MapData();

exports.init = function(jsonCards)
{
    pMapData.init(jsonCards, "./data/map-positions.json");
}

exports.getMapdata = function(_imageList)
{
    const data = pMapData.getMapdata();
    data.images = _imageList;
    return data;
};

exports.getSiteList = () => pMapData.getSiteList();
