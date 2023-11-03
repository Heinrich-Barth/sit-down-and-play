const g_pNameCodeMap = { };

const populateField = function(jDeck, sId, bClear)
{
    if (bClear)
        document.getElementById(sId).value = "";

    if (jDeck === undefined)
        return;

    let sVal = document.getElementById(sId).value;
    for(let k in jDeck) 
    {
        if (typeof jDeck[k] === "number")
            sVal += "\n" + jDeck[k] + " " + k;
        else
            sVal += "\n" + jDeck[k].count + " " + k;
    }

    document.getElementById(sId).value = sVal.trim();
};

const getCategoryCount = function(jDeck)
{
    if (jDeck === undefined)
        return 0;

    let nCount = 0;
    for(let k in jDeck) 
    {
        if (typeof jDeck[k] === "number")
            nCount += jDeck[k];
        else if (jDeck[k].count !== undefined)
        {
            try
            {
                nCount += parseInt(jDeck[k].count)
            }
            catch (e)
            {
                /** ignore error */
            }
        }
    }

    return nCount;    
};

const addDeckNotes = function(text)
{
    const pNotes = document.getElementById("notes");
    if (pNotes === null)
        return;
    
    while (pNotes.firstChild) 
        pNotes.removeChild(pNotes.firstChild);

    if (text === undefined || text === "")
        return;

    const h2 = document.createElement("h2");
    h2.innerText = "Deck notes";
    pNotes.appendChild(h2);

    for (let _line of text.trim().split("\n"))
    {
        const line = _line.trim();
        if (line === "")
            continue;

        if (line.startsWith("="))
        {
            const p = document.createElement("h3");
            p.innerText = line.substring(1).trim();
            if (p.innerText !== "")
                pNotes.appendChild(p);
        }
        else
        {
            const p = document.createElement("p");
            p.innerText = line;
            pNotes.appendChild(p);
        }
    }
};

const populateDeck = function(jData)
{
    if (jData === undefined)
        return;

    populateField(jData.resources, "resources", true);
    populateField(jData.resource, "resources", false);

    populateField(jData.hazards, "hazards", true);
    populateField(jData.hazard, "hazards", false);

    populateField(jData.avatar, "characters", true);
    populateField(jData.chars, "characters", false);
    populateField(jData.character, "characters", false);
    populateField(jData.characters, "characters", false);

    populateField(jData.sideboard, "sideboard", true);
    populateField(jData.pool, "pool", true);
    populateField(jData.sites, "sites", true);

    addDeckNotes(jData.notes);
    populateCardImages();

    if (getCategoryCount(jData.hazards) + getCategoryCount(jData.hazard) >= 150)
    {
        const pArda = document.getElementById("toggle_isarda");
        if (pArda !== null)
            pArda.click();
    }
    
    focusUsername();
};

const removeQuotes = function(sCode) 
{
    if (sCode.indexOf('"') === -1)
        return sCode;
    else
        return sCode.replace(/"/g, '');
};

let g_sViewDeckId = "";

const populateCardImages = function()
{
    if (g_sViewDeckId === "")
        return;

    const images = g_pDeckMap[g_sViewDeckId]?.images;
    g_sViewDeckId = "";
    if (images === undefined)
        return;

    const divImages = document.getElementById("deck-view-cards");
    if (divImages !== null)
    {
        while(divImages.firstChild)
            divImages.removeChild(divImages.firstChild);
    }

    divImages.append(
        createImageListFromTextarea("pool", images),
        createImageListFromTextarea("characters", images),
        createImageListFromTextarea("resources", images),
        createImageListFromTextarea("hazards", images),
        createImageListFromTextarea("sideboard", images),
        createImageListFromTextarea("sites", images)
    );

    const view = document.getElementById("deck-view");
    if (view !== null)
    {
        view.onclick = () => view.close();
        view.showModal();
    }
}

const createImageListFromTextarea = function(id, imageMap)
{
    const data = document.getElementById(id)?.value;
    if (data === undefined || data === "")
        return document.createDocumentFragment();

    const target = document.createDocumentFragment();
    const h3 = document.createElement("h3");
    h3.innerText = id;
    target.append(h3);

    for (let _line of data.split("\n"))
    {
        if (_line === "" || _line.length < 3)
            continue;

        const val = parseInt(_line.substring(0, 1));
        const code = _line.substring(1).trim().toLowerCase();
        const src = isNaN(val) || imageMap[code] === undefined ? "" : imageMap[code];
        if (src === "")
            continue;

        for (let i = 0; i < val; i++)
        {
            const img = document.createElement("img");
            img.setAttribute("src", src);
            img.setAttribute("title", code);
            img.setAttribute("loading", "lazy");
            target.append(img);
        }
    }

    return target;
}

const getCardCodeList = function()
{
    function toJson(sId, vsCards)
    {
        let _code;
        const area = document.getElementById(sId);
        if (area === null)
            return;

        for (_code of area.value.split('\n'))
        {
            const card = identifyCard(_code);
            if (card !== null && card.code !== "" && !vsCards.includes(card.code))
                vsCards.push(card.code);
        }

        return vsCards;
    }

    let _res = [];

    toJson("pool", _res); 
    toJson("sideboard", _res); 
    toJson("characters", _res); 
    toJson("resources", _res);
    toJson("hazards", _res);
    toJson("sites", _res);

    return _res;
};

const identifyCard = function(line)
{
    if (line.length < 3)
        return null;

    try
    {
        const result = {
            count: 1,
            code: line
        };

        const val = line.substring(0, 2).trim();
        if (val === "")
            return result;

        const num = parseInt(val);
        if (num < 1)
            return null;
        
        if (num > 0)
        {
            result.count = num;
            result.code = line.substring(2).trim();
        }

        if (result.code !== "")
            return result;
    }
    catch(err)
    {
        console.error(err);
    }

    return null
};

const getCode = function(line)
{
    let nPos = line.indexOf(" ");
    return nPos === -1 ? "" : removeQuotes(line.toString().substring(nPos+1).trim());
};


const createDeck = function()
{
    function toJson(sId)
    {
        const area = document.getElementById(sId);
        const asLines = area === null ? [] : area.value.split('\n');
        const _deck = {};

        for (let _entry of asLines)
        {
            const card = identifyCard(_entry.trim());
            if (card !== null && card.code !== "")
                _deck[card.code] = card.count;
        }

        return _deck;
    }

    const jDeck = {
        pool: toJson("pool"),
        sideboard: toJson("sideboard"),
        chars : toJson("characters"),
        resources : toJson("resources"),
        hazards : toJson("hazards"),
        sites: toJson("sites")
    };

    if (isEmpty(jDeck.pool))
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "The Pool is not suitable for play. Verify that you have cards for pool, chars, and hazards/resources" }));
        return null;
    }
    else if (isEmpty(jDeck.chars))
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "The Characters are not suitable for play. Verify that you have cards for pool, chars, and hazards/resources" }));
        return null;
    }
    else if (isEmpty(jDeck.hazards))
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "The Hazards are not suitable for play. Verify that you have cards for pool, chars, and hazards/resources" }));
        return null;
    }
    else if (isEmpty(jDeck.resources))
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "The Resources are not suitable for play. Verify that you have cards for pool, chars, and hazards/resources" }));
        return null;
    }
    else
        return jDeck;
}

const isEmpty = function(jDeck)
{
    return jDeck == undefined || Object.keys(jDeck).length === 0;
};

let g_jDecks = { };
const g_pDeckMap = {};

const createLabelDiv = function(title, color, count)
{
    const _span = document.createElement("span");
    _span.setAttribute("class", "deck-label-" + color);
    _span.setAttribute("data-deck-group", title.toLowerCase());

    if (count > 0)
        _span.innerText = title + " (" + count + ")";
    else
        _span.innerText = title;

    const _label = document.createElement("div");
    _label.setAttribute("class", "deck-label");
    _label.append(_span);
    
    return _label;
}


const processLabelFilters = function(div)
{
    const h3 = document.createElement("h3");
    h3.innerText = "Filter/Limit deck list";

    div.setAttribute("id", "deck-list-filter");
    div.prepend(h3);
    div.querySelectorAll("span").forEach(_span => _span.onclick = onClickFilterSpan)
}

const onClickFilterSpan = function(e)
{
    const val = e.target.getAttribute("data-deck-group").toLowerCase();

    document.getElementById("deck-list-filter")?.querySelectorAll(".active")?.classList?.remove("active");
    e.target.classList.add("active");

    document.getElementById("deck-grid")?.querySelectorAll(".challenge-deck").forEach(_deck => 
    {
        if (_deck.getAttribute("data-deck-group") === val)
            _deck.classList.remove("hidden");
        else if (!_deck.classList.contains("selected-deck"))
            _deck.classList.add("hidden");
    });
}

const createChallengeDeckCard = function(deck, key, meta, labelColor)
{
    const _deckid = deck.decks[key];
    const divDeck = document.createElement("div");
    divDeck.setAttribute("class", "challenge-deck");
    divDeck.setAttribute("data-deck-id", _deckid);
    divDeck.setAttribute("data-deck-name", key);
    divDeck.setAttribute("data-deck-group", deck.name.toLowerCase());
    divDeck.setAttribute("id", _deckid);
    divDeck.oncontextmenu = onDownloadDeck;

    const img = meta?.avatar !== "" ? `<img src="${meta.avatar}">`: '<img src="/data/backside" class="avatar-backside">';
    divDeck.innerHTML = `
        <a class="avatar" title="Click to choose this deck for your game">${img}</a>
        <a class="deck-data" title="Click to choose this deck for your game">
            <h3>${key}</h3>
            <p>
                Deck: ${meta?.resources} / ${meta?.hazards}
                <br>Characters: ${meta?.character}
                <br>Sideboard: ${meta?.sideboard}
            </p>
        </a>
        <div class="deck-info">
            <a href="#" data-action="view" title="Click to view cards in this deck and deck notes">
                <i class="fa fa-eye" aria-hidden="true"></i>
            </a>
        </div>
        <div class="fa fa-check selected-deck-icon" aria-hidden="true"></i>
    `;

    divDeck.appendChild(createLabelDiv(deck.name, labelColor, -1));
    return divDeck;
}

const onLoadDecks = function(data)
{
    g_jDecks = data;

    const divFilterList = document.createElement("div");
    divFilterList.setAttribute("class", "deck-filter-list");

    const divGroup = document.createElement("div");
    divGroup.setAttribute("class", "deck-grid");
    divGroup.setAttribute("id", "deck-grid");

    const labelColors = ["red", "green", "blue", "yellow", "pink"]
    for (let deck of g_jDecks)
    {
        const labelColor = labelColors.shift();
        labelColors.push(labelColor);

        let _count = 0;
        for (let key in deck.decks)
        {
            const meta = deck.meta[deck.decks[key]];
            if (meta !== undefined)
            {
                divGroup.append(createChallengeDeckCard(deck, key, meta, labelColor));
                _count++;
            }
        }

        divFilterList.append(createLabelDiv(deck.name, labelColor, _count));
    }

    divGroup.querySelectorAll("a").forEach(_a => 
    {
        if (_a.hasAttribute("data-action"))
            _a.onclick = onChallengeDeckChosenView;
        else
            _a.onclick = onChallengeDeckChosen;
    });

    processLabelFilters(divFilterList);
    document.querySelector(".deck-list-entries").append(divFilterList, divGroup);

    const divParent = document.getElementById("deck-text-fields");
    if (divParent === null)
        return;

    const divHtml = document.createElement("h2");
    divHtml.innerText = "Choose your deck";
    divParent.prepend(divHtml);

    const divButton = document.createElement("button");
    divButton.innerText = " Load a deck";
    divButton.setAttribute("class", "fa fa-folder load-deck-file");
    divButton.setAttribute("type", "button");
    divButton.onclick = () => document.getElementById("load_deck_file").click();

    const divFile = document.createElement("input");
    divFile.setAttribute("class", "hidden");
    divFile.setAttribute("type", "file");
    divFile.setAttribute("id", "load_deck_file");
    divFile.onchange = readSingleFromInput;

    divParent.append(divButton, divFile);
}

const readSingleFromInput = function(e)
{
    const file = e.target.files[0];
    if (!file)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Please choose a file..." }));
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) 
    {
        removeSelectedDeck();
        const contents = e.target.result;
        if (contents === "" || contents.indexOf("#") === -1)
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "File seems to be empty..." }));
        else    
            document.body.dispatchEvent(new CustomEvent("meccg-file-dropped", { "detail": contents }));
    };
    reader.readAsText(file);
}

const removeSelectedDeck = function()
{
    const elem = document.querySelector(".selected-deck");
    if (elem !== null)
        elem.classList.remove("selected-deck");
};

const onDownloadDeck0 = function(name, data)
{
    try
    {
        const type = "text/plain";
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(new Blob([data], {"type": type}));
        a.download = name;
        a.click();    
    }
    catch (err)
    {
        console.error(err);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not store deck" }));
    }
}

const onDownloadDeck = function(e)
{
    e.preventDefault();
    
    const deckid = e.target.getAttribute("data-deck-id");
    const filename = e.target.getAttribute("data-deck-name") + ".meccg";

    fetch("/data/decks/" + deckid)
    .then(response => response.text())
    .then(deckdata => 
    {
        g_pDeckMap[deckid] = deckdata;
        onDownloadDeck0(filename,  deckdata);
    })
    .catch(err =>
    {
        console.error(err);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not download deck" }));
    });

    return false;
}

const onChallengeDeckChosenView = function(e)
{
    g_sViewDeckId = onDeckChosenFindDeckId(e.target);

    onChallengeDeckChosen(e);

    const dialog = document.getElementById("notes");
    if (dialog !== null)
    {
        dialog.onclick = () => dialog.close();
        dialog.showModal();
    }

    return false;
}

const onDeckChosenFindDeckId = function(elem)
{
    if (elem === null)
        return "";

    const deckid = elem.hasAttribute("data-deck-id") ? elem.getAttribute("data-deck-id") : "";
    if (deckid !== null && deckid !== "")
        return deckid;
    else
        return onDeckChosenFindDeckId(elem.parentElement);
}

const onChallengeDeckChosen = function(e)
{
    const deckid = onDeckChosenFindDeckId(e.target);
    removeSelectedDeck();

    const elemDeck = document.getElementById(deckid);
    if (elemDeck !== null)
        elemDeck.classList.add("selected-deck");

    document.getElementById("toggle_isstandard").click();

    if (g_pDeckMap[deckid] !== undefined)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-file-dropped", { "detail": g_pDeckMap[deckid].deck }));
        setTimeout(() => CalculateDeckCategory.calculateAll(), 50);
        return false;
    }
    
    fetch("/data/decks/" + deckid)
    .then(response => response.json())
    .then(deckdata => 
    {
        g_pDeckMap[deckid] = deckdata;
        document.body.dispatchEvent(new CustomEvent("meccg-file-dropped", { "detail": deckdata.deck }));
        setTimeout(() => CalculateDeckCategory.calculateAll(), 50);
    })
    .catch(err =>
    {
        console.error(err);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not load"}));
    });

    return false;
}

const stripHashFromUrl = function()
{
    let sUrl = window.location.href;
    return sUrl.replace(/#/g, '').toLocaleLowerCase().trim().replace("/arda/", "/play/").replace("/singleplayer/", "/play/");
};

const isAlphaNumeric = function(sInput)
{
    return sInput !== undefined && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
};

const focusUsername = function()
{
    document.getElementById("user").focus();
}

const validateUserName = function()
{
    try
    {
        const sName = document.getElementById("user").value.trim();
        if (sName === "" || sName.length < 2)
            throw new Error("Enter valid username first.");
        else if(!sName.match(/^[0-9a-zA-Z]+$/))
            throw new Error("Please only use latin characters or numbers");
        if (sName.length > 20)
            throw new Error("Your username may only have 20 characters");
        else
            return sName;
    }
    catch(err)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": err.message }));
        focusUsername();
    }

    return "";
};

const insertSocialMedia = function(gameIsAlreadyCreated)
{
    const parent = document.querySelector(".arda-text");
    if (parent === null || gameIsAlreadyCreated === undefined)
        return;

    const p = document.createElement("p");
    p.setAttribute("class", "arda-text");

    let parts = ["Share Game on Discord<br>"];
    const loginType = document.body.getAttribute("data-login");

    if (loginType === "login")
    {
        if (!gameIsAlreadyCreated)
        {
            parts.push(`
            <input type="radio" id="toggle_social_open" value="openchallenge" name="socialmediatype">
            <label for="toggle_social_open">Post <strong>as open challenge</strong> on Discord channel so anybody may join (this will reveal your display name)</label>
            <span class="label-newline"></span>`);
    
            parts.push(`<input type="radio" checked="checked" id="toggle_social_visitor" value="visitor" name="socialmediatype">
            <label for="toggle_social_visitor">Post game name and <strong>visitor link</strong> on Discord (this will reveal your display name)</label>
            <span class="label-newline"></span>`);
        }
        else
        {
            parts.push(`
            <input type="radio" checked="checked" id="toggle_social_visitor" value="visitor" name="socialmediatype">
            <label for="toggle_social_visitor">Post <strong>you joining</strong> (incl. your display name) on Discord.</label>
            <span class="label-newline"></span>`);
        }
    }
    else
    {
        parts.push(`
        <input type="radio" checked="checked" id="toggle_social_visitor" value="visitor" name="socialmediatype">
        <label for="toggle_social_visitor">Post <strong>you joining</strong> (incl. your display name) on Discord.</label>
        <span class="label-newline"></span>`);
    }

    parts.push(`
    <input type="radio" id="toggle_social_none" value="none" name="socialmediatype">
    <label for="toggle_social_none">Post <strong>nothing</strong> on Discord</label>`);

    p.innerHTML = parts.join("");
    parent.parentNode.insertBefore(p, parent.nextSibling);
}

const getSocialMediaAction = function()
{
    const shareOpenChallenge = document.getElementById("toggle_social_open");
    const shareVisitor = document.getElementById("toggle_social_visitor");

    if (shareOpenChallenge?.checked)
        return "openchallenge";
    else if (shareVisitor?.checked)
        return "visitor";
    else
        return "none";
}

const isCheckedInput = function(id)
{
    const elem = document.getElementById(id);
    return elem === null || elem.checked !== false;
}


const onPerformLogin = function()
{
    let jDeck = createDeck();
    if (jDeck === null) 
        return false;

    let sName = validateUserName();
    if (sName === "")
        return false;

    let sUrl = stripHashFromUrl();
    if (sUrl === "")
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Invalid room" }));
        return false;
    }

    const bodyData = {
        name: sName,
        dce: isCheckedInput("toggle_allow_dce"),
        share: getSocialMediaAction(),
        jitsi: isCheckedInput("toggle_jitsi"),
        deck: jDeck
    }

    const sUrlTarget = getTargetUrl(sUrl, getGameType()) + "/check";

    const tmpForm = document.createElement("form");
    tmpForm.setAttribute("class", "hidden");
    tmpForm.setAttribute("method", "post");
    tmpForm.setAttribute("action", sUrlTarget);
    const tmpTextarea = document.createElement("textarea");
    tmpTextarea.setAttribute("name", "data");
    tmpForm.appendChild(tmpTextarea);
    document.body.appendChild(tmpForm);
    tmpTextarea.value = JSON.stringify(bodyData);
    tmpForm.submit();
};

const getTargetUrl = function(sUrl, gameType)
{
    let sReplace = "";
    switch (gameType)
    {
        case "arda":
        case "singleplayer":
            sReplace = gameType;
            break;
        default:
            break;
    }
    return sReplace === "" ? sUrl : sUrl.replace("/play/", "/" + sReplace + "/");
};

const getRoomName = function()
{
    let sUrl = stripHashFromUrl();
    let nPos = sUrl.indexOf("/login")
    
    if (nPos === -1)
        return "";

    sUrl = sUrl.substring(0, nPos);
    nPos = sUrl.lastIndexOf("/");
    if (nPos === -1)
        return "";
    else
        return sUrl.substring(nPos+1);
}

const getGameType = function()
{
    const gameTypes = document.getElementsByName("gameType");
    if (gameTypes === null || gameTypes === undefined)
        return "standard";

    let radio_value = "";
    for(let gameType of gameTypes)
    {
        if(gameType.checked)
        {
            radio_value = gameType.value;
            break;
        }
    }

    if (radio_value === "arda" || radio_value === "singleplayer")
        return radio_value;
    else
        return "standard"
};


const onProcessDeckCheckResult = function(codes)
{
    if (codes === undefined || codes.length === 0)
        return;

    const ul = document.createElement("ul");
    ul.setAttribute("class", "cookie_notice");

    const sRes = document.getElementById("resources").value;
    const sHaz = document.getElementById("hazards").value;
    const sSide = document.getElementById("sideboard").value;
    const sChars = document.getElementById("characters").value;
    const sPool = document.getElementById("pool").value;

    let divider = "";
    for (let code of codes)
    {
        let li = document.createElement("li");
        li.innerText = code + " (";
        divider = "";
        if (sRes.indexOf(code) !== -1)
        {
            li.innerText += divider + "Resources";
            divider = ", ";
        }
        if (sHaz.indexOf(code) !== -1)
        {
            li.innerText += divider + "Hazards";
            divider = ", ";
        }
        if (sSide.indexOf(code) !== -1)
        {
            li.innerText += divider + "Sideboard";
            divider = ", ";
        }
        if (sChars.indexOf(code) !== -1)
        {
            li.innerText += divider + "Characters";
            divider = ", ";
        }
        if (sPool.indexOf(code) !== -1)
        {
            li.innerText += divider + "Pool";
        }

        li.innerText += ")";
        ul.appendChild(li);
    }

    document.getElementById("invalid-cards-info-result").appendChild(ul);
    document.getElementById("invalid-cards-info").classList.remove("hidden");
    document.body.classList.remove("isLoggingIn");
};

/**
 * Calculates number of cards of type (resource, character, etc.)
 */
const CalculateDeckCategory = 
{
    calculate : function(e)
    {
        this.calculateList(e.target);
    },

    calculateList : function(elem)
    {
        if (elem === null)
            return;

        const id = elem.getAttribute("data-id");
        if (id === null || id === "")
            return;
    
        const h3 = document.getElementById(id);
        if (h3 === null)
            return;
    
        const label = this.stripCount(h3.hasAttribute("data-label") ? h3.getAttribute("data-label") : h3.innerText);
        const size = this.countList(elem.value.trim());

        h3.innerText = label + " (" + size + ")";
    },

    calculateById : function(id)
    {
        this.calculateList(document.getElementById(id));
    },

    calculateAll : function()
    {
        this.calculateById("resources");
        this.calculateById("hazards");
        this.calculateById("sideboard");
        this.calculateById("characters");
        this.calculateById("pool");
    },

    countList : function(text)
    {
        let size = 0;

        for (let line of text.split("\n"))
        {
            const card = identifyCard(line.trim());
            if (card !== null && card.count > 0)
                size += card.count;
        }

        return size;
    },

    stripCount : function(label)
    {
        const nPos = label.indexOf(" (");
        if (nPos === -1)
            return label;
        else
            return label.substring(0, nPos).trim();
    },

    initTextareaOnClick:function(elemid)
    {
        const elem = document.getElementById(elemid);
        if (elem === null || elem.parentElement === null)
            return;

        const h3 = elem.parentElement.querySelector("h3");
        if (h3 !== null)
        {
            h3.setAttribute("id", "label-" + elemid);
            elem.setAttribute("data-id", "label-" + elemid);
            elem.onchange = CalculateDeckCategory.calculate.bind(CalculateDeckCategory);
        }
    },

    init : function()
    {
        this.initTextareaOnClick("resources");
        this.initTextareaOnClick("hazards");
        this.initTextareaOnClick("sideboard");
        this.initTextareaOnClick("characters");
        this.initTextareaOnClick("pool");
    }
};

const onCheckCardCodes = function()
{
    if (!validateUserName())
        return;

    if (g_pDeckTextFields.onCheckNameCodeSuggestions())
        return;

    const vsCards = getCardCodeList();
    if (vsCards.length === 0)
        return;

    /** avoid speed race. Allow click only once and hide the field */
    document.body.classList.add("isLoggingIn");

    const options = {
        method: 'POST',
        body: JSON.stringify(vsCards),
        headers: {
            'Content-Type': 'application/json'
        }
    }

    fetch("/data/decks/check", options).then((response) =>
    {
        if (response.status === 200)
        {
            response.json().then((data) => 
            {
                if (data.valid === true)
                    preloadGameData();
                else
                    onProcessDeckCheckResult(data.codes);
            });
        }
    }).catch(() => 
    {
        document.body.classList.remove("isLoggingIn");
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not check deck status." }));
    });   
};

const randomNumber = function(max)
{
    return max <= 1 ? 0 : Math.floor(Math.random() * max);
};

const loadSampleUserName = function()
{
    fetch("/data/samplenames").then((response) => response.json().then((filtered) => 
    {
        if (filtered.length > 0)
            document.getElementById("user").value = filtered[randomNumber(filtered.length)];
    }));
};

const onChangeJitsiSelection = function(e)
{
    const isTrue = e.target.checked;
    const elem = document.getElementById("jitsi_link")
    if (elem == null)
        return;

    if (elem.classList.contains("hidden") && isTrue)
        elem.classList.remove("hidden");
    else if (!elem.classList.contains("hidden") && !isTrue)
        elem.classList.add("hidden");
}

/**
 * Sanitize and encode all HTML in a user-submitted string
 * https://portswigger.net/web-security/cross-site-scripting/preventing
 * @param  {String} str  The user-submitted string
 * @return {String} str  The sanitized string
 */
const sanitizeString = function (str) 
{
	return str.replace(/[^\w. ]/gi, function (c) {
		return '&#' + c.charCodeAt(0) + ';';
	});
};

const initJitsiSelection = function()
{
    const link = document.getElementById("jitsi_link");
    const jitsi = document.getElementById("toggle_jitsi");
    const roomName = sanitizeString(getRoomName());
    if (link === null || jitsi === null || roomName === "")
        return;

    const url = "https://meet.jit.si/" + roomName

    jitsi.onchange = onChangeJitsiSelection;
    link.setAttribute("href", url);
    link.setAttribute("target", "_blank");
}

const g_pDeckTextFields = new DeckTextFields();

/** generic init */
(function () {
    g_pDeckTextFields.insert("deck-text-fields", "Deck Details", "w50");

    {
        const _det = document.getElementById("deck-text-fields");
        const _summary = _det?.querySelector("summary");
        if (_det && _summary)
        {
            _det.removeChild(_summary);
            _det.prepend(_summary);
            _det.classList.add("deck-edit-details");
        }
    }

    const sUserName = document.getElementById("user").value;
    if (sUserName === "")
    {
        loadSampleUserName();
        document.getElementById("user").focus();
    }
    else
        document.getElementById("user").value = sUserName;
   
    document.getElementById("host").onclick = onCheckCardCodes;

    initJitsiSelection();

    const forms = document.getElementById("deckform");
    forms.onsubmit = (e) => {
        document.getElementById("host").dispatchEvent(new Event('click'));
        e.preventDefault();
        return false;
    }

    CalculateDeckCategory.init();
    document.body.dispatchEvent(new CustomEvent("meccg-init-dropzone", { "detail": "login" })); /** update the deck list view */

})();

(function () {

    fetch("/data/decks")
    .then((response) => response.json())
    .then(onLoadDecks)
    .catch((err) => 
    {
        console.error(err);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch game list." }));
    });

    fetch("/data/games/" + getRoomName())
    .then((response) => response.json())
    .then(data => 
        {
        if (data.exists === true)
        {
            const button = document.getElementById("host");
            if (button !== null)
                button.innerHTML = button.innerHTML.replace("Create ", "Join ");

            const text = document.getElementById("game-type");
            if (text !== null)
                text.classList.add("hidden");

            if (data.share === true)
                insertSocialMedia(true);
        }
        //else 
        //    insertSocialMedia(false);
    })
    .catch(console.error);

    sessionStorage.setItem("cards_es", "no");
    const toggleLang = document.getElementById("toggle_use_spanish");
    if (toggleLang !== null)
    {
        toggleLang.onchange = (e) => {
            const useSpanish = e.target?.checked === true ? "yes" : "no";
            sessionStorage.setItem("cards_es", useSpanish);
        }
    }       
})();

document.body.addEventListener("meccg-deck-available", (e) => populateDeck(e.detail), false);

const preloadGameData = function()
{
    const form = document.querySelector("form");
    if (form !== null)
        form.setAttribute("class", "hidden");

    {
        const _t = document.getElementById("deck-text-fields");
        if (_t !== null)
            _t.classList.add("hidden");
    }
    {
        const _t = document.getElementById("deck-grid-all");
        if (_t !== null)
            _t.classList.add("hidden");
    }
            
    const div = document.createElement("div");
    div.setAttribute("class", "loading-line-counter");
    document.body.appendChild(div);

    const elem = document.querySelector("h1");
    if (elem !== null)
        elem.innerText = "... loading data ...";

    localStorage.removeItem("game_data");

    fetch("/data/list/gamedata")
    .then(response => response.json())
    .then(data => localStorage.setItem("game_data", JSON.stringify(data)))
    .catch(console.error)
    .finally(() => 
    {
        if (!onPerformLogin())
        {
            const form = document.querySelector("form");
            if (form !== null)
                form.setAttribute("class", "hidden");
        }
    });
    
}

const saveAutosave = async function(name, data)
{
    const filename = name + "-" + new Date().toISOString().split(".")[0].replace("T","-").replaceAll(":", "-");
    const opts = {
        types: [
        {
            description: "Save game to file",
        }],
        suggestedName: filename + ".meccg-savegame",
    };

    const fileHandle = await window.showSaveFilePicker(opts);
    const writable = await fileHandle.createWritable();

    // Write the contents of the file to the stream.
    await writable.write(data);

    // Close the file and write the contents to disk.
    await writable.close();

    document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Saved to " + filename }));
    sessionStorage.removeItem("meccg_" + name);
}

/** check if there has been an autosave (due to aborted game) or server timeout */
const retrieveAutoSave = async function()
{
    const name = getRoomName().toLowerCase();
    const data = sessionStorage.getItem("meccg_" + name);

    if (data === null)
        return;
    
    try
    {
        const dialog = document.createElement("dialog");
        dialog.setAttribute("class", "dialog-autosave");

        const button = document.createElement("button");
        button.autofocus = true;
        button.innerHTML = `<i class="fa fa-save" aria-hidden="true"></i> Save game`;
        button.onclick = () => 
        {
            dialog.close();
            saveAutosave(name, data);
        }

        const buttonCancel = document.createElement("button");
        buttonCancel.setAttribute("class", "buttonCancel");
        buttonCancel.innerHTML = `<i class="fa fa-trash" aria-hidden="true"></i> Discard autosave`;
        buttonCancel.onclick = () => 
        {
            dialog.close();
            sessionStorage.removeItem("meccg_" + name);
        }
        

        const h1 = document.createElement("h2");
        h1.innerText = "Save latest autosave?";

        const p = document.createElement("p");
        p.innerText = "There is an autosave available. You may want to save it.";

        dialog.append(h1, p, button, buttonCancel);
        document.body.append(dialog);
        dialog.showModal();   
    }
    catch (err)
    {
        console.error(err);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not save autosave to file" }));
    }
}

retrieveAutoSave();