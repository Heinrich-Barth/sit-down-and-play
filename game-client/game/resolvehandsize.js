

class ResolveHandSizeFirst 
{
    constructor(idContainer, idSize, sHandName, aPhases)
    {
        this.idContainer = idContainer;
        this.idSize = idSize;
        this.sHandName = sHandName === undefined || sHandName === "" ? "cards" : sHandName;
        this.phases = aPhases === undefined || aPhases.length === 0 ? null : aPhases;
        
    }

    static isVisitor()
    {
        return document.body.getAttribute("data-is-watcher") === "true";
    }

    static create(idContainer, idSize, sHandName, aPhases)
    {
        if (idSize === "" || idContainer === "" || ResolveHandSizeFirst.isVisitor())
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
        catch (err)
        {
            MeccgUtils.logError(err);
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

    static createHandContainer()
    {
        const handContent = document.getElementById("playercard-hand-content");
        if (handContent === null)
            return;

        const _handSizer = handContent === null ? null : handContent.querySelector(".hand-card-sizer")
        const _sizerId = ResolveHandSizeContainer.create(_handSizer, "Always ask to resolve to", 8, "cards.");
        if (_sizerId !== "")
            ResolveHandSizeFirst.create("playercard_hand_container", _sizerId, "cards");

        ResolveHandSizeContainer.create(_handSizer, "Stage points are ", 0, "");
        ResolveHandSizeContainer.create(_handSizer, "Unused general influence is", 20, "");
    }
}

