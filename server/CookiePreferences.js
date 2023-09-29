const Logger = require("../Logger");

class CookiePreferences
{
    constructor(sPrefix)
    {
        this.available = {};
        this.prefix = sPrefix === undefined ? "" : sPrefix;
        this.isProduction = true;
    }

    setProduction(isProduction)
    {
        this.isProduction = isProduction === undefined ? true : isProduction;
    }

    addPreference(name, defaultValue)
    {
        this.available[name] = defaultValue;
    }


    getCookieValue(cookies, name, value)
    {
        return cookies === undefined || cookies[this.prefix + name] === undefined ? value : cookies[this.prefix +name];
    }

    get(cookies)
    {
        let data = {}
        for (let key in this.available)
            data[key] = this.getCookieValue(cookies, key, this.available[key]);

        return data;
    }

    getValue(cookies, name)
    {
        if (this.available[name] !== undefined)
            return this.getCookieValue(cookies, name, this.available[name]);
        else
            return "";
    }

    isAvailable(name)
    {
        return this.available[name] !== undefined;
    }

    sanatizeValue(val)
    {
        return val;
    }

    update(req, res)
    {
        try
        {
            const jData = req.body;
            const val = this.sanatizeValue(jData.value);
            if (this.isAvailable(jData.name))
                res.cookie(this.prefix + jData.name, val, this.isProduction);
        }
        catch (e)
        {
            Logger.warn(e.message);
        }
    }
}

module.exports = CookiePreferences;