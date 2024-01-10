
const ContextMenu = {

    updateTargetMenuPosition : function(x, y, pMenuElement, clickedOnGameCard)
    {
        if (clickedOnGameCard)
            y -= 100;

        if (y < 10)
            y = 10;

        pMenuElement.style.left = x + "px";
        pMenuElement.style.top = y + "px";
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
        if (item.tipp !== undefined && item.tipp !== null && item.tipp !== "")
            pLink.setAttribute("title", "Tipp: " + item.tipp);

        pLink.onclick = ContextMenu.callbacks.generic;

        let li = document.createElement("li");
        li.setAttribute("class", item.classes);
        li.appendChild(pLink);

        pParent.appendChild(li);
    },

    fillTargetMenu : function(pContextMenuElement, nType)
    {
        if (pContextMenuElement == null || typeof ContextMenu.data.types[nType] === "undefined")
            return false;

        const sClass = typeof ContextMenu.data.specialClasses[nType] === "undefined" ? "" : ContextMenu.data.specialClasses[nType];
        if (sClass !== "")
            pContextMenuElement.classList.add(sClass);

        const pContainer = document.createElement("ul");
        pContainer.setAttribute("class", "context-menu__items");

        let hasElements = false;
        const vsItems = ContextMenu.data.types[nType];       
        for (let key of vsItems)
        {
            if (ContextMenu.data.items[key] !== undefined)
            {
                ContextMenu.createMenuEntry(pContainer, ContextMenu.data.items[key]);
                hasElements = true;
            }
        }

        const pMenu = document.querySelector("nav");
        DomUtils.removeAllChildNodes(pMenu);      
        pMenu.appendChild(pContainer);

        return hasElements;
    },

    show : function(e, sUuid, sCode, companyId, nType)
    {
        const pPosition = ContextMenu._getPosition(e);
        if (pPosition.x === 0 || pPosition.y === 0)
            return;

        const clickedOnGameCard = nType === "card";
        const pContextMenuElement = document.getElementById("contextmenu");
        if (pContextMenuElement === null)
            return;

        ContextMenu.updateTargetMenuPosition(pPosition.x, pPosition.y, pContextMenuElement, clickedOnGameCard);

        pContextMenuElement.setAttribute("data-card-code", sCode);
        pContextMenuElement.setAttribute("data-card-uuid", sUuid);
        pContextMenuElement.setAttribute("data-company", companyId);

        if (ContextMenu.fillTargetMenu(pContextMenuElement, nType))
            pContextMenuElement.classList.remove("hide");
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
        elem.onclick = ContextMenu.contextActions.onDoubleClickSite;
        elem.classList.add("context-cursor");
    },

    initContextMenuSiteArrive : function(e)
    {
        const companyId = e.detail.company;
        const company = document.getElementById(e.detail.id);
        const pCard = company === null ? null : company.querySelector(".site-target img.card-icon");
        if (pCard === null || companyId === "" || companyId === undefined)
            return;

        const code = e.detail.code;
        pCard.setAttribute("data-context-code", code);
        pCard.setAttribute("data-contextmenu-site-arrive-company", companyId);
        pCard.oncontextmenu = ContextMenu.contextActions.onContextSiteArrive; 
        pCard.ondblclick = ContextMenu.contextActions.onDoubleClickSiteArrive;
        pCard.onclick = ContextMenu.contextActions.onDoubleClickSiteArrive;
        pCard.classList.add("context-cursor");
    },

    initContextMenuGeneric : function(e)
    {
        const isOnguard = e.detail.type === "onguard";
        const elemDiv = document.getElementById(e.detail.id);
        if (elemDiv === null)
            return;

        const elem = elemDiv.querySelector("img");
        if (elem !== null)
        {
            elem.oncontextmenu = ContextMenu.contextActions.onContextGeneric;
            if (isOnguard)
            {
                elem.ondblclick = ContextMenu.contextActions.onOnGuardDoubleClick;
                elem.onclick = ContextMenu.contextActions.onFlipClick;
            }
            else
            {
                elem.ondblclick = ContextMenu.contextActions.onDoubleClickGenericCard;
                elem.onclick = ContextMenu.contextActions.onDoubleClickGenericCard;
            }
            elem.classList.add("context-cursor");
        }
    },

    cardGetTapClass : function(elem, allowWound)
    {
        if (elem.parentElement === null)
            return "tap";
        else if (allowWound === undefined || !allowWound)
            return elem.parentElement.classList.contains("state_tapped") ? "ready" : "tap"

        const pParent = elem.parentElement;
        if (pParent.classList.contains("state_wounded"))
            return "ready";
        else if (pParent.classList.contains("state_tapped"))
            return "wound";
        else
            return "tap";
    },

    isSiteOfOrigin : function(img)
    {
        const elem = img?.parentElement?.parentElement;
        return elem?.classList?.contains("site-current");
    },
    
    contextActions : {

        onClickSiteOrigin : function(img, companyid)
        {
            ContextMenu.callbacks.doRotate("_site", ContextMenu._getCardCode(img), ContextMenu.cardGetTapClass(img, false));
        },

        onClickSiteTarget : function(img, companyid)
        {
            if (companyid === "")
            {
                ContextMenu.callbacks.doRotate("_site", ContextMenu._getCardCode(img), ContextMenu.cardGetTapClass(img, false));
                return;
            }
            else if (!img.getAttribute("src").startsWith("/data/backside"))
            {
                MeccgApi.send("/game/company/arrive", {company : companyid });
                return;
            }

            const companyContainer = companyid === "" ? null : document.getElementById("company_" + companyid);
            const isAgent = companyContainer !== null && GameCompanies.detectIsAgentCompany(companyContainer);
            const link = isAgent || companyContainer === null ? null : companyContainer.querySelector(".location-reveal");
            if (link !== null)
                link.click();
            else
                MeccgApi.send("/game/company/arrive", {company : companyid });
        },

        onDoubleClickSite : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;
              
            const companyid = e.target.getAttribute("data-contextmenu-site-arrive-company");
            if (ContextMenu.isSiteOfOrigin(e.target))
                ContextMenu.contextActions.onClickSiteOrigin(e.target, companyid);
            else
                ContextMenu.contextActions.onClickSiteTarget(e.target, companyid);

            return true;
        },

        onDoubleClickSiteArrive : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== null && e.target !== undefined)
            {
                const companyId = ContextMenu.getAttribute(e.target, "data-contextmenu-site-arrive-company");
                if (companyId !== "")
                    MeccgApi.send("/game/company/arrive", {company : companyId });
            }
        },

        onOnGuardDoubleClick : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target === null)
                return false;

            let uuid = ContextMenu.getAttribute(e.target, "data-uuid");
            if (uuid === "")
            {
                uuid = ContextMenu.getAttribute(e.target, "data-card-uuid");
                if (uuid === "")
                    return false;
            }

            const div = "img" === e.target.nodeName.toLowerCase() ? e.target.parentElement : e.target;
            CreateHandCardsDraggableUtils.removeDraggableDomElement(div);
            MeccgApi.send("/game/card/move", {uuid: uuid, target: "hand", source: "inplay", drawTop : true});
        },

        onFlipClick : function(e)
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

            const src = e.target.getAttribute("src");
            if (src !== null && src.indexOf("/backside") !== -1)
            {
                ContextMenu.callbacks._doFlip(uuid, code);
                ContextMenu.hightlightCard(uuid, code);
            }
        },

        onDoubleClickGenericCard : function(e)
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
            {
                const src = ContextMenu.getAttribute(e.target, "src");
                if (src !== null && src.indexOf("/backside") !== -1)
                {
                    ContextMenu.callbacks._doFlip(uuid, code);
                    ContextMenu.hightlightCard(uuid, code);
                }
                else
                    ContextMenu.callbacks.doRotate(uuid, code, ContextMenu.cardGetTapClass(e.target, true));
            }
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
                ContextMenu.callbacks.doRotate(uuid, code, ContextMenu.cardGetTapClass(e.target, false));
        },
        
        onContextGeneric : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== null)
            {
                const sCode = ContextMenu._getCardCode(e.target);
                const sUuid = ContextMenu.getAttribute(e.target, "data-uuid");
                ContextMenu.show(e, sUuid, sCode, "", "card");
            }

            return false;
        },

        onContextSite : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== null)
            {
                const sCode = e.target.getAttribute("data-context-code");
                let sCompany = e.target.getAttribute("data-contextmenu-site-arrive-company");
                if (sCompany === null)
                    sCompany = "";
    
                if (typeof sCode !== "undefined" && sCode !== null && sCode !== "")
                    ContextMenu.show(e, "_site", sCode, sCompany, "location");
            }
            
            return false;
        },

        onContextPlayDeckActions : function(e)
        {
            if (e.target !== null)
                ContextMenu.show(e, "_site", "_code", "_company", "playdeck_actions");
            
            if (e.preventDefault)
                e.preventDefault();

            if (e.stopPropagation)
                e.stopPropagation();

            return false;
        },

        onContextSiteArrive : function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== null)
            {
                const sCode = e.target.getAttribute("data-context-code");
                const sCompany = e.target.getAttribute("data-contextmenu-site-arrive-company");
                if (sCompany !== null && sCompany !== "")
                    ContextMenu.show(e, "", sCode, sCompany, "arrive");
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
        return val === null || val === undefined ? "" : val;
    },

    hightlightCard : function(uuid, code)
    {
        MeccgApi.send("/game/card/state/glow", {uuid : uuid, code: code });  
    },

    onToken : function(bAdd)
    {
        const pMenu = document.getElementById("contextmenu");
        if (pMenu !== null)
        {
            const uuid = ContextMenu.getAttribute(pMenu, "data-card-uuid");
            const code = ContextMenu.getAttribute(pMenu, "data-card-code");
            MeccgApi.send("/game/card/token", {uuid : uuid, code: code, add: bAdd !== false });
        }
    },

    callbacks : {
        empty : function() { /** fallback */ },

        tokenRemove : function()
        {
            ContextMenu.onToken(false);
        },

        tokenAdd : function()
        {
            ContextMenu.onToken(true);
        },

        viewDeckNotes:function()
        {
            const text = sessionStorage.getItem("deck-notes");
            if (typeof text !== "string" || text === "")
                return;

            const dialog = document.createElement("dialog");
            dialog.setAttribute("id", "dialog-notes");
            dialog.setAttribute("class", "dialog-notes");

            const h1 = document.createElement("h1");
            h1.classList.add("center");
            h1.innerText = "Your Deck Notes";

            const p = document.createElement("p");
            p.classList.add("center");
            p.innerText = "Click anywhere or press ESC to close the window";

            dialog.append(h1, p);

            for (let line of text.split("\n"))
            {
                let elem = null;
                if (line.startsWith("=="))
                {
                    elem = document.createElement("h3");
                    elem.innerText = line.replace("==", "");
                }
                else if (line.startsWith("="))
                {
                    elem = document.createElement("h2");
                    elem.innerText = line.replace("=", "");
                }
                else
                {
                    elem = document.createElement("p");
                    elem.innerText = line.trim();
                    if (elem.innerText === "")
                        elem.innerText = " ";
                }

                dialog.appendChild(elem);
            }

            document.body.appendChild(dialog);
            dialog.onclose = () => document.body.removeChild(document.getElementById("dialog-notes"));
            dialog.onclick = () => document.getElementById("dialog-notes").close();
            dialog.setAttribute("title", "Click to close");
            dialog.showModal();
        },

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
            ContextMenu.callbacks._doFlip(uuid, code);  
        },

        _doFlip : function(uuid, code)
        {
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
        },

        addRessource : function(pMenu)
        {
            let code = ContextMenu.getAttribute(pMenu, "data-card-code");
            if (code !== "")
                MeccgApi.send("/game/card/import", {code : code, type: "resource" });
        },

        addCharacter: function(pMenu)
        {
            let code = ContextMenu.getAttribute(pMenu, "data-card-code");
            if (code !== "")
                MeccgApi.send("/game/card/import", {code : code, type: "character" });
        },

        returnToSiteOfOrigin : function(pMenu)
        {
            const companyId = ContextMenu.getAttribute(pMenu, "data-company");
            if (companyId !== "")
                MeccgApi.send("/game/company/returntoorigin", {company : companyId });
        },

        reveal5CardsToOpponent : function(pMenu)
        {
            RevealPlayerDeck.INSTANCE.onChoosePlayer();
        },

        reveal5CardsToSelf : function()
        {
            if (typeof RevealPlayerDeckSelf !== "undefined")
                RevealPlayerDeckSelf.lookAt(5);
        }
    },
    
    addItem : function(sAction, sLabel, sIcon, sClasses, callback, tipp)
    {
        if (typeof callback === "undefined")
            callback = ContextMenu.callbacks.empty;

        this.data.items[sAction] = {
            action: sAction,
            icon : sIcon,
            label: sLabel,
            classes: sClasses,
            tipp: tipp === undefined || tipp === null ? "" : tipp,
            callback : callback
        }
    },
    
    createContextMenus : function()
    {
        this.addItem("ready", "Ready card", "fa-heart", "context-menu-item-rotate context-menu-item-generic context-menu-item-location", ContextMenu.callbacks.rotate, "ALT+Doubleclick to untap");
        this.addItem("tap", "Tap card (90°)", "fa-arrow-circle-right", "context-menu-item-rotate context-menu-item-generic context-menu-item-location", ContextMenu.callbacks.rotate, "Doubleclick to tap");
        this.addItem("tap_91", "Forced tap card (90°)", "fa-lock", "context-menu-item-rotate context-menu-item-generic", ContextMenu.callbacks.rotate);
        this.addItem("wound", "Wound card (180°)", "fa-arrow-circle-down", "context-menu-item-rotate context-menu-item-generic", ContextMenu.callbacks.rotate);
        this.addItem("rot270", "Rotate 270°", "fa-arrow-circle-left", "context-menu-item-rotate context-menu-item-generic", ContextMenu.callbacks.rotate);
        this.addItem("glow_action", "Highlight card (5s)", "fa-bell-slash", "context-menu-item-glow context-menu-item-generic border-top", ContextMenu.callbacks.glow, "CTRL+Doubleclick to untap");
        this.addItem("flipcard", "Flip Card (or press 'f')", "fa-eye-slash", "context-menu-item-flipcard context-menu-item-generic", ContextMenu.callbacks.flip);
        this.addItem("token_add", "Add token (or press '+')", "fa-plus", "context-menu-item-generic", ContextMenu.callbacks.tokenAdd);
        this.addItem("token_remove", "Remove token (or press '-')", "fa-minus", "context-menu-item-generic", ContextMenu.callbacks.tokenRemove);
        this.addItem("arrive", "Company arrives at destination", "fa-street-view", "context-menu-item-arrive", ContextMenu.callbacks.arrive, "Doubleclick on opponents target site to indicate NO MORE HAZARDS");
        this.addItem("add_ressource", "Add this site as a ressource", "fa-clipboard", "context-menu-item-arrive", ContextMenu.callbacks.addRessource, "Adds this site as RESSOURCE to your hand and will be played facedown.");
        this.addItem("add_character", "Add this site as a character", "fa-user", "context-menu-item-arrive", ContextMenu.callbacks.addCharacter, "Adds this site as CHARACTER to your hand.");
        this.addItem("movement_return", "Return to site of origin", "fa-ban", "context-menu-item-arrive", ContextMenu.callbacks.returnToSiteOfOrigin, "Remove target site.");

        this.addItem("view_deck_cards", "Look at my playdeck as it is", "fa-stack-exchange", "context-menu-item-generic", () => TaskBarCards.Show("playdeck", false), "");
        this.addItem("view_deck_cards_ordered", "Look at my playdeck and sort cards", "fa-eye", "context-menu-item-generic", () => TaskBarCards.Show("playdeck", true), "");
        
        if (sessionStorage.getItem("deck-notes"))
            this.addItem("view_deck_notes", "View deck notes", "fa-info-circle", "context-menu-item-generic", ContextMenu.callbacks.viewDeckNotes, "");
        
        this.addItem("reval_cards_number", "Reveal 5 cards to your opponent (I will not see them)", "fa-eye", "context-menu-item-generic", ContextMenu.callbacks.reveal5CardsToOpponent, "");
        this.addItem("reval_cards_number_self", "Look at your top 5 cards", "fa-eye", "context-menu-item-generic", ContextMenu.callbacks.reveal5CardsToSelf, "");
        this.addItem("playdeck_shuffle", "Shuffle deck", "fa-random", "context-menu-item-generic", TaskBarCards.ShufflePlaydeck, "");

        this.data.types["card"] = ["ready", "tap", "tap_91", "wound", "rot270", "glow_action", "flipcard", "token_add", "token_remove"];
        this.data.types["location"] = ["ready", "tap", "arrive", "add_ressource", "add_character", "movement_return"];
        this.data.types["arrive"] = ["arrive", "movement_return"];
        this.data.types["playdeck_actions"] = ["view_deck_cards_ordered", "view_deck_cards", "view_deck_notes", "reval_cards_number", "reval_cards_number_self", "playdeck_shuffle"];

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
        nav.setAttribute("class", "context-menu smallCaps blue-box");

        pCont.appendChild(div);
        pCont.appendChild(nav);

        document.body.appendChild(pCont);
    },

    insertCss : function()
    {
        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.setAttribute("href", "/client/game/contextmenu/contextmenu.css?t=" + Date.now());
        document.head.appendChild(styleSheet);
    },

    onReady : function()
    {
        ContextMenu.insertCss();
        ContextMenu.createContextMenus();
        ContextMenu.insertContainers();
    }
};

document.body.addEventListener("meccg-init-ready", ContextMenu.onReady, false);
document.body.addEventListener("meccg-context-site", ContextMenu.initContextMenuSite, false);
document.body.addEventListener("meccg-context-site-arrive", ContextMenu.initContextMenuSiteArrive, false);
document.body.addEventListener("meccg-context-generic", ContextMenu.initContextMenuGeneric, false);
