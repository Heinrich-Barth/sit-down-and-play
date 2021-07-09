

const ArrayList = function(elem)
{
    let _elem = elem;

    return {

        find : function(sSelector)
        {
            if (_elem === null || sSelector === undefined || sSelector === "")
                return ArrayList(null);
            else
                return ArrayList(_elem.querySelectorAll(sSelector));
        },

        findByClassName : function(sClass)
        {
            return ArrayList(_elem === null ? null : _elem.getElementsByClassName(sClass));
        },

        size : function()
        {
            if (_elem === null)
                return 0;
            else
                return _elem.length === undefined ? 1 : _elem.length;
        },

        each : function(fnCallback)
        {
            try
            {
                if (_elem === null || _elem.length === undefined)
                    return;

                const len = _elem.length;
                for (let i = 0; i < len; i++)
                    fnCallback(_elem[i]);
            }
            catch(err)
            {
                MeccgUtils.logError(err);
            }
        }
    }

};

class MeccgUtils {

    static logError(err)
    {
        MeccgUtils.logInfo(err);
    }

    static logWarning(e)
    {
        MeccgUtils.logInfo(e);
    }
    
    static logInfo(e)
    {
        console.log(e);
    }
}

class DomUtils extends MeccgUtils {

    static unbindAndRemove(jElement)
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

    static closestByClass(node, sClass)
    {
        return DomUtils.findParentByClass(node, sClass);
    }

    static findParentByClass(node, sClass)
    {
        if (node === null || node === undefined || sClass === undefined || sClass === "")
            return null;

        if (node.classList !== undefined && node.classList.contains(sClass))
            return node;
        else
            return DomUtils.findParentByClass(node.parentNode, sClass);
    }

    static empty(node)
    {
        DomUtils.removeAllChildNodes(node);
    }

    /**
     * Remove all child nodes from DOM element
     * @param {Object} parent 
     */
     static removeAllChildNodes(parent) 
     {
         if (parent !== null)
         {
             while (parent.firstChild) 
                 parent.removeChild(parent.firstChild);
         }
     }
     
    static removeNode(node)
    {
        DomUtils.removeAllChildNodes(node);
        if (node !== null)
            node.parentNode.removeChild(node);
    }

    static remove(node)
    {
        DomUtils.removeNode(node);
    }
}

const ResolveHandSizeFirst = { };

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
const resolveHandSizeFirst = function()
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

document.body.addEventListener("meccg-check-handsize", resolveHandSizeFirst, false);
