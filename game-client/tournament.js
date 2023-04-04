const exploreToken = function(input)
{
    const parts = input.split(".");
    if (parts.length !== 3)
        return null;
    else
        return JSON.parse(atob(parts[1]));
}

const createPointAssignment = function(list)
{
    if (list.length !== 2)
        return;

    const a = list[0].score >= list[1].score ? list[0] : list[1];
    const b = list[0].score >= list[1].score ? list[1] : list[0];

    if (a.score === b.score)
    {
        a.points = 3;
        b.points = 3;
    }
    else if (a.score >= b.score * 2)
    {
        a.points = 6;
        b.points = 0;
    }
    else if (a.score >= Math.round(b.score * 1.5))
    {
        a.points = 5;
        b.points = 1;
    }
    else
    {
        a.points = 4;
        b.points = 2;
    }
}

const getScoreList = function(token)
{
    const pointList = [];

    for (let key in token.score)
    {
        const score = token.score[key];
        let count = 0;
        for (let _cat in score)
            count += score[_cat];

        const name = token.players[key];
        pointList.push({
            name: name,
            score: count,
            points: -1
        });
    }

    pointList.sort( (a, b) => b.score - a.score );
    createPointAssignment(pointList);
    return pointList;
}

const populateResult = function(token, isValid)
{
    const date = new Date(token.date).toUTCString();
    const duration = Math.round((token.duration / 1000) / 60);

    const table = document.createElement("table");
    if (!isValid)
        table.setAttribute("class", "result-table result-table-invalid");
    else
        table.setAttribute("class", "result-table");

    const tbody = document.createElement("tbody");

    tbody.appendChild(createRow((isValid ? "" : "INVALID ") + "Game", date));
    tbody.appendChild(createRow("", duration + "min, " + token.turns + " turns"));

    const pointList = getScoreList(token);
    for (let _res of pointList)
        tbody.appendChild(createScoreRow(_res.name, _res.points, _res.score));

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

const createScoreRow = function(left, points, mps)
{
    let right = mps + " marshalling points";
    if (points !== -1)
        right = `${points} points (${mps} marshalling points)`;

    return createRow(left, right);
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
    const options = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: token
        })
    }

    fetch("/tournament/validate", options)
    .then((response) => populateResult(data, response.status === 204))
    .catch((err) => document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": err.message })) );
}

document.getElementById("token").onpaste = onPaste;
document.getElementById("token").onfocus = function() { this.value = ""} ;
