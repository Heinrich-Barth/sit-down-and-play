
class DiceStats {

    static addColumnCell(pBody, type, name)
    {
        let pTh = document.createElement(type);
        pTh.innerText = name;
        pBody.appendChild(pTh);
        return pTh;
    }

    static toNumber(val)
    {
        try
        {
            return parseInt(val);
        }
        catch (err)
        {
            /** ignore */
        }

        return 0;
    }

    static toFloat(val, nDec)
    {
        try
        {
            return Number.parseFloat(val).toFixed(nDec)
        }
        catch (err)
        {
            /** ignore */
        }

        return Math.trunc(val);
    }

    static insertResults(users)
    {
        let bEmpty = true;
        const tBody = document.createElement("tbody");
        
        for (let key in users)
        {
            let count = 0;
            let average = 0;
            bEmpty = false;
            const tr = document.createElement("tr");
            DiceStats.addColumnCell(tr, "td", MeccgPlayers.getPlayerDisplayName(key));
            
            for (let i = 2; i < 13; i++)
            {
                let res = users[key]["" + i];
                if (res === undefined || res === "")
                    res = "-";
                else
                {
                    let num = DiceStats.toNumber(res);
                    count += num;
                    average += (num * i);
                }

                DiceStats.addColumnCell(tr, "td", res);
            }

            DiceStats.addColumnCell(tr, "td", count);
            DiceStats.addColumnCell(tr, "td", "").innerHTML = DiceStats.toFloat(average / count, 1);

            tBody.appendChild(tr);
        }

        return bEmpty ? null : tBody;
    }

    static createHeader()
    {
        let tHead = document.createElement("thead");
        let tr = document.createElement("tr");
        DiceStats.addColumnCell(tr, "th", "");
        for (let i = 2; i < 13; i++)
            DiceStats.addColumnCell(tr, "th", i);

        DiceStats.addColumnCell(tr, "th", "").innerHTML = "&sum;";
        DiceStats.addColumnCell(tr, "th", "").innerHTML = "&asymp;";

        tHead.appendChild(tr);
        return tHead;
    }

    static createTable(users)
    {
        const tBody = DiceStats.insertResults(users);
        if (tBody === null)
            return null;
        else
        {
            const pTable = document.createElement("table");
            pTable.setAttribute("id", "dice-stats");
            pTable.setAttribute("class", "dice-stats");
            pTable.appendChild(DiceStats.createHeader());
            pTable.appendChild(tBody);
            return pTable;
        }
    }

    static OnShow(e)
    {
        const cont = document.getElementById("scoring-sheet");
        if (cont === null)
            return;

        const elem = cont.getElementsByClassName("view-score-container");
        if (e.detail === undefined || elem === null || elem.length === 0 || Object.keys(e.detail).length === 0)
            return;
            
        let jTable = DiceStats.createTable(e.detail);
        if (jTable !== null)
            elem[0].appendChild(jTable);
    }

}

document.body.addEventListener("meccg-dice-stats", DiceStats.OnShow, false);
