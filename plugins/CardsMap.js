


module.exports = function(jsonCards, mapPositionsFile, _imageList)
{
    const MapData = require("./MapData");
    const MapDataUnderdeeps = require("./MapDataUnderdeeps");

    const pMapData = new MapData();
    pMapData.init(jsonCards, mapPositionsFile);
    const jUnderdeepJson = new MapDataUnderdeeps(jsonCards).get(_imageList);

    return {

        mapdata:  pMapData.getMapdata(),
        siteList: pMapData.getSiteList(),
        underdeeps : jUnderdeepJson
        
    }
};