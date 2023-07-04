const fs = require("fs");

/**
 * Load renderer modules from a given directory
 * @param {String} dir 
 */
const requireAuthenticationModule = function()
{
    try
    {
        if (fs.existsSync(__dirname + "/authentication") && fs.existsSync(__dirname + "/authentication/authentication-file.js"))
        {    
            const pAuthMod = require(__dirname + "/authentication/authentication-file.js");
            console.info("Authentication module is available.");
            return new pAuthMod();
        }
    }
    catch (errIgnore)
    {
        /** ignore any errors */
    }     
     
    console.info("No authentication module necessary.");

    const Authentication = require("./authenticator");
    return new Authentication();
};

const pInstance = requireAuthenticationModule();

module.exports = {

    showLoginPage : function(req, res, next) 
    {
        let data = pInstance.getLoginPageData();
        if (data === "")
            res.status(404).send();
        else
            res.status(200).send(data);
    },

    signIn : (req, res) => pInstance.signIn(req, res),

    isSignedInPlay : function(req, res, next) 
    {
        if (pInstance.isSignedInPlay(req))
            next();
        else 
            res.status(403).send(pInstance.getLoginPageData());
    },

    isSignedInCards : function(req, res, next) 
    {
        if (pInstance.isSignedInCards(req))
            next();
        else 
            res.status(403).send(pInstance.getLoginPageData());
    }, 

    isSignedInDeckbuilder : function(req, res, next) 
    {
        if (pInstance.isSignedInDeckbuilder(req))
            next();
        else 
            res.status(403).send(pInstance.getLoginPageData());
    },

    isSignedInMap : function(req, res, next) 
    {
        if (pInstance.isSignedInMap(req))
            next();
        else 
            res.status(403).send(pInstance.getLoginPageData());
    },

    signInFromPWA : function(_req, res, next)
    {
        pInstance.signInFromPWA(res);
        next();
    },

    isSignedInPWA : function(req)
    {
        return pInstance.isSignedInPWA(req);
    }
};