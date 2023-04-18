const ReleaseNotes = {

    init : function(listRows)
    {
        if (!Array.isArray(listRows) || listRows.length === 0)
            return;

        const table = this.createTable(listRows);
        this.insertTemplate(table);
    },

    createTable : function(list)
    {
        const table = document.createElement("table");
        table.setAttribute("class", "release-notes")
        table.innerHTML = `<thead>
        <tr>
            <th>Module</th>
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
        div.setAttribute("class", "game-lists");
        div.innerHTML = `<h2>Latest Updates</h2>`;
        div.appendChild(table);

        pSibling.appendChild(div);
    }
    
};


fetch("/data/releasenotes")
.then(response => response.json())
.then(ReleaseNotes.init.bind(ReleaseNotes))
.catch(console.error);