
const ContextMenu = {

    _api : { send: function() { }},
    
    _isReady : false,

    updateTargetMenuPosition : function(e, _menu_raw, nType)
    {
        const jPos = ContextMenu._getPosition(e);
        if (jPos.x === 0 || jPos.y === 0)
            return;
        
        let y = jPos.y - (nType === "card" ? 100 : 0);
        if (y < 10)
            y = 10;

        _menu_raw.style.left = jPos.x + "px";
        _menu_raw.style.top = y + "px";
    },
   
    createMenuEntry : function(jParent, item)
    {
        let jLink = jQuery("<a>", { });

        if (item.icon === "")
            jLink.html(item.label);
        else
            jLink.html(`<i class="fa ${item.icon}"></i> ${item.label}`);

        jLink.attr("href", "#");
        jLink.attr("data-action", item.action);
        jLink.click(ContextMenu.callbacks.generic);

        let jCont = jQuery("<li>", {
            class: item.classes
        });

        jCont.append(jLink);
        jParent.append(jCont);
    },

    fillTargetMenu : function(_menu_raw, nType, sUuid, sCode, companyId)
    {
        if (_menu_raw == null || typeof ContextMenu.data.types[nType] === "undefined")
            return;

        let jMenu = jQuery(_menu_raw);
        jMenu.find("nav").empty();

        jMenu.attr("data-card-code", sCode);
        jMenu.attr("data-card-uuid", sUuid);
        jMenu.attr("data-company", companyId);

        let sClass = typeof ContextMenu.data.specialClasses[nType] === "undefined" ? "" : ContextMenu.data.specialClasses[nType];
        if (sClass !== "")
            jMenu.addClass(sClass);

        const jCont = jQuery("<ul>", {
            class: "context-menu__items",
        });

        let vsItems = ContextMenu.data.types[nType];       
        for (let key of vsItems)
            ContextMenu.createMenuEntry(jCont, ContextMenu.data.items[key]);

        jMenu.find("nav").append(jCont);
        jMenu.removeClass("hide");
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
    initContextMenuSite : function(elem, code)
    {
        if (elem === null || typeof elem === "undefined" || typeof code === "undefined" || code === "")
            return;
        
        jQuery(elem).attr("data-context-code", code);
        elem.oncontextmenu = ContextMenu.contextActions.onContextSite;
        jQuery(elem).addClass("context-cursor");
    },

    initContextMenuSiteArrive : function(companyId, jCard)
    {
        if (jCard === null || jCard.length === 0 || companyId === "")
            return;

        jCard.attr("data-contextmenu-site-arrive-company", companyId);
        jCard.get(0).oncontextmenu = ContextMenu.contextActions.onContextSiteArrive; 
        jCard.addClass("context-cursor");
    },

    initContextMenuGeneric : function(elem)
    {
        if (elem != null)
        {
            elem.oncontextmenu = ContextMenu.contextActions.onContextGeneric;
            jQuery(elem).addClass("context-cursor");
        }
    },

    contextActions : {

        onContextGeneric : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;

            let jCard = jQuery(e.target);
            let sCode = ContextMenu._getCardCode(jCard);
            let sUuid = jCard.attr("data-uuid");

            ContextMenu.show(e, sUuid, sCode, "", "card");
            return false;
        },

        onContextSite : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;
            
            let sCode = jQuery(e.target).attr("data-context-code");
            if (typeof sCode !== "undefined" && sCode !== "")
                ContextMenu.show(e, "_site", sCode, "", "location");
            
            return false;
        },

        onContextSiteArrive : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== null)
            {
                let sCompany = jQuery(e.target).attr("data-contextmenu-site-arrive-company");
                if (sCompany !== "")
                    ContextMenu.show(e, "", "", sCompany, "arrive");
            }

            return false;
        },
    },
            
    _getPosition : function(e)
    {
        var posx = 0;
        var posy = 0;

        if (!e)
            var e = window.event;

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
    
    
    _getCardCode : function(jCard)
    {
        let sVal = "";

        if (!jCard.hasClass("card-icon"))
            sVal = jCard.attr("data-card-code");
        else
            sVal = jCard.parent().attr("data-card-code");

        return typeof sVal === "undefined" ? "" : sVal;
    },

    data : {
        items : { },
        types :  { },
        specialClasses : { }
    },

    callbacks : {
        empty : function() { },

        generic : function(e)
        {
            e.preventDefault();

            let jMenu = jQuery("#contextmenu");
                
            /* execute the callback */
            let sAction = jQuery(this).attr("data-action");
            ContextMenu.data.items[sAction].callback(jMenu, sAction);
            ContextMenu.callbacks.hide();
        },

        rotate : function(jMenu, sAction) 
        {
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
                ContextMenu._api.send("/game/card/state/set", {uuid : jMenu.attr("data-card-uuid"), state : nState, code: jMenu.attr("data-card-code") });        
        },

        glow : function(jMenu)
        {
            ContextMenu._api.send("/game/card/state/glow", {uuid : jMenu.attr("data-card-uuid"), code: jMenu.attr("data-card-code") });  
        },

        flip : function(jMenu)
        {
            ContextMenu._api.send("/game/card/state/reveal", {uuid : jMenu.attr("data-card-uuid"), code: jMenu.attr("data-card-code") });   
        },

        arrive : function(jMenu)
        {
            const companyId = jMenu.attr("data-company");
            if (companyId !== "")
                ContextMenu._api.send("/game/company/arrive", {company : companyId });
        },

        hide : function()
        {
            let jMenu = jQuery("#contextmenu");

            jMenu.addClass("hide");
            jMenu.find(".context-menu").empty();

            if (jMenu.hasClass("context-menu-movement"))
                jMenu.removeClass("context-menu-movement");
            
            if (jMenu.hasClass("context-menu-site"))
                jMenu.removeClass("context-menu-site");

            jMenu.attr("data-card-code", "");
            jMenu.attr("data-card-uuid", "");
            jMenu.attr("data-company", "");
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
        this.addItem("glow_action", "Toggle Highlight", "fa-bell-slash", "context-menu-item-glow context-menu-item-generic border-top", ContextMenu.callbacks.glow);
        this.addItem("flipcard", "Flip Card", "fa-eye-slash", "context-menu-item-flipcard context-menu-item-generic", ContextMenu.callbacks.flip);
        this.addItem("arrive", "Company arrives at destination", "fa-street-view", "context-menu-item-arrive", ContextMenu.callbacks.arrive);

        this.data.types["card"] = ["ready", "tap", "tap_91", "wound", "rot270", "glow_action", "flipcard"];
        this.data.types["location"] = ["ready", "tap"];
        this.data.types["arrive"] = ["arrive"];

        this.data.specialClasses["card"] = "";
        this.data.specialClasses["location"] = "context-menu-site";
        this.data.specialClasses["arrive"] = "context-menu-movement";
    },
    
    insertContainers : function()
    {
        /** insert container */
        const jCont = jQuery("<div>", {
            class: "contextmenu hide",
            id: "contextmenu"
        });

        jCont.html(`<div class="menu-overlay"></div><nav class="context-menu blue-box"></nav>`);
        jQuery("body").append(jCont);

        jQuery("#contextmenu .menu-overlay").click(ContextMenu.callbacks.hide);
    },

    onReady : function()
    {
        if (!ContextMenu._isReady)
        {
            /* create the context menus */
            ContextMenu.createContextMenus();
            ContextMenu.insertContainers();
            ContextMenu._isReady = true;
        }
    }
};

jQuery(document).ready(ContextMenu.onReady);

function createContextMenu(_MeccgApi)
{  
    ContextMenu._api = _MeccgApi;

    return {
        
        initContextMenuGeneric : function(elem)
        {
            ContextMenu.initContextMenuGeneric(elem);
        },

        initContextMenuSite : function(elem, code) 
        {
            ContextMenu.initContextMenuSite(elem, code);
        },

        initContextMenuSiteArrive : function(company, elemContainer)
        {
            ContextMenu.initContextMenuSiteArrive(company, elemContainer);
        }
    };
};
                