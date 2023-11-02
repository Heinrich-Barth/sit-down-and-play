const crypto = require('crypto');

const hasEvgSecretToken = function()
{
    return typeof process.env.SECRET_RESULTTOKEN === "string" && process.env.SECRET_RESULTTOKEN.trim() !== "";
}

const getSecretToken = function()
{
    if (hasEvgSecretToken()) 
        return process.env.SECRET_RESULTTOKEN.trim();
    else
        return "" + Date.now();
}

const TOKEN_CHECKSUM = getSecretToken();
if (!hasEvgSecretToken())
    console.warn("PLEASE SET A SECRET RESULT TOKEN");

/**
 * Calculate hash
 * @param {String} input 
 * @returns Hash String
 */
const createHash = function(input)
{
    return crypto.createHmac('sha256', TOKEN_CHECKSUM).update(input).digest('base64url')
}

/**
 * Create JWT without signature part
 * @param {JSON} data Payload
 * @returns Token 
 */
const createPlainToken = function(data)
{
    const header = {
        "alg": "HS256",
        "typ": "JWT"
      }
    const base64First = Buffer.from(JSON.stringify(header), "utf8").toString('base64url');
    const base64Second = Buffer.from(JSON.stringify(data), "utf8").toString('base64url');
    return base64First + "." + base64Second;
}

/**
 * Create JWT with signed part
 * @param {JSON} data Payload
 * @returns JWT 
 */
exports.create = function(data)
{
    const first = createPlainToken(data);
    return first + "." + createHash(first);
}

/**
 * Validate JWT
 * @param {String} token JWT token to validate
 * @returns boolean
 */
exports.validate = function(token)
{
    if (typeof token !== "string")
        return false;

    const parts = token.split(".");
    return parts.length === 3 && parts[2] !== "" && parts[2] === createHash(parts[0] + "." + parts[1]);
}

/**
 * calculate hash from input
 * @param {String} input
 * @returns String
 */
exports.createHash = createHash;