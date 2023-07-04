const fs = require("fs");

class Configuration {

    constructor()
    {
        this._csp_header = "";
        this._csp_self = "";
        this._isProd = process.env.NODE_ENV === "production";

        this._maxRooms = Configuration.assertString(process.env.ROOMS, 10);
        this._maxPlayersPerRoom = Configuration.assertString(process.env.PLAYER, 10);

        this._port = Configuration.assertString(process.env.PORT, 8080);

        if(Configuration.checkHasLocalImages())
        {
            this._hasLocaLImages = true;
            this._imageUrl = "/data-images";
        }
        else
        {
            this._hasLocaLImages = false;
            this._imageUrl = Configuration.assertUrlOrDirectory(process.env.IMAGE_PATH);
        }
        
        if (Configuration.hasLocalCardJson())
        {
            this._hasLocaLCards = true;
            this._cardsUrl = __dirname + "/data-local/cards.json";
        }
        else
        {
            this._hasLocaLCards = false;
            this._cardsUrl = Configuration.assertUrlOrDataDirectory(process.env.CARDURL, "/data/cards.json");
        }

        this._mapPositions = Configuration.obtainMapPositionFile();
    }

    getRequestTimeout()
    {
        try
        {
            const sTimeout = process.env.REQ_TIMEOUT !== undefined ? process.env.REQ_TIMEOUT : "";
            const seconds = sTimeout === "" ? 0 : parseInt(sTimeout);
            if (seconds > 0)
                return seconds;   
        }
        catch(error)
        {
            console.error(error);
        }

        return 20;
    }
    
    static obtainMapPositionFile()
    {
        try
        {
            if (fs.existsSync(__dirname + "/data/map-positions.json"))
                return __dirname + "/data/map-positions.json";
            else if (fs.existsSync(__dirname + "/data-local/map-positions.json"))
                return __dirname + "/data-local/map-positions.json";
            else
                return "";
        }
        catch (err)
        {
            console.warn(err);
        }
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
        if (json === null)
            return;

        if (this.isValid(json.image_path))
            this._imageUrl = json.image_path;

        if (this.isValid(json.cardsUrl) && !this._hasLocaLCards)
            this._cardsUrl = json.cardsUrl;
    }

    readJson(sFile)
    {
        try
        {
            return JSON.parse(fs.readFileSync(sFile, 'utf8'));
        }
        catch (err)
        {
            console.warn(err.message);
        }

        return null;
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
            return sInput;
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

    getCspImageValue()
    {
        const val = this.readJson(__dirname + "/data-local/csp-data.json");
        if (val === null || val.image == undefined || val.image == null || val.image.indexOf("\"") !== -1)
            return "";
        else
            return val.image;
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
                "media-src": "'self'",
                "script-src": "'self' 'nonce-START'",
                "frame-src": "'self'",
                "manifest-src": "'self'",
                "img-src": "'self' data: " + this.imageDomain(),
                "report-uri": "/csp-violation"
            };

            jEntries["img-src"] += " " + this.getCspImageValue();
            jEntries["img-src"] = jEntries["img-src"].trim();

            jEntries["connect-src"] += " " + this.getCspImageValue();
            jEntries["connect-src"] = jEntries["connect-src"].trim();

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
                "media-src": "'self'",
                "style-src": "'self'",
                "img-src": "'self'",
                "manifest-src": "'self'",
                "report-uri": "/csp-violation"
            };
            
            this._csp_self = this.joinMap(jEntries);
        }

        return this._csp_self;
    }

    static checkHasLocalImages()
    {
        return fs.existsSync(__dirname + "/data-local") && fs.existsSync(__dirname + "/data-local/images");
    }

    static hasLocalCardJson()
    {
        return fs.existsSync(__dirname + "/data-local") && fs.existsSync(__dirname + "/data-local/cards.json");
    }

    useLocalImages()
    {
        return this._hasLocaLImages;
    }
}

module.exports = Configuration;
