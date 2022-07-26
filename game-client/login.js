
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
    if (text === undefined)
        text = "";

    const pNotes = document.getElementById("notes");
    if (pNotes === null)
        return;
    
    while (pNotes.firstChild) 
        pNotes.removeChild(pNotes.firstChild);

    if (text !== "")
    {
        const h2 = document.createElement("h2");
        h2.innerText = "Deck notes";
    
        const p = document.createElement("p");
        p.innerText = text;
    
        pNotes.appendChild(h2);
        pNotes.appendChild(p);
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
        for (_code of document.getElementById(sId).value.split('\n'))
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
        let asLines = document.getElementById(sId).value.split('\n');
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
        hazards : toJson("hazards")
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

const onLoadDecks = function(data)
{
    g_jDecks = data;

    let i = 0;

    const divGroup = document.createDocumentFragment();
    const divHtml = document.createElement("div");
    divHtml.setAttribute("class", "title");
    divHtml.innerText = "Choose your deck";
    divGroup.appendChild(divHtml);

    for (let deck of g_jDecks)
    {
        let divDeckType = document.createElement("div");
        divDeckType.setAttribute("class", "deck-group");

        let input = document.createElement("input");
        divDeckType.appendChild(input);
        input.setAttribute("type", "checkbox");
        input.setAttribute("id", "toggle_"+i);
        input.setAttribute("name", "toggle_"+i);
        input.setAttribute("value", "");
        if (i === 0)
            input.checked = true;

        let label = document.createElement("label");
        divDeckType.appendChild(label);
        label.setAttribute("class", "fa fa-chevron-down");
        label.setAttribute("for", "toggle_"+i);
        label.setAttribute("name", "toggle_"+i);
        label.innerText = " " + deck.name + " (" + Object.keys(deck.decks).length + ")";

        for (let key in deck.decks)
        {
            const divDeck = document.createElement("div");
            divDeck.setAttribute("class", "challenge-deck");
            divDeck.setAttribute("data-deck-list", i);
            divDeck.setAttribute("data-deck-id", key);
            divDeck.onclick = onChallengeDeckChosen;
            divDeck.innerText = key;
            divDeckType.appendChild(divDeck);
        }

        divGroup.appendChild(divDeckType);
        i++;
    }

    document.querySelector(".deck-list-entries").appendChild(divGroup);
}

const onChallengeDeckChosen = function(e)
{
    const sKey = e.target.getAttribute("data-deck-id");
    const nArray = parseInt(e.target.getAttribute("data-deck-list"));

    document.getElementById("toggle_isstandard").click();

    document.body.dispatchEvent(new CustomEvent("meccg-file-dropped", { "detail": g_jDecks[nArray].decks[sKey] }));
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
    const sName = document.getElementById("user").value.trim();
    if (sName === "")
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Enter valid username first." }));
        focusUsername();
        return "";
    }
    else
        return sName;
};

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

    document.getElementById("form").querySelector("textarea").value = JSON.stringify(
    {
        name: sName,
        deck: jDeck
    });

    const gameType = getGameType();
    const sUrlTarget = getTargetUrl(sUrl, gameType);
        
    document.getElementById("form").setAttribute("action", sUrlTarget + "/check");   
    document.getElementById("form").submit();
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
};

const onCheckCardCodes = function()
{
    if (!validateUserName())
        return;

    if (document.getElementById("invalid-cards-info") !== null)
    {
        DomUtils.removeAllChildNodes(document.getElementById("invalid-cards-info-result"));
        document.getElementById("invalid-cards-info").classList.add("hidden");
    }

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
                    onPerformLogin();
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

(function () {


    const sUserName = document.getElementById("user").value;
    if (sUserName === "")
    {
        loadSampleUserName();
        document.getElementById("user").focus();
    }
    else
        document.getElementById("user").value = sUserName;
   

    document.getElementById("host").onclick = onCheckCardCodes;

    fetch("/data/decks").then((response) => response.json().then(onLoadDecks))
    .catch((err) => 
    {
        console.log(err);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch game list." }));
    });

    const forms = document.getElementsByTagName("form");
    const len = forms === null ? 0 : forms.length;
    for (let i = 0; i < len; i++)
    {
        forms[i].onsubmit = (e) => {
            document.getElementById("host").dispatchEvent(new Event('click'));
            e.preventDefault();
            return false;
        }
    }

    document.body.dispatchEvent(new CustomEvent("meccg-init-dropzone", { "detail": "login" })); /** update the deck list view */

})();

document.body.addEventListener("meccg-deck-available", (e) => populateDeck(e.detail), false);
