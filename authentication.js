

const Authentication = require("./authenticator");

/**
 * Load renderer modules from a given directory
 * @param {String} dir 
 */
const requireAuthenticationModule = function()
{
    try
    {
        const pAuthMod = require(__dirname + "/plugins/authentication-file.js");
        return new pAuthMod();
    }
    catch (err)
    {
    }     
     
    console.log("No authentication module necessary.")
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
            res.redirect('/login');
    },

    isSignedInCards : function(req, res, next) 
    {
        if (pInstance.isSignedInCards(req))
            next();
        else 
            res.redirect('/login');
    }, 

    isSignedInDeckbuilder : function(req, res, next) 
    {
        if (pInstance.isSignedInDeckbuilder(req))
            next();
        else 
            res.redirect('/login');
    },

    isSignedInMap : function(req, res, next) 
    {
        if (pInstance.isSignedInMap(req))
            next();
        else 
            res.redirect('/login');
    }
};