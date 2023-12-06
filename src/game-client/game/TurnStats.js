class TurnStats {

    static INSTANCE = new TurnStats();

    #oder = [];
    #data = { };
    #avg = { };
    #sums = { };
    #count = 0;
    
    #getStatsList()
    {
        const list = sessionStorage.getItem("meccg_turn_stats");
        if (list === null || list === "")
            return [];
        else
            return JSON.parse(list);
    }
   
    #onOrganizationPhase(id)
    {
        if (id === undefined || id === "")
            return;

        const timeElement = {
            id: id,
            start: Date.now()
        };

        const list = this.#getStatsList();
        if (list.length > 0)
        {
            const lastElem = list[list.length - 1];
            if (id === lastElem.id)
                return;

            lastElem.time = Date.now() - lastElem.start;
            delete lastElem.start;
        }

        list.push(timeElement);
        sessionStorage.setItem("meccg_turn_stats", JSON.stringify(list));
    }

    #showStats(list)
    {
        if (list.length === 0)
            return;

        this.#createData(list);
        this.#sumTurnTimes();

        this.#printStats();
        this.#injectStatsOnFinalScore();
    }

    #createData(list)
    {
        for (let elem of list)
        {
            const time = elem.start !== undefined ? Date.now() - elem.start : elem.time;
            const id = elem.id;

            this.#createDataEntry(id, time);
        }
    }

    #createDataEntry(id, time)
    {
        if (!this.#oder.includes(id))
        {
            this.#oder.push(id);
            this.#data[id] = []
            this.#avg[id] = [];
        }

        this.#data[id].push(this.#parseTime(time));
        this.#avg[id].push(time);

        const thisLen = this.#data[id].length;
        if (this.#count < thisLen)
            this.#count = thisLen;
    }

    #parseTime(time)
    {
        const date = new Date(time);
        const min = this.#assertLeadingZero(date.getMinutes());
        const sec = this.#assertLeadingZero(date.getSeconds());
        return min + ":" + sec;
    }

    #printStats()
    {
        if (this.#oder.length === 0)
            return;

        const target = document.getElementById("final-score-table");
        if (target !== null)
        {
            target.parentElement.insertBefore(this.#createResultTable(), target.nextSibling);
            target.parentElement.appendChild(this.#createToggleLink());
        }
    }

    toggleStats(e)
    {
        const elem = document.getElementById("toggle-turn-stats");
        const table1 = document.getElementById("final-score-table");
        const table2 = document.getElementById("table-turn-stats");

        if (table1.classList.contains("hidden"))
        {
            table1.classList.remove("hidden");
            table2.classList.add("hidden");
            elem.innerText = "Show turn duration statistics";
        }
        else
        {
            table1.classList.add("hidden");
            table2.classList.remove("hidden");
            elem.innerText = "Show final scoring table";
        }

        return false;
    }

    #createToggleLink()
    {
        const a = document.createElement("a");
        a.setAttribute("id", "toggle-turn-stats")
        a.innerText = "Show turn duration statistics";
        a.setAttribute("href", "#");
        a.onclick = this.toggleStats.bind(this);

        const p = document.createElement("p");
        p.setAttribute("class", "center toggle-turn-stats");
        p.appendChild(a);
        return p;
    }

    #createTableHead()
    {
        const tr = document.createElement("tr");
        tr.appendChild(this.#createElement("th", "#"));
        for (let id of this.#oder)
            tr.appendChild(this.#createElement("th", this.#getName(id)));

        const thead = document.createElement("thead");
        thead.appendChild(tr);
        return thead;
    }

    #createResultTable()
    {
        const table = document.createElement("table");
        table.setAttribute("class", "turn-stats hidden");
        table.setAttribute("id", "table-turn-stats");

        table.appendChild(this.#createTableHead()); 
        table.appendChild(this.#createResultTableBody());
        table.appendChild(this.#createResultTableAverage());

        return table;
    }

    #injectStatsOnFinalScore()
    {
        for (let id of this.#oder)
        {
            const data = this.#getData(id);
            if (data !== null)
            {
                this.#injectStatsOnFinalScoreValue("final-score-time-total-" + id, data.sum);
                this.#injectStatsOnFinalScoreValue("final-score-time-avg-" + id, data.avg);
            }            
        }
    }

    #injectStatsOnFinalScoreValue(id, value)
    {
        const elem = document.getElementById(id);
        if (elem !== null)
            elem.innerText = value;
    }

    #isValidTime(t)
    {
        return t >= 1000 * 10;
    }

    #sumTurnTime(id)
    {
        let sum = 0;
        let turns = 0;

        const list = this.#avg[id];
        for (let t of list)
        {
            if (this.#isValidTime(t))
            {
                sum += t;
                turns++;
            }
        }
            
        const acum = sum === 0 ? "00:00" : this.#parseTime(sum);
        const avg = turns === 0 ? "00:00" : this.#parseTime(Math.round(sum / turns));

        return {
            sum: acum,
            avg: avg
        }
    }

    #sumTurnTimes()
    {
        for (let id of this.#oder)
            this.#sums[id] = this.#sumTurnTime(id);
    }

    #getData(id)
    {
        const val = this.#sums[id];
        return val === undefined ? null : val;
    }

    #createResultTableAverage()
    {
        const tr = document.createElement("tr");
        tr.append(this.#createElement("td", ""));

        for (let id of this.#oder)
        {
            let sum = 0;
            const list = this.#avg[id];
            for (let t of list)
                sum += t;

            const avg = this.#parseTime(Math.round(sum / list.length));
            tr.append(this.#createElement("td", avg));
        }

        const tfoot = document.createElement("tfoot");
        tfoot.appendChild(tr);
        return tfoot;
    }
    
    #createResultTableBody()
    {
        const tbody = document.createElement("tbody");

        for (let i = 0; i < this.#count; i++)
            tbody.appendChild(this.#createResultTableEntry(i+1));

        return tbody;
    }

    #createResultTableEntry(index)
    {
        const tr = document.createElement("tr");
        tr.append(this.#createElement("td", "" + index));

        for (let id of this.#oder)
        {
            const list = this.#data[id];
            const val = list === undefined || list.length === 0 ? "-" : list.shift();
            tr.append(this.#createElement("td", val));
        }

        return tr;
    }

    #createElement(type, val)
    {
        const elem = document.createElement(type);
        elem.innerText = val;
        return elem;
    }

    #assertLeadingZero(input)
    {
        if (input < 10)
            return "0" + input;
        else
            return "" + input;
    }

    #getName(id)
    {
        return MeccgPlayers.getPlayerDisplayName(id);
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

    static onSave(e)
    {
        TurnStats.INSTANCE.#onOrganizationPhase(e.detail);
    }

    static OnShowTurnStats()
    {
        const list = TurnStats.INSTANCE.#getStatsList();
        TurnStats.INSTANCE.#showStats(list);

        sessionStorage.removeItem("meccg_turn_stats");
    }


}


document.body.addEventListener("meccg-event-turn", TurnStats.onSave, false);
document.body.addEventListener("meccg-dice-stats", TurnStats.OnShowTurnStats, false);
