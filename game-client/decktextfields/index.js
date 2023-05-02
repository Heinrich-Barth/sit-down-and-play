class DeckTextFields {

    static g_pNameCodeMap = {};

    removeQuotes(sCode) 
    {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, '');
    }

    getCount(line)
    {
        let nPos = line.indexOf(" ");
        if (nPos === -1)
            return "";
        else 
            return line.toString().substring(0, nPos);
    }

    getCode(line)
    {
        let nPos = line.indexOf(" ");
        return nPos === -1 ? "" : this.removeQuotes(line.toString().substring(nPos+1).trim());
    }

    prependInvalidCodesContainer(div) {
        const elem = document.createElement("div");
        elem.setAttribute("class", "fields hidden");
        elem.setAttribute("id", "invalid-cards-info");

        const h2 = document.createElement("h2");
        h2.innerText = "Invalid codes found. Please correct these:";

        const list = document.createElement("div");
        list.setAttribute("id", "invalid-cards-info-result");

        elem.appendChild(h2);
        elem.appendChild(list);

        div.parentNode.insertBefore(elem, div);
    }

    createTitle(title) {
        if (title && title !== "") {
            const elem = document.createElement("h2");
            elem.innerText = title;
            return elem;
        }
        else
            return document.createDocumentFragment();
    }

    createFieldsDiv(id) {
        const h3 = document.createElement("h3");
        h3.innerText = id.toUpperCase();

        const div = document.createElement("div");
        div.setAttribute("class", "fields");

        const textarea = document.createElement("textarea");
        textarea.setAttribute("id", id);
        textarea.setAttribute("class", "card-type");
        textarea.setAttribute("title", `Paste ${id} here`);
        textarea.setAttribute("placeholder", `Paste ${id} here`);

        div.appendChild(h3);
        div.appendChild(textarea);

        return div;
    }

    createTextfields() {
        const parent = document.createDocumentFragment();
        parent.append(this.createFieldsDiv("resources"));
        parent.append(this.createFieldsDiv("hazards"));
        parent.append(this.createFieldsDiv("sideboard"));
        parent.append(this.createFieldsDiv("characters"));
        parent.append(this.createFieldsDiv("pool"));
        parent.append(this.createFieldsDiv("sites"));
        return parent;
    }

    createSiteTextInformation()
    {
        const i = document.createElement("strong");
        i.setAttribute("class", "fa fa-info-circle");

        const p = document.createElement("p");
        p.appendChild(i);
        p.appendChild(document.createTextNode(" If you add sites to your site deck, these will be made available on the region map. You may still access all other sites and regions, of course."));
        return p;
    }


    insert(id, title, cssClass) {
        const elem = document.getElementById(id);
        if (elem === null)
            return;

        const fields = this.createTextfields();
        if (elem.classList.contains("deck-fields"))
        {
            elem.prepend(this.createSiteTextInformation());
            elem.prepend(fields);
            elem.prepend(this.createTitle(title));
            if (cssClass)
                elem.classList.add(cssClass);
        }
        else
        {
            const div = document.createElement("div");
            div.classList.add("deck-fields");
            if (cssClass)
                div.classList.add(cssClass);
            div.prepend(fields);
            div.prepend(this.createTitle(title));
            elem.prepend(div);
        }

        this.prependInvalidCodesContainer(elem);
    }

    toJson(sId) 
    {
        const res = {};
        for (let _code of document.getElementById(sId).value.trim().split('\n')) {
            const sCode = this.getCode(_code);
            const count = this.getCount(_code);

            if (sCode === "" || count === "")
                continue;

            const nCount = parseInt(count);
            if (nCount < 1)
                continue;

            if (typeof res[sCode] === "undefined")
                res[sCode] = { count: nCount, alternatives: [] };
            else
                res[sCode].count += nCount;
        }

        return res;
    }

    processInput(sId, mapSuggestions) {
        if (document.getElementById(sId).value.trim() === "")
            return;

        const json = this.toJson(sId);
        if (!this.addSuggestions(json, DeckTextFields.g_pNameCodeMap))
            return;

        mapSuggestions[sId] = {};
        document.getElementById(sId).value = this.toStringList(json, mapSuggestions[sId]);
    }

    toStringList(candidateMap, mapSuggestions) {
        let list = [];
        for (let code of Object.keys(candidateMap)) {
            const elem = candidateMap[code];
            const len = elem.alternatives.length;
            if (len === 1)
                list.push(elem.count + " " + elem.alternatives[0]);
            else {
                list.push(elem.count + " " + code);
                mapSuggestions[code] = elem.alternatives;
            }
        }

        return list.join("\n").trim();
    }

    addSuggestions(candidateMap, suggestedNameMap) {
        let bAdded = false;
        for (let code of Object.keys(candidateMap)) {
            let _code = code.toLowerCase();
            if (code.indexOf("(") === -1 && code.indexOf("[") === -1 && typeof suggestedNameMap[_code] !== "undefined") {
                candidateMap[code].alternatives = suggestedNameMap[_code];
                bAdded = true;
            }
        }
        return bAdded;
    }

    createMessage(mapSuggestions) {
        
        const parent = document.createDocumentFragment();
        let hasSuggestions = false;

        let uidCount = 0;
        const uid = "card_" + Date.now();
        for (let type of Object.keys(mapSuggestions)) 
        {
            const list = document.createDocumentFragment();
            const area = mapSuggestions[type];
            for (let card of Object.keys(area)) 
            {
                const elem = area[card];
                if (elem.length < 2)
                    continue;

                hasSuggestions = true;

                const p = document.createElement("p");
                const thisId = uid + (++uidCount);
                p.setAttribute("id", thisId);

                const _strong = document.createElement("strong");
                _strong.innerText = card + ": ";

                p.appendChild(_strong);
                for (let _card of elem)
                    p.appendChild(this.createUpdateLink(card, _card, type, thisId));

                list.appendChild(p);
            }

            const h3 = document.createElement("h3");
            h3.innerText = type;

            parent.appendChild(h3);
            parent.append(list);
        }

        return hasSuggestions ? parent : null;
    }

    createUpdateLink(origName, name, area, thisId)
    {
        const link = document.createElement("a");
        link.setAttribute("href", "#");
        link.setAttribute("class", "link-replace-invalid-code fa fa-check-circle");
        link.setAttribute("title", "Use this card in your deck");
        link.setAttribute("data-title", origName);
        link.setAttribute("data-replace-with", name);
        link.setAttribute("data-type", area);
        link.setAttribute("data-id", thisId);
        link.innerText = " " + name;
        link.onclick = this.onUpdateCard.bind(this);
        return link;
    }

    onUpdateCard(e)
    {
        const elem = e.target;
        const id = elem.getAttribute("data-type");
        const nameSource = elem.getAttribute("data-title");
        const nameNew = elem.getAttribute("data-replace-with");

        const div = document.getElementById(id);
        if (div === null)
            return;

        const val = div.value.trim();
        const list = [];

        for (let line of val.split("\n"))
        {
            if (line.endsWith(" " + nameSource))
            {
                list.push(line.replace(" " + nameSource, " " + nameNew));
                document.getElementById(elem.getAttribute("data-id")).classList.add("hidden");
            }
            else
                list.push(line);
        }

        div.value = list.join("\n");
    }

    onCheckNameCodeSuggestions() 
    {
        this.clearInvalidArea();

        const mapSuggestions = {};

        this.processInput("pool", mapSuggestions);
        this.processInput("sideboard", mapSuggestions);
        this.processInput("characters", mapSuggestions);
        this.processInput("resources", mapSuggestions);
        this.processInput("hazards", mapSuggestions);

        return this.updateResultList(mapSuggestions);    
    }

    updateResultList(mapSuggestions)
    {
        const _tmpMess = this.createMessage(mapSuggestions);
        if (_tmpMess === null)
            return false;

        const fragmane = document.createDocumentFragment();
        const p = document.createElement("p");
        p.innerText = "Please specify which alignment should be used:";

        fragmane.appendChild(p);
        fragmane.appendChild(_tmpMess);

        document.getElementById("invalid-cards-info-result").appendChild(fragmane);
        document.getElementById("invalid-cards-info").classList.remove("hidden");
        return true;
    }

    clearInvalidArea()
    {
        if (document.getElementById("invalid-cards-info") !== null)
        {
            DomUtils.removeAllChildNodes(document.getElementById("invalid-cards-info-result"));
            document.getElementById("invalid-cards-info").classList.add("hidden");
        }

    }

}

fetch("/data/list/name-code-suggestions").then(response => response.json()).then(data => {
    for (let key of Object.keys(data))
        DeckTextFields.g_pNameCodeMap[key] = data[key];

}).catch(console.error);
