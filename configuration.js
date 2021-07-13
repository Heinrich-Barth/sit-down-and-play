
const loadConfig = function(sLocalConfig)
{
    try
    {
        if (sLocalConfig !== undefined && sLocalConfig !== "")
        {
            let data = require('fs').readFileSync(sLocalConfig, 'utf8');
            console.log("Loading custom app configuration.");
            return JSON.parse(data);
        }
    }
    catch (er)
    {

    }

    return {
        
        "port": process.env.PORT || 8080,
        "image_domain" : process.env.DOMAIN,
        "image_path" : process.env.IMAGE_PATH,
        "imageExpires": 3600, //8640000,
        "maxRooms" : process.env.ROOMS,
        "maxPlayersPerRoom" : process.env.PLAYER,
        "cspReportUri" : "",
        "cardsUrl" : process.env.CARDURL
    }
}

const isProd = process.env.NODE_ENV === "production";

const Configuration = {

    pConfig : loadConfig(__dirname + "/data/config.json"),

    port : function()
    {
        return this.pConfig.port;
    },

    maxRooms : function()
    {
        return this.pConfig.maxRooms;
    },

    maxPlayersPerRoom : function()
    {
        return this.pConfig.maxPlayersPerRoom;
    },
    
    isProduction : function()
    {
        return isProd;
    },

    imageExpires : function()
    {
        return this.pConfig.imageExpires;
    },

    imageUrl : function()
    {
        return this.pConfig.image_path;
    },

    imageDomain : function()
    {
        return this.pConfig.image_domain;
    },

    cspReportUri : function()
    {
        return this.pConfig.cspReportUri;
    },

    cardUrl : function()
    {
        return this.pConfig.cardsUrl;
    }
};

module.exports = Configuration;
