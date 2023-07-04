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

    window.scrollTo({
        top: 0,
        left: 0, 
        behavior: 'smooth'
    }); 

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
            let sCode = getCode(_code);
            if (sCode !== "" && !vsCards.includes(sCode))
                vsCards.push(sCode);
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

const getCount = function(line)
{
    let nPos = line.indexOf(" ");
    if (nPos === -1)
        return "";
    else 
        return line.toString().substring(0, nPos);
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
        let _deck = {};

        for (let _entry of asLines)
        {
            let sCount = getCount(_entry);
            let sCode = getCode(_entry);

            if (sCode !== "" && sCount !== "")
                _deck[sCode] = parseInt(sCount);
        }

        return _deck;
    }

    let jDeck = {
        pool: toJson("pool"),
        sideboard: toJson("sideboard"),
        chars : toJson("characters"),
        resources : toJson("resources"),
        hazards : toJson("hazards"),
        sites: toJson("sites")
    };

    if (isEmpty(jDeck.pool) || isEmpty(jDeck.chars) || (isEmpty(jDeck.hazards) && isEmpty(jDeck.resources)))
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "This deck is not suitable for play. Verify that you have cards for pool, chars, and hazards/resources" }));
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

const onLoadDecks = function(data)
{
    g_jDecks = data;

    let openFirst = data.length === 1;

    let divGroup = document.createDocumentFragment();
    for (let deck of g_jDecks)
    {
        const label = document.createElement("details");
        divGroup.appendChild(label);

        if (openFirst)
        {
            label.open = true;
            openFirst = false;
        }
        
        const summary = document.createElement("summary");
        summary.innerText = " " + deck.name + " (" + Object.keys(deck.decks).length + ")";
        label.appendChild(summary);

        for (let key in deck.decks)
        {
            const divDeck = document.createElement("div");
            divDeck.setAttribute("class", "challenge-deck");
            divDeck.setAttribute("data-deck-id", deck.decks[key]);
            divDeck.setAttribute("data-deck-name", key);
            divDeck.setAttribute("title", "Click to select or right click to download");
            divDeck.onclick = onChallengeDeckChosen;
            divDeck.oncontextmenu = onDownloadDeck;
            divDeck.innerText = key;
            label.appendChild(divDeck);
        }

        divGroup.appendChild(label);
    }

    document.querySelector(".deck-list-entries").appendChild(divGroup);

    const divParent = document.querySelector(".deck-list");

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

    divParent.appendChild(divButton);
    divParent.appendChild(divFile);
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
    let elem = document.querySelector(".selected-deck");
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
        console.log(err);
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
        console.log(err);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not download deck" }));
    });

    return false;
}

const onChallengeDeckChosen = function(e)
{
    const deckid = e.target.getAttribute("data-deck-id");

    removeSelectedDeck();
    e.target.classList.add("selected-deck");
    document.getElementById("toggle_isstandard").click();

    if (g_pDeckMap[deckid] !== undefined)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-file-dropped", { "detail": g_pDeckMap[deckid] }));
        setTimeout(() => CalculateDeckCategory.calculateAll(), 50);
        return;
    }
    
    fetch("/data/decks/" + deckid)
    .then(response => response.text())
    .then(deckdata => 
    {
        g_pDeckMap[deckid] = deckdata;
        document.body.dispatchEvent(new CustomEvent("meccg-file-dropped", { "detail": deckdata }));
        setTimeout(() => CalculateDeckCategory.calculateAll(), 50);
    })
    .catch(err =>
    {
        console.log(err);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not load"}));
    });
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

    if (shareOpenChallenge !== null && shareOpenChallenge.checked)
        return "openchallenge";
    else if (shareVisitor !== null && shareVisitor.checked)
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
    
        const label = this.stripCount(h3.innerText);
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
            size += this.getCount(line.trim());

        return size;
    },

    getCount : function(line)
    {
        if (line === null || line === "")
            return 0;

        try
        {
            const pos = line.indexOf(" ")
            const val = pos < 1 ? "" : line.substring(0, pos).trim();

            if (val !== "")
                return parseInt(val);
        }
        catch (errIgnore)
        {

        }

        return 0;
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
        console.log(err);
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
    .catch(console.log);

})();

document.body.addEventListener("meccg-deck-available", (e) => populateDeck(e.detail), false);

const preloadGameData = function()
{
    const form = document.querySelector("form");
    if (form !== null)
        form.setAttribute("class", "hidden");

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
    .finally(onPerformLogin);
    
}