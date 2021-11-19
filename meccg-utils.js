
const g_sUUIDTpl = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
const g_sUUIDLength = g_sUUIDTpl.length;

const replaceTplUUID = function(c)
{
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
}

const generateUuid = function () 
{
    return g_sUUIDTpl.replace(/[xy]/g, replaceTplUUID);
};

const generateFlatUuid = function()
{
    const sTpl = "xxxxxxxx_xxxx_xxxx_xxxx_xxxxxxxxxxxx";
    return sTpl.replace(/[xy]/g, replaceTplUUID);
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
exports.createContentSecurityPolicyMegaAdditionals = function(csp_image_domain, csp_report_uri)
{
    const jEntries = {
        "script-src": "'self' 'nonce-START'",
        "img-src": "'self' " + csp_image_domain,
        "report-uri": csp_report_uri
    };

    let sVal = "";
    for (let key in jEntries) 
    {
        if (jEntries[key] !== "")
            sVal += key + " " + jEntries[key] + "; ";
    }
    
    return sVal.trim();
};