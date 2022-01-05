
const ContextMenu = {
   
    updateTargetMenuPosition : function(e, _menu_raw, nType)
    {
        const pPosition = ContextMenu._getPosition(e);
        if (pPosition.x === 0 || pPosition.y === 0)
            return;
        
        let y = pPosition.y - (nType === "card" ? 100 : 0);
        if (y < 10)
            y = 10;

        _menu_raw.style.left = pPosition.x + "px";
        _menu_raw.style.top = y + "px";
    },
   
    createMenuEntry : function(pParent, item)
    {
        let pLink = document.createElement("a");

        if (item.icon === "")
            pLink.innerHTML = item.label;
        else
            pLink.innerHTML = `<i class="fa ${item.icon}"></i> ${item.label}`;

        pLink.setAttribute("href", "#");
        pLink.setAttribute("data-action", item.action);
        pLink.onclick = ContextMenu.callbacks.generic;

        let li = document.createElement("li");
        li.setAttribute("class", item.classes);
        li.appendChild(pLink);

        pParent.appendChild(li);
    },

    fillTargetMenu : function(_menu_raw, nType, sUuid, sCode, companyId)
    {
        if (_menu_raw == null || typeof ContextMenu.data.types[nType] === "undefined")
            return;

        _menu_raw.setAttribute("data-card-code", sCode);
        _menu_raw.setAttribute("data-card-uuid", sUuid);
        _menu_raw.setAttribute("data-company", companyId);

        let sClass = typeof ContextMenu.data.specialClasses[nType] === "undefined" ? "" : ContextMenu.data.specialClasses[nType];
        if (sClass !== "")
            _menu_raw.classList.add(sClass);

        const pContainer = document.createElement("ul");
        pContainer.setAttribute("class", "context-menu__items");

        let vsItems = ContextMenu.data.types[nType];       
        for (let key of vsItems)
            ContextMenu.createMenuEntry(pContainer, ContextMenu.data.items[key]);

        const pMenu = document.querySelector("nav");
        DomUtils.removeAllChildNodes(pMenu);      
        pMenu.appendChild(pContainer);

        _menu_raw.classList.remove("hide");
    },

    show : function(e, sUuid, sCode, companyId, nType)
    {
        let _menu_raw = document.getElementById("contextmenu");
        if (_menu_raw !== null)
        {
            ContextMenu.updateTargetMenuPosition(e, _menu_raw, nType);
            ContextMenu.fillTargetMenu(_menu_raw, nType, sUuid, sCode, companyId);
        }
    },    
    
    /**
     * Init contextmenu element (Tap site)
     * 
     * @param {DOM Object} elem 
     * @param {String} code 
     */
    initContextMenuSite : function(e)
    {
        const code = e.detail.code;
        const company = document.getElementById(e.detail.id);
        if (company === null)
            return;

        const sQuery = e.detail.start ? ".site-current img.card-icon" : ".site-target img.card-icon";
        const elem = company.querySelector(sQuery);

        if (elem === null || code === undefined || code === "")
            return;
        
        elem.setAttribute("data-context-code", code);
        
        const companyId = e.detail.company;
        if (companyId !== undefined && companyId !== "")
            elem.setAttribute("data-contextmenu-site-arrive-company", companyId);

        elem.oncontextmenu = ContextMenu.contextActions.onContextSite;
        elem.ondblclick = ContextMenu.contextActions.onDoubleClickSite;
        elem.classList.add("context-cursor");
    },

    initContextMenuSiteArrive : function(e)
    {
        const companyId = e.detail.company;
        const company = document.getElementById(e.detail.id);
        const pCard = company === null ? null : company.querySelector(".site-target img.card-icon");
        if (pCard === null || companyId === "" || companyId === undefined)
            return;

        pCard.setAttribute("data-contextmenu-site-arrive-company", companyId);
        pCard.oncontextmenu = ContextMenu.contextActions.onContextSiteArrive; 
        pCard.classList.add("context-cursor");
    },

    initContextMenuGeneric : function(e)
    {
        const elemDiv = document.getElementById(e.detail.id);
        if (elemDiv === null)
            return;

        const elem = elemDiv.querySelector("img");
        if (elem !== null)
        {
            elem.oncontextmenu = ContextMenu.contextActions.onContextGeneric;
            elem.ondblclick = ContextMenu.contextActions.onDoubleClick;
            elem.classList.add("context-cursor");
        }
    },

    contextActions : {

        onDoubleClickSite : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;

            const code = ContextMenu._getCardCode(e.target);
            ContextMenu.callbacks.doRotate("_site", code, e.altKey ? "ready" : "tap");
        },


        onDoubleClick : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;
                
            let code = ContextMenu._getCardCode(e.target);
            if (code === "")
                code = ContextMenu.getAttribute(e.target, "data-card-code");

            let uuid = ContextMenu.getAttribute(e.target, "data-uuid");
            if (uuid === "")
                uuid = ContextMenu.getAttribute(e.target, "data-card-uuid");

            if (e.ctrlKey)
                ContextMenu.hightlightCard(uuid, code);
            else
                ContextMenu.callbacks.doRotate(uuid, code, e.altKey ? "ready" : "tap");
        },

        onContextGeneric : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;

            let sCode = ContextMenu._getCardCode(e.target);
            let sUuid = ContextMenu.getAttribute(e.target, "data-uuid");

            ContextMenu.show(e, sUuid, sCode, "", "card");
            return false;
        },

        onContextSite : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;
            
            let sCode = e.target.getAttribute("data-context-code");
            let sCompany = e.target.getAttribute("data-contextmenu-site-arrive-company");
            if (sCompany === null)
                sCompany = "";

            if (typeof sCode !== "undefined" && sCode !== null && sCode !== "")
                ContextMenu.show(e, "_site", sCode, sCompany, "location");
            
            return false;
        },

        onContextSiteArrive : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== null)
            {
                let sCompany = e.target.getAttribute("data-contextmenu-site-arrive-company");
                if (sCompany !== null && sCompany !== "")
                    ContextMenu.show(e, "", "", sCompany, "arrive");
            }

            return false;
        },
    },
            
    _getPosition : function(e)
    {
        let posx = 0;
        let posy = 0;

        if (!e)
            e = window.event;

        if (e.pageX || e.pageY)
        {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY)
        {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        return {
            x: posx,
            y: posy
        };
    },
    
    
    _getCardCode : function(card)
    {
        let sVal = "";

        if (!card.classList.contains("card-icon"))
            sVal = card.getAttribute("data-card-code");
        else
            sVal = card.parentElement.getAttribute("data-card-code");

        return sVal === undefined || sVal === null ? "" : sVal;
    },

    data : {
        items : { },
        types :  { },
        specialClasses : { }
    },

    getAttribute : function(element, sKey)
    {
        let val = element === null ? null : element.getAttribute(sKey);
        return val === null ? "" : val;
    },

    hightlightCard : function(uuid, code)
    {
        MeccgApi.send("/game/card/state/glow", {uuid : uuid, code: code });  
    },

    callbacks : {
        empty : function() { /** fallback */ },

        generic : function(e)
        {
            e.preventDefault();
            e.stopPropagation();
            
            let pMenu = document.getElementById("contextmenu");
            if (pMenu === null)
                return;

            /* execute the callback */
            let sAction = ContextMenu.getAttribute(e.target, "data-action");
            if (sAction !== null && sAction !== "")
            {
                ContextMenu.data.items[sAction].callback(pMenu, sAction);
                ContextMenu.callbacks.hide();
            }
        },

        rotate : function(pMenu, sAction) 
        {
            let uuid = ContextMenu.getAttribute(pMenu, "data-card-uuid");
            let code = ContextMenu.getAttribute(pMenu, "data-card-code");
            ContextMenu.callbacks.doRotate(uuid, code, sAction);
        },

        doRotate : function(uuid, code, sAction)
        {
            if (code === "" || uuid === "")
                return;

            let nState = -1;
            if (sAction === "ready")
                nState = 0;
            else if (sAction === "tap")
                nState = 90;
            else if (sAction === "tap_91")
                nState = 91;
            else if (sAction === "wound")
                nState = 180;
            else if (sAction === "rot270")
                nState = 270;

            if (nState !== -1)
                MeccgApi.send("/game/card/state/set", {uuid : uuid, state : nState, code: code });        
        },

        glow : function(pMenu)
        {
            let uuid = ContextMenu.getAttribute(pMenu, "data-card-uuid");
            let code = ContextMenu.getAttribute(pMenu, "data-card-code");
            ContextMenu.hightlightCard(uuid, code);
        },

        flip : function(pMenu)
        {
            let uuid = ContextMenu.getAttribute(pMenu, "data-card-uuid");
            let code = ContextMenu.getAttribute(pMenu, "data-card-code");
            MeccgApi.send("/game/card/state/reveal", {uuid : uuid, code: code });   
        },

        arrive : function(pMenu)
        {
            const companyId = ContextMenu.getAttribute(pMenu, "data-company");
            if (companyId !== "")
                MeccgApi.send("/game/company/arrive", {company : companyId });
        },

        hide : function()
        {
            const elem = document.getElementById("contextmenu");
            elem.classList.add("hide");

            ArrayList(elem).findByClassName("context-menu").each(DomUtils.removeAllChildNodes);

            if (elem.classList.contains("context-menu-movement"))
                elem.classList.remove("context-menu-movement");
            
            if (elem.classList.contains("context-menu-site"))
                elem.classList.remove("context-menu-site");

            elem.setAttribute("data-card-code", "");
            elem.setAttribute("data-card-uuid", "");
            elem.setAttribute("data-company", "");
        }
    },
    
    addItem : function(sAction, sLabel, sIcon, sClasses, callback)
    {
        if (typeof callback === "undefined")
            callback = ContextMenu.callbacks.empty;

        this.data.items[sAction] = {
            action: sAction,
            icon : sIcon,
            label: sLabel,
            classes: sClasses,
            callback : callback
        }
    },

    createContextMenus : function()
    {
        this.addItem("ready", "Ready card", "fa-heart", "context-menu-item-rotate context-menu-item-generic context-menu-item-location", ContextMenu.callbacks.rotate);
        this.addItem("tap", "Tap card (90°)", "fa-arrow-circle-right", "context-menu-item-rotate context-menu-item-generic context-menu-item-location", ContextMenu.callbacks.rotate);
        this.addItem("tap_91", "Forced tap card (90°)", "fa-lock", "context-menu-item-rotate context-menu-item-generic", ContextMenu.callbacks.rotate);
        this.addItem("wound", "Wound card (180°)", "fa-arrow-circle-down", "context-menu-item-rotate context-menu-item-generic", ContextMenu.callbacks.rotate);
        this.addItem("rot270", "Rotate 270°", "fa-arrow-circle-left", "context-menu-item-rotate context-menu-item-generic", ContextMenu.callbacks.rotate);
        this.addItem("glow_action", "Highlight card (5s)", "fa-bell-slash", "context-menu-item-glow context-menu-item-generic border-top", ContextMenu.callbacks.glow);
        this.addItem("flipcard", "Flip Card", "fa-eye-slash", "context-menu-item-flipcard context-menu-item-generic", ContextMenu.callbacks.flip);
        this.addItem("arrive", "Company arrives at destination", "fa-street-view", "context-menu-item-arrive", ContextMenu.callbacks.arrive);

        this.data.types["card"] = ["ready", "tap", "tap_91", "wound", "rot270", "glow_action", "flipcard"];
        this.data.types["location"] = ["ready", "tap", "arrive"];
        this.data.types["arrive"] = ["arrive"];

        this.data.specialClasses["card"] = "";
        this.data.specialClasses["location"] = "context-menu-site";
        this.data.specialClasses["arrive"] = "context-menu-movement";
    },
    
    insertContainers : function()
    {
        if (document.getElementById("contextmenu") !== null)
            return;

        /** insert container */
        const pCont = document.createElement("div");
        pCont.setAttribute("class", "contextmenu hide");
        pCont.setAttribute("id", "contextmenu");

        const div = document.createElement("div");
        div.classList.add("menu-overlay");
        div.onclick = ContextMenu.callbacks.hide;

        const nav = document.createElement("nav");
        nav.setAttribute("class", "context-menu blue-box");

        pCont.appendChild(div);
        pCont.appendChild(nav);

        document.body.appendChild(pCont);
    },

    onReady : function()
    {
        ContextMenu.createContextMenus();
        ContextMenu.insertContainers();
    }
};

document.body.addEventListener("meccg-init-ready", ContextMenu.onReady, false);
document.body.addEventListener("meccg-context-site", ContextMenu.initContextMenuSite, false);
document.body.addEventListener("meccg-context-site-arrive", ContextMenu.initContextMenuSiteArrive, false);
document.body.addEventListener("meccg-context-generic", ContextMenu.initContextMenuGeneric, false);
