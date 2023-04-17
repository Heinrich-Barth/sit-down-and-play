const crypto = require("crypto");
const g_sUUIDLength = crypto.randomUUID().length;

const generateUuid = function () 
{
    return crypto.randomUUID();
};

const generateFlatUuid = function()
{
    return generateUuid().replaceAll("-", "_");
};

const isAlphaNumeric = function(sInput)
{
    return sInput !== undefined && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
};

const createSecret = function () 
{
    const salt1 = generateUuid() + Math.floor(Math.random() * Math.floor(1000)) + 1;
    const salt2 = generateUuid() + Math.floor(Math.random() * Math.floor(1000)) + 1;
    const x = salt1 + salt2 + generateUuid() + "0";
    return require('crypto').createHash('sha256').update(x, 'utf8').digest('hex');
};


const joinMap = function(jEntries)
{
    let sVal = "";
    for (let key in jEntries) 
    {
        if (jEntries[key] !== "")
            sVal += key + " " + jEntries[key] + "; ";
    }
    
    return sVal.trim();
};

exports.uuidLength = () => { return g_sUUIDLength; }

/**
 * Check if the input is valid and alphanumeric
 * 
 * @param {String} sInput 
 * @returns 
 */
exports.isAlphaNumeric = (sInput) => isAlphaNumeric(sInput);

 
/**
  * Create a unique user id
  * @returns UUID String
  */
exports.generateUuid = () => generateUuid();

exports.generateFlatUuid = () => generateFlatUuid();


/**
 * Create a unique secret 
 * @returns hashed SHA256 salt as HEX
 */
exports.createSecret = () => createSecret();

/**
 * Create a unique user id
 * @returns UUID String
 */
exports.createContentSecurityPolicyMegaAdditionals = function(csp_image_domain)
{
    if (csp_image_domain === undefined)
        csp_image_domain = "";

    const jEntries = {
        "default-src" : "'none'",
        "style-src": "'self'",
        "connect-src": "'self' " + csp_image_domain,
        "font-src": "'self'",
        "script-src": "'self' 'nonce-START'",
        "frame-src": "'self'",
        "img-src": "'self' " + csp_image_domain,
        "report-uri": "/csp-violation"
    };
    
    return joinMap(jEntries);
};


/**
 * Create a unique user id
 * @returns String
 */
 exports.createContentSecurityPolicySelfOnly = function()
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
 
    return joinMap(jEntries);
 };