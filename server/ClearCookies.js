
const clearCookies = function(res)
{
    res.clearCookie('userId');
    res.clearCookie('joined');
    res.clearCookie('room');
    return res;
}


exports.clearCookies = clearCookies;

exports.clearCookiesCallback = function(_req, res, next)
{
    clearCookies(res);
    next();
}


