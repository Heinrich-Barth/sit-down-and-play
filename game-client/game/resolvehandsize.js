
const ResolveHandSizeFirst = { };

ResolveHandSizeFirst.isAvailable = function()
{
    return document.getElementById("playercard_hand_container") !== null && document.getElementById("card-hand-size-limit") !== null;
};

ResolveHandSizeFirst.countHandCards = function()
{
    return ArrayList(document.getElementById("playercard_hand_container")).findByClassName("card-hand").size();
};

ResolveHandSizeFirst.getAllowed = function()
{
    try
    {
        return parseInt(document.getElementById("card-hand-size-limit").innerHTML)
    }
    catch (err)
    {

    }

    return 100;
};

ResolveHandSizeFirst.createMessage = function(nAllowed, nSize)
{
    let sMessage;
    const nDiff = nAllowed - nSize;
    if (nDiff > 0)
        sMessage = "Please draw " + nDiff + " cards";
    else
        sMessage = "Please discard " + (nDiff*-1) + " cards";

    return sMessage;
};

/**
 * Check if the player has to resolve their hand size first (send a notification also)
 * 
 * @returns booean
 */
ResolveHandSizeFirst.onResolveHandSizeFirst = function()
{
    try
    {
        const nAllowed = ResolveHandSizeFirst.getAllowed();
        const nSize = ResolveHandSizeFirst.countHandCards();
        
        if (nAllowed > 0 && nSize !== nAllowed) 
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": ResolveHandSizeFirst.createMessage(nAllowed, nSize) }));
    }
    catch (e)
    {
        MeccgUtils.logError(e);
    }
}

if (ResolveHandSizeFirst.isAvailable())
    document.body.addEventListener("meccg-check-handsize", ResolveHandSizeFirst.onResolveHandSizeFirst, false);
