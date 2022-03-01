

class Configuration {

    constructor(sLocalConfig)
    {
        const lNow = Date.now();
        const lImageExpires = 8640000;

        this._startupTime = lNow;
        this._expiresDate = new Date(lNow).toUTCString();
        this._expiresTime = lNow;
        this._imageExpires = lImageExpires; 
        this._cacheDate = new Date(lNow + (lImageExpires * 1000)).toUTCString();
        this._csp_header = "";
        this._csp_self = "";

        this._isProd = process.env.NODE_ENV === "production";

        this._maxRooms = Configuration.assertString(process.env.ROOMS, 10);
        this._maxPlayersPerRoom = Configuration.assertString(process.env.PLAYER, 10);

        this._port = Configuration.assertString(process.env.PORT, 8080);
        this._deckDirectory = Configuration.assertString(process.env.DECKLISTFOLDER, "/data/decks");

        this._imageUrl = Configuration.assertUrlOrDirectory(process.env.IMAGE_PATH);
        this._cardsUrl = Configuration.assertUrlOrDataDirectory(process.env.CARDURL, "cards.json");
        this._mapPositions = Configuration.assertUrlOrDataDirectory(process.env.MAPPOS, "map-positions.json");

        if (sLocalConfig !== undefined && sLocalConfig !== "")
            this.loadConfig(sLocalConfig);
    }

    static assertString(input, def)
    {
        if (input === undefined || input === "")
            return def === undefined ? "" : def;
        else
            return input;
    }

    static assertUrlOrDirectory(input)
    {
        let val = Configuration.assertString(input, "");
        if (val === "" || val.indexOf("..") !== -1)
            return "";
        else if (val.indexOf("//") > -1)
            return val;
        else if (val.startsWith("/"))
            return __dirname + val;
        else 
            return __dirname + "/" + val;
    }

    static assertUrlOrDataDirectory(input, def)
    {
        let val = Configuration.assertString(input, def);
        if (val.indexOf("//") > -1)
            return val;
        else if (val.startsWith("/"))
            return __dirname + val;
        else
            return __dirname + "/" + val;
    }

    isValid(input)
    {
        return input !== null && input !== undefined && input !== "";
    }

    loadFromJson(json)
    {
        if (this.isValid(json.image_path))
            this._imageUrl = json.image_path;

        if (this.isValid(json.cardsUrl))
            this._cardsUrl = json.cardsUrl;
    }

    loadConfig(sLocalConfig)
    {
        try
        {
            let data = require('fs').readFileSync(sLocalConfig, 'utf8');
            console.log("Loading custom app configuration.");
            this.loadFromJson(JSON.parse(data));
        }
        catch (er)
        {
    
        }
    }

    mapPositionsFile()
    {
        return this._mapPositions;
    }

    port()
    {
        return this._port;
    }

    maxRooms()
    {
        return this._maxRooms;
    }

    maxPlayersPerRoom()
    {
        return this._maxPlayersPerRoom;
    }
    
    isProduction()
    {
        return this._isProd;
    }

    imageExpires()
    {
        return this._imageExpires;
    }

    hasLocalImages()
    {
        return this._imageUrl !== "" && this._imageUrl.indexOf("//") === -1;
    }

    imageFolder()
    {
        return this._imageUrl.indexOf("//") !== -1 ? "" : this._imageUrl;
    }

    imageUrl()
    {
        return this._imageUrl.indexOf("//") !== -1 ? this._imageUrl : "/data/images";
    }

    deckListFolder()
    {
        if (this._deckDirectory.startsWith("/"))
            return __dirname + this._deckDirectory;
        else 
            return __dirname + "/" + this._deckDirectory;
    }

    static extractDomain(sInput)
    {
        if (sInput === undefined || sInput === null || sInput.trim() === "")
            return "";

        let pos = sInput.indexOf("://");
        if (pos === -1)
            return "";
        else
            pos += 4;

        pos = sInput.indexOf("/", pos);
        if (pos === -1)
            return "";
        else
            return sInput.substring(0, pos).trim();        
    }

    imageDomain()
    {
        return Configuration.extractDomain(this._imageUrl);
    }

    /**
     * URL to load cards JSON 
     * @returns String
     */
    cardUrl()
    {
        return this._cardsUrl;
    }

    startupTime()
    {
        return this._startupTime;
    }

    expiresDate()
    {
        return this._expiresDate;
    }

    expiresTime()
    {
        return this._expiresTime;
    }

    cacheDate()
    {
        return this._cacheDate;
    }

    joinMap(jEntries)
    {
        let sVal = "";
        for (let key in jEntries) 
        {
            if (jEntries[key] !== "")
                sVal += key + " " + jEntries[key] + "; ";
        }
        
        return sVal.trim();
    }

    createContentSecurityPolicyMegaAdditionals()
    {
        this._csp_header = "";
        this._csp_self = "";

        if (this._csp_header === "")
        {
            const jEntries = {
                "default-src" : "'none'",
                "style-src": "'self'",
                "connect-src": "'self'",
                "font-src": "'self'",
                "script-src": "'self' 'nonce-START'",
                "frame-src": "'self'",
                "img-src": "'self' " + this.imageDomain(),
                "report-uri": "/csp-violation"
            };
            
            this._csp_header = this.joinMap(jEntries);                
        }

        return this._csp_header;
    }

    createContentSecurityPolicySelfOnly()
    {
        if (this._csp_self === "")
        {
            const jEntries = {
                "default-src": "'none'",
                "font-src": "'self'",
                "script-src": "'self'",
                "connect-src": "'self'",
                "style-src": "'self'",
                "img-src": "'self'",
                "report-uri": "/csp-violation"
            };
            
            this._csp_self = this.joinMap(jEntries);
        }

        return this._csp_self;
    }
    
}

module.exports = Configuration;