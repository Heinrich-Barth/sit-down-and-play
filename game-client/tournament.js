const exploreToken = function(input)
{
    const parts = input.split(".");
    if (parts.length !== 3)
        return null;
    else
        return JSON.parse(atob(parts[1]));
}

const populateResult = function(token)
{
    const date = new Date(token.date).toString();
    const duration = Math.round((token.duration / 1000) / 60);

    const table = document.createElement("table");
    const tbody = document.createElement("tbody");

    tbody.appendChild(createRow("Date", date));
    tbody.appendChild(createRow("Game", duration + "min, " + token.turns + " turns"));

    for (let key in token.score)
    {
        const score = token.score[key];
        let count = 0;
        for (let _cat in score)
            count += score[_cat];

        const name = token.players[key];
        tbody.appendChild(createRow(name, count + " points"));
    }

    let _th = "Decks";
    for (let _check of token.checksums)
    {
        tbody.appendChild(createRow(_th, _check));
        _th = "";
    }

    table.appendChild(tbody);

    document.getElementById("result").prepend(table);
    document.getElementById("result").classList.remove("hide");
}

const createRow = function(left, right)
{
    const tr = document.createElement("tr");

    const th = document.createElement("th");
    th.innerText = left;

    const td = document.createElement("td");
    td.innerText = right;

    tr.appendChild(th);
    tr.appendChild(td);

    return tr;
}

const onPaste = function(event)
{
    const token = (event.clipboardData || window.clipboardData).getData("text").trim();
    const data = exploreToken(token);
    if (data === null)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Token is invalid" }));
        document.getElementById("token").value = "";
        return false;
    } 
    else
        populateResult(data);
}

document.getElementById("token").onpaste = onPaste;
document.getElementById("token").onfocus = function() { this.value = ""} ;
