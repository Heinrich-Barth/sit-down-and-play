

/**
 * Force redirect to HTTPs if necessary (but not if localhost)
 * @returns void
 */
function assertHTTPS()
{
    let sUrl = window.location.href;
    if (window.location.protocol.toLocaleLowerCase().indexOf("https") === 0 || sUrl.toLocaleLowerCase().indexOf("http://localhost:") === 0)
        return;

    const nPos = sUrl.indexOf("//");
    window.location.href = "https:" + sUrl.substring(nPos);
}

/** enforce HTTPS */
assertHTTPS();

function populateField(jDeck, sId, bClear)
{
    if (bClear)
        jQuery("#" + sId).val("");

    if (jDeck === undefined)
        return;

    let sVal = jQuery("#" + sId).val();
    for(var k in jDeck) 
        sVal += "\n" + jDeck[k].count + " " + k;

    jQuery("#" + sId).val(sVal.trim());
}

function populateDeck(jData)
{
    if (jData === undefined)
        return;

    populateField(jData.resources, "resources", true);
    populateField(jData.hazards, "hazards", true);

    populateField(jData.avatar, "characters", true);
    populateField(jData.chars, "characters", false);

    populateField(jData.sideboard, "sideboard", true);
    populateField(jData.pool, "pool", true);
}

function removeQuotes(sCode) 
{
    if (sCode.indexOf('"') === -1)
        return sCode;
    else
        return sCode.replace(/"/g, '');
}

function getCardCodeList()
{
    function toJson(sId)
    {
        let vsCards = [];
        let _code;
        for (_code of jQuery("#" + sId).val().split('\n'))
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
}

function getCount(line)
{
    let nPos = line.indexOf(" ");
    if (nPos === -1)
        return "";
    else 
        return line.toString().substring(0, nPos);
}

function getCode(line)
{
    let nPos = line.indexOf(" ");
    if (nPos === -1)
        return "";
    else 
        return removeQuotes(line.toString().substring(nPos+1).trim());
}


function createDeck()
{
    function toJson(sId)
    {
        let asLines = jQuery("#" + sId).val().split('\n');
        let jDeck = {};

        for (_entry of asLines)
        {
            let sCount = getCount(_entry);
            let sCode = getCode(_entry);

            if (sCode !== "" && sCount !== "")
                jDeck[sCode] = parseInt(sCount);
        }

        return jDeck;
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
        Notify.error("This deck is not suitable for play. Verify that you have cards for pool, chars, and hazards/resources");
        return null;
    }
    else
        return jDeck;
}

function isEmpty(jDeck)
{
    return jDeck == undefined || Object.keys(jDeck).length === 0;
}

function openPage(sPage)
{
    window.location.href = sPage;
}

let g_jDecks = { };

function onLoadDecks()
{
    let sHtml = "";

    for (let i = 0; i < g_jDecks.length; i++)
    {
        sHtml += `<div class="deck-group"><h2>${g_jDecks[i].name}</h2>`
        for (let key in g_jDecks[i].decks)
            sHtml += `<div class="challenge-deck" data-deck-list="${i}" data-deck-id="${key}">${key}</div>`;

        sHtml += "<br></div>"
    }

    jQuery(".deck-list-entries").html(sHtml);

    jQuery(".challenge-deck").click(function()
    {
        let jThis = jQuery(this);
        let sKey = jThis.attr("data-deck-id");
        let nArray = parseInt(jThis.attr("data-deck-list"));
        populateDeck(g_jDecks[nArray].decks[sKey]);
    });
}

function stripHashFromUrl()
{
    let sUrl = window.location.href;
    return sUrl.replace(/#/g, '').toLocaleLowerCase().trim();
}

function isAlphaNumeric(sInput)
{
    return sInput !== undefined && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
}

function onPerformLogin()
{
    let jDeck = createDeck();
    if (jDeck === null) 
        return false;

    let sName = jQuery("#user").val().trim();
    if (!isAlphaNumeric(sName)) 
    {
        Notify.error("Enter valid username first");
        jQuery("#user").focus();
        return false;
    }

    let sUrl = stripHashFromUrl();
    if (sUrl === "")
    {
        Notify.error("Invalid room");
        return false;
    }

    let jForm = jQuery("#form");
    jQuery("#form").attr("action", sUrl + "/check");
    jQuery("#form textarea").val(JSON.stringify(
    {
        name: sName,
        deck: jDeck
    }));
    jForm.submit();
}

function onCheckCardCodes()
{
    jQuery("#invalid-cards-info-result").empty();
    jQuery("#invalid-cards-info").addClass("hidden");

    let vsCards = getCardCodeList();
    if (vsCards.length === 0)
        return;

    jQuery.post("/data/decks/check", { data : { cards : vsCards } }).done((data) =>
    {
        if (data.valid === true)
            onPerformLogin();
        else
        {
            let sHtml = "";
            let nSize = data.codes.length;
            for (let i = 0; i < nSize; i++)
                sHtml += "<li>" + data.codes[i] + "</li>";

            jQuery("#invalid-cards-info-result").html('<ul class="cookie_notice">' + sHtml + "</ul>");
            jQuery("#invalid-cards-info").removeClass("hidden");
        }
    });    
}

jQuery(document).ready(function () 
{
    const sUserName = jQuery("#user").val();
    if (sUserName === "")
        jQuery("#user").focus();
    else
        jQuery("#user").val(sUserName);

    jQuery("#choose_deck").click(function()
    {
        jQuery('#choose_deck_upload').click();
    });

    jQuery('#choose_deck_upload').on('change', function () 
    {
        jQuery("#dosubmit").addClass("hidden");

        let fileReader = new FileReader();
        fileReader.onload = function () 
        {
            populateDeck(JSON.parse(fileReader.result));
            jQuery("#dosubmit").removeClass("hidden");
        };

        fileReader.readAsText($('#choose_deck_upload').prop('files')[0]);
    });

    jQuery("#host").click(onCheckCardCodes);

    jQuery.get("/data/decks").done((data) =>
    {
        g_jDecks = data;
        onLoadDecks();

    });
});

