


function unbindAndRemove(jElement)
{
    /* threadding may cause problems. so just have try-catch block here */
    try
    {
        jElement.find("div").unbind();
        jElement.find("img").unbind();
        jElement.unbind();
        jElement.remove();
    }
    catch(e)
    {
    }
}

/**
 * Check if the player has to resolve their hand size first (send a notification also)
 * 
 * @returns booean
 */
function resolveHandSizeFirst()
{
    try
    {
        const nAllowed = parseInt(jQuery("#card-hand-size-limit").html());
        const nSize = jQuery("#playercard_hand_container .card-hand").length;
        
        if (nAllowed < 1 || nSize === nAllowed) 
            return false;

        let sMessage;
        const nDiff = nAllowed - nSize;
        if (nDiff > 0)
            sMessage = "Please draw " + nDiff + " cards";
        else
            sMessage = "Please discard " + (nDiff*-1) + " cards";

        document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": sMessage }));
        return true;
    }
    catch (e)
    {
        
    }

    return false;
}

document.body.addEventListener("meccg-check-handsize", resolveHandSizeFirst, false);
// document.body.dispatchEvent(new CustomEvent("meccg-check-handsize", { "detail": "" }));