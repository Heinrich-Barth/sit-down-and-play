
const clearCookies = function(res)
{
    res.clearCookie('userId');
    res.clearCookie('joined');
    res.clearCookie('room');
    res.clearCookie('socialMedia');
    res.clearCookie('socialMediaPers');

    return res;
}


exports.clearCookies = clearCookies;

exports.clearCookiesCallback = function(_req, res, next)
{
    clearCookies(res);
    next();
}


