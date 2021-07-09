
function loadConfig(sLocalConfig)
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

module.exports = {
    
    load : function (sLocalConfig, NODE_ENV)
    {
        const isProd = NODE_ENV === "production";

        let jConfig = loadConfig(sLocalConfig);
        return {

            port : function()
            {
                return jConfig.port;
            },

            maxRooms : function()
            {
                return jConfig.maxRooms;
            },

            maxPlayersPerRoom : function()
            {
                return jConfig.maxPlayersPerRoom;
            },
            
            isProduction : function()
            {
                return isProd;
            },

            imageExpires : function()
            {
                return jConfig.imageExpires;
            },

            imageUrl : function()
            {
                return jConfig.image_path;
            },

            imageDomain : function()
            {
                return jConfig.image_domain;
            },

            cspReportUri : function()
            {
                return jConfig.cspReportUri;
            },

            cardUrl : function()
            {
                return jConfig.cardsUrl;
            }
        }
    }
};
