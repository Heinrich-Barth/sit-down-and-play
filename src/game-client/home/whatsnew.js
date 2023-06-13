const ReleaseNotes = {

    MAX_ENTRIES : 10,

    init : function(listRows)
    {
        if (!Array.isArray(listRows) || listRows.length === 0)
            return;

        const table = this.createTable(this.reduceList(listRows, this.MAX_ENTRIES));
        this.insertTemplate(table);
    },

    reduceList : function(list, maxEntries)
    {
        return list.length <= maxEntries ? list : list.slice(0, maxEntries);
    },

    createTable : function(list)
    {
        const table = document.createElement("table");
        table.setAttribute("class", "release-notes")
        table.innerHTML = `<thead>
        <tr>
            <th>Area</th>
            <th>Description</th>
        </tr>
        </thead>
        `;

        const tbody = document.createElement("tbody");
        table.appendChild(tbody);

        for (let row of list)
        {
            const tr = document.createElement("tr");
            
            const td1 = document.createElement("td");
            td1.innerText = row.type;

            const td2 = document.createElement("td");
            td2.innerText = row.description;

            tr.appendChild(td1);
            tr.appendChild(td2);
            tbody.appendChild(tr);
        }

        return table;
    },

    insertTemplate : function(table)
    {
        if (table === null)
            return;

        const pSibling = document.getElementById("game-list-wrapper");
        if (pSibling === null)
            return null;

        const div = document.createElement("div");
        div.setAttribute("class", "game-list");
        
        const h2 = document.createElement("h2");
        h2.innerText = "Latest Updates";

        const p = document.createElement("p")
        
        const aLink = document.createElement("a");
        aLink.setAttribute("href", "https://github.com/Heinrich-Barth/sit-down-and-play");
        aLink.setAttribute("target", "_blank");

        const aI = document.createElement("i");
        aI.setAttribute("class", "fa fa-github");
        aI.innerHTML = "&nbsp;";
        aLink.append(aI, document.createTextNode("github/sit-down-and-play"));

        p.append(
            document.createTextNode("This list contians the 10 latest feature/fixes. For a full list, please checkout the repository at"),
            aLink, 
            document.createTextNode(".")
        );

        div.appendChild(h2);
        div.appendChild(p);
        div.appendChild(table);

        pSibling.appendChild(div);
    }
    
};


fetch("/data/releasenotes")
.then(response => response.json())
.then(ReleaseNotes.init.bind(ReleaseNotes))
.catch(console.error);