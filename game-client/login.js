
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

    window.scrollTo({
        top: 0,
        left: 0, 
        behavior: 'smooth'
    }); 

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
    function toJson(sId)
    {
        let vsCards = [];
        let _code;
        for (_code of document.getElementById(sId).value.split('\n'))
        {
            let sCode = getCode(_code);
            if (sCode !== "")
                vsCards.push(sCode);
        }

        return vsCards;
    }

    let _res = [];

    _res = _res.concat(toJson("pool")); 
    _res = _res.concat(toJson("sideboard")); 
    _res = _res.concat(toJson("characters")); 
    _res = _res.concat(toJson("resources")); 
    _res = _res.concat(toJson("hazards")); 

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

    let sHtml = `<div class="title">Choose your deck</div>`;

    for (let i = 0; i < g_jDecks.length; i++)
    {
        sHtml += `<div class="deck-group">
                    <input type="checkbox" id="toggle_${i}" value="" name="toggle_${i}" ${i===0 ? 'checked' : ''}>
                    <label for="toggle_${i}" class="fa fa-chevron-down"> ${g_jDecks[i].name}</label>`;

        for (let key in g_jDecks[i].decks)
            sHtml += `<div class="challenge-deck" data-deck-list="${i}" data-deck-id="${key}">${key}</div>`;
           
        sHtml += "</div>"
    }

    document.querySelector(".deck-list-entries").innerHTML = sHtml;

    ArrayList(document).findByClassName("challenge-deck").each((elem) => elem.onclick = (e) => {

        let sKey = e.target.getAttribute("data-deck-id");
        let nArray = parseInt(e.target.getAttribute("data-deck-list"));

        if (document.getElementById("toggle_isarda").checked)
            document.getElementById("toggle_isarda").click();

        populateDeck(g_jDecks[nArray].decks[sKey]);
    });
}

const stripHashFromUrl = function()
{
    let sUrl = window.location.href;
    return sUrl.replace(/#/g, '').toLocaleLowerCase().trim();
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
        Notify.error("Enter valid username first");
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
        Notify.error("Invalid room");
        return false;
    }

    document.getElementById("form").querySelector("textarea").value = JSON.stringify(
    {
        name: sName,
        deck: jDeck
    });

    let sUrlTarget = !document.getElementById("toggle_isarda").checked ? sUrl : sUrl.replace("/play/", "/arda/");
    if (document.getElementById("toggle_issingleplayer") !== null)
        sUrlTarget = sUrl.replace("/play/", "/singleplayer/");
        
    document.getElementById("form").setAttribute("action", sUrlTarget + "/check");   
    document.getElementById("form").submit();
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
                {
                    let sHtml = "";
                    let nSize = data.codes.length;
                    for (let i = 0; i < nSize; i++)
                        sHtml += "<li>" + data.codes[i] + "</li>";

                    document.getElementById("invalid-cards-info-result").innerHTML = '<ul class="cookie_notice">' + sHtml + "</ul>";
                    document.getElementById("invalid-cards-info").classList.remove("hidden");

                    document.body.classList.remove("isLoggingIn");
                }
            });
        }
    }).catch(() => 
    {
        document.body.classList.remove("isLoggingIn");
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not check deck status." }));
    });   
};

(function () {


    const sUserName = document.getElementById("user").value;
    if (sUserName === "")
        document.getElementById("user").focus();
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

document.body.addEventListener("meccg-file-dropped", (e) => populateDeck(e.detail), false);
