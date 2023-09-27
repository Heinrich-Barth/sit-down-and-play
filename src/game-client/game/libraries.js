

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
        console.info(e);
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
    
    static closestByType(node, type)
    {
        if (node === null || node === undefined || type === undefined || type === "")
            return null;

        if (node.nodeName !== undefined && node.nodeName.toLowerCase() === type)
            return node;
        else
            return DomUtils.closestByType(node.parentNode, type);
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
        if (node !== undefined && node !== null)
        {
            DomUtils.removeAllChildNodes(node);
            if (node !== undefined && node.parentNode !== undefined && node.parentNode !== null)
                node.parentNode.removeChild(node);
        }
    }

    static remove(node)
    {
        DomUtils.removeNode(node);
    }

    static hide(node)
    {
        if (node !== null)
            node.style.display = "none";
    }

    static show(node)
    {
        if (node !== null)
            node.style.display = "block";
    }
}
