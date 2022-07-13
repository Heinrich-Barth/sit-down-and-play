

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
    let count = 0;

    function toJson(sId)
    {
        let asLines = document.getElementById(sId).value.split('\n');
        let deck = {};

        for (let _entry of asLines)
        {
            let sCount = getCount(_entry);
            let sCode = getCode(_entry);

            if (sCode !== "" && sCount !== "")
            {
                deck[sCode] = parseInt(sCount);
                count += deck[sCode];
            }
        }

        return deck;
    }

    let jDeck = {
        pool: {
            characters: {},
            resources: toJson("pool"),
            hazards: {}
        },
        sideboard: {
            resources: toJson("sideboard"),
            characters: {},
            hazards: {}
        },
        deck: {
            characters : toJson("characters"),
            resources : toJson("resources"),
            hazards : toJson("hazards")
        }
    };

    if (count === 0)
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
 
 
const onPerformLogin = function()
{
    const data = createDeck();
    if (data === null) 
        return false;

    let sName = document.getElementById("deckname").value;
    if (sName === null || sName === undefined || sName === "")
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Provide a deck name first" }));
        document.getElementById("deckname").focus();
    }
    else
    {
        sName = sName.trim();
        const det = {
            data: ReadDeck.toString(data, sName, document.getElementById("notes").value.trim()),
            name : sName
        };

        document.body.dispatchEvent(new CustomEvent("meccg-saveas-deck", { "detail": det}));
    }
};
  

const onCheckCardCodes = function()
{
    if (document.getElementById("invalid-cards-info") !== null)
    {
        DomUtils.removeAllChildNodes(document.getElementById("invalid-cards-info-result"));
        document.getElementById("invalid-cards-info").classList.add("hidden");
    }
 
    const vsCards = getCardCodeList();
    if (vsCards.length === 0)
        return;

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
                }
            });
        }
    }).catch(() => 
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not check deck status." }));
    });   
};
 
(function()
{
    document.getElementById("host").onclick = onCheckCardCodes;
})();