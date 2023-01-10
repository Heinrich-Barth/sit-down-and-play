
const clearCookies = function(req, res)
{
    if (req === undefined || req.cookies === undefined || req.cleared !== undefined)
        return res;

    if (req.cookies.userId !== undefined)
        res.clearCookie('userId');

    if (req.cookies.joined !== undefined)
        res.clearCookie('joined');

    if (req.cookies.room !== undefined)
        res.clearCookie('room');
    
    if (req.cookies.userId !== undefined)
        res.clearCookie('userId');

    if (req.cookies.socialMediaPers !== undefined)
        res.clearCookie('socialMediaPers');

    return res;
}

exports.clearCookies = clearCookies;

exports.clearCookiesCallback = function(req, res, next)
{
    clearCookies(req, res);
    next();
}


