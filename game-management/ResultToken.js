const crypto = require('crypto');

const TOKEN_CHECKSUM = typeof process.env.SECRET_RESULTTOKEN !== "undefined" ? process.env.SECRET_RESULTTOKEN : "" + Date.now();

const createHash = function(input)
{
    return crypto.createHmac('sha256', TOKEN_CHECKSUM).update(input).digest('base64url')
}

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

exports.create = function(data)
{
    const first = createPlainToken(data);
    return first + "." + createHash(first);
}

exports.validate = function(token)
{
    if (typeof token !== "string")
        return false;

    const parts = token.split(".");
    return parts.length === 3 && parts[2] !== "" && parts[2] === createHash(parts[0] + "." + parts[1]);
}