

class ResolveHandSizeFirst 
{
    constructor(idContainer, idSize, sHandName, aPhases)
    {
        this.idContainer = idContainer;
        this.idSize = idSize;
        this.sHandName = sHandName === undefined || sHandName === "" ? "cards" : sHandName;
        this.phases = aPhases === undefined || aPhases.length === 0 ? null : aPhases;
    }

    static create(idContainer, idSize, sHandName, aPhases)
    {
        if (idSize === "" || idContainer === "")
            return;

        let pThis = new ResolveHandSizeFirst(idContainer, idSize, sHandName, aPhases);
        if (pThis.isAvailable())
            document.body.addEventListener("meccg-check-handsize", pThis.onResolveHandSizeFirst.bind(pThis), false);
    }

    isApplicable(sPhase)
    {
        return this.phases === null || this.phases.includes(sPhase);
    }

    isAvailable()
    {
        return document.getElementById(this.idContainer) !== null && document.getElementById(this.idSize) !== null;
    }

    getAllowed = function()
    {
        try
        {
            return parseInt(document.getElementById(this.idSize).innerHTML)
        }
        catch (err)
        {
        }

        return 100;
    }

    createMessage(nAllowed, nSize)
    {
        let sMessage;
        const nDiff = nAllowed - nSize;
        if (nDiff > 0)
            sMessage = "Please draw " + nDiff + " " + this.sHandName;
        else
            sMessage = "Please discard " + (nDiff*-1) + " " + this.sHandName;
    
        return sMessage;
    }

    countHandCards()
    {
        return ArrayList(document.getElementById(this.idContainer)).findByClassName("card-hand").size();
    }

    onResolveHandSizeFirst(e)
    {
        try
        {
            if (!this.isApplicable(e.detail))
                return;

            const nAllowed = this.getAllowed();
            const nSize = this.countHandCards();
            if (nAllowed > 0 && nSize !== nAllowed) 
                document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": this.createMessage(nAllowed, nSize) }));
        }
        catch (e)
        {
            MeccgUtils.logError(e);
        }
    }
}

class ResolveHandSizeContainer
{
    static _idCount = 0;

    constructor(id)
    {
        this.id = id;
    }

    static updateSize(id, nAdd)
    {
        try
        {
            let pElem = document.getElementById(id);
            const nAllowed = parseInt(pElem.innerHTML.trim()) + nAdd;
            pElem.innerHTML = nAllowed;
        }
        catch (err)
        {

        }
    }

    static increase(e)
    {
        ResolveHandSizeContainer.updateSize(e.target.getAttribute("data-for"), 1);
    }

    static decrease(e)
    {
        ResolveHandSizeContainer.updateSize(e.target.getAttribute("data-for"), -1);
    }

    static create(elemContainer, sTextPrefix, nCount, sTextSuffix)
    {
        if (elemContainer === null)
            return "";

        let _i;
        const idSizerValue = "card-hand-size-limit-" + (++ResolveHandSizeContainer._idCount);
        
        const div = document.createElement("div");
        div.setAttribute("class", "card-hands-sizer");
        
        if (sTextPrefix !== "")
            div.appendChild(document.createTextNode(sTextPrefix));

        _i = document.createElement("i");
        _i.setAttribute("class", "fa fa-plus-circle card-hands-sizer-plus");
        _i.setAttribute("title", "increase hand size");
        _i.setAttribute("data-for", idSizerValue);
        _i.setAttribute("aria-hidden", "true");
        _i.onclick = ResolveHandSizeContainer.increase;
        div.appendChild(_i);

        _i = document.createElement("span");
        _i.setAttribute("id", idSizerValue);
        _i.setAttribute("class", "card-hands-sizer-size");
        _i.innerHTML = nCount;
        div.appendChild(_i);

        _i = document.createElement("i");
        _i.setAttribute("class", "fa fa-minus-circle card-hands-sizer-minus");
        _i.setAttribute("title", "decrease hand size");
        _i.setAttribute("data-for", idSizerValue);
        _i.setAttribute("aria-hidden", "true");
        _i.onclick = ResolveHandSizeContainer.decrease;
        div.appendChild(_i);

        if (sTextSuffix !== "")
            div.appendChild(document.createTextNode(sTextSuffix));

        elemContainer.prepend(div);
        return idSizerValue;
    }
}