const MapData = require("./MapData");
const MapDataUnderdeeps = require("./MapDataUnderdeeps");
const pMapData = new MapData();

module.exports = function(jsonCards, mapPositionsFile, _imageList)
{
    pMapData.init(jsonCards, mapPositionsFile);

    return {

        mapdata:  pMapData.getMapdata(),
        siteList: pMapData.getSiteList(),
        underdeeps : new MapDataUnderdeeps(jsonCards).get(_imageList)
        
    }
};