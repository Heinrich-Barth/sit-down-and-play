const ClearCookies = require("./ClearCookies");

const UTILS = require("../meccg-utils");

class GamePlayRouteHandlerUtil
{
    constructor(pServer, context)
    {
        this.m_pServerInstance = pServer;
        this.startupTime = pServer.startupTime;
        this.contextPlay = context;
    }    

    clearCookies(req, res)
    {
        ClearCookies.clearCookies(req, res);
    }

    clearSocialMediaCookies(res)
    {        
        res.clearCookie('socialMedia');
        res.clearCookie('socialMediaPers');    
    }

    onValidateGameCookies(req, res, next)
    {
        /** 
         * Check if player has never been in this room before.
         * Forward to login page for deck selection and display name
         */
        if (!this.validateCookies(req)) 
            res.redirect(this.contextPlay + req.room + "/login");
        else
            next();
    }

    userIsAlreadyInGame(req)
    {
        return this.validateCookies(req);
    }

    onVerifyGameRoomParam(req, res, next)
    {
        const room = req.params === undefined || req.params.room === undefined ? "" : req.params.room.toLocaleLowerCase();
        if (UTILS.isAlphaNumeric(room))
        {
            req.room = room;
            next();
        }
        else
            this.createExpireResponse(res).redirect("/error");
    }

    /**
     * Check if all necessary cookies are still valid
     * 
     * @param {Object} res 
     * @param {Object} req 
     * @returns 
     */
    validateCookies(req)
    {
        /** no cookies available */
        if (req.cookies.userId === undefined ||
            req.cookies.room === undefined ||
            req.cookies.joined === undefined)
            return false;

        try
        {
            if (req.cookies.userId.length !== UTILS.uuidLength())
                throw new Error("Invalid player uuid.");
            else if (req.cookies.joined < this.startupTime) 
                throw new Error("Cookie server time is old.");
            else if (!this.m_pServerInstance.roomManager.isValidRoomCreationTime(req.cookies.room, req.cookies.joined))
                throw new Error("Cookie does not match room.");

            return true;
        }
        catch (err)
        {
            console.warn(err.message);
        }

        return false;
    }

    createExpireResponse(res, sResponseType)
    {
        this.getServerInstance().caching.expires.withResultType(res, sResponseType);
        return res;
    }


    getServerInstance()
    {
        return this.m_pServerInstance;
    }


    /**
     * Simple cookie value check to avoid some illegal characters that could add 
     * custom code snippets - it basically removes potential string breaking characters
     * such as Quotes, Single Quotes, line break, tabs
     * 
     * @param {String} value 
     * @returns Value or random UUID to avoid any problems
     */
    sanatiseCookieValue(value)
    {
        if (value === undefined ||
            value === null ||
            value.indexOf("\"") !== -1 || 
            value.indexOf("'") !== -1 || 
            value.indexOf("\t") !== -1 || 
            value.indexOf(" ") !== -1 || 
            value.indexOf(";") !== -1 || 
            value.indexOf("\n") !== -1)
            return UTILS.generateFlatUuid();
        else
            return value.trim();
    }


}

module.exports = GamePlayRouteHandlerUtil;