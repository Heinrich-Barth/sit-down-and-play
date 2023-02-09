
const SearchBar = {
    
    initFormFields : function()
    {
        const vsOnChange = ["card_title", "card_text", "view_card_type", "view_card_align", "view_card_category", "view_card_set"];
        const vsOnEnter = ["card_title", "card_text"];
        
        for (let _id of vsOnEnter)
        {
            document.getElementById(_id).onkeydown = function(e)
            {
                if(e.key === "Enter")
                    SearchBar.onTriggerSearch();
            };
        }

        for (let _id of vsOnChange)
            document.getElementById(_id).onchange = () => SearchBar.onTriggerSearch();
    },

    onTriggerSearch : function()
    {
        const data = {
            align : document.getElementById("view_card_align").value,
            category : document.getElementById("view_card_category").value,
            text : document.getElementById("card_text").value,
            title : document.getElementById("card_title").value,
            type : document.getElementById("view_card_type").value,
            set : document.getElementById("view_card_set").value
        };
        
        if (data.type !== "" || data.align !== "" || data.title !== "" || data.text !== "" || data.category !== "" || data.set !== "")
            document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-search", { "detail": data }));
    },

    updateFormFields : function(e)
    {
        SearchBar.init();

        SearchBar.fillSelect("view_card_type", e.detail.type, "_alltype");
        SearchBar.fillSelect("view_card_align", e.detail.align, "_allalign");
        SearchBar.fillSelect("view_card_category", e.detail.category, "_allcategory");
        SearchBar.fillSelectSet("view_card_set", e.detail.sets);
        SearchBar.initFormFields();
    },

    fillSelectSet : function(sId, sortedList)
    {
        if (sortedList === undefined)
            sortedList = [];

        const pSelectType = document.getElementById(sId);
        
        let arrayList = Array.from(Object.entries(sortedList));
        arrayList.sort((a, b) => a[1].localeCompare(b[1]));

        {
            let option = document.createElement("option");
            option.text = "-------"
            option.value = "";
            pSelectType.add(option);
        }
        {
            let option = document.createElement("option");
            option.text = "Official sets only"
            option.value = "_official";
            pSelectType.add(option);
        }

        {
            let option = document.createElement("option");
            option.text = "Unofficial sets only"
            option.value = "_unofficial";
            pSelectType.add(option);
        }
        {
            let option = document.createElement("option");
            option.text = "-------"
            option.value = "";
            pSelectType.add(option);
        }

        for (let set of arrayList)
        {
            if (set[0] !== "" && set[1] !== "")
            {
                let option = document.createElement("option");
                option.text = set[1];
                option.value = set[0];
                pSelectType.add(option);
            }
        }
    },    

    fillSelect : function(sId, sortedList, sAllowAll)
    {
        if (sortedList === undefined)
            sortedList = [];

        const pSelectType = document.getElementById(sId);
        if (sAllowAll !== "")
        {
            let option = document.createElement("option");
            option.text = "Allow All";
            option.value = sAllowAll;
            pSelectType.add(option);
        }

        for (let _val of sortedList)
        {
            if (_val === "")
                continue;
                
            let option = document.createElement("option");
            option.text = _val;
            option.value = _val;
            pSelectType.add(option);
        }
    },    

    init : function()
    {
        if (document.getElementById("searchbar") !== null)
            return;

        const elem = document.createElement("div");
        elem.setAttribute("class", "pos-rel bgblue filters on-drag-hide");
        elem.setAttribute("id", "searchbar");
        elem.innerHTML = `
            <form method="post" action="#">
                <div class="fields">
                    <div class="field"><input type="text" name="card_title" id="card_title" placeholder="Search card title" /></div>
                    <div class="field"><input type="text" name="card_text" id="card_text" placeholder="Search card text" /></div>
                    <div class="field">
                        <select id="view_card_set">
                            <option value="">Limit Set</option>
                        </select>
                    </div>
                    <div class="field">
                        <select id="view_card_type">
                            <option value="">Limit Card Type</option>
                        </select>
                    </div>
                    <div class="field">
                        <select id="view_card_align">
                            <option value="">Limit Alignment</option>
                        </select>
                    </div>
                    <div class="field">
                        <select id="view_card_category">
                            <option value="">Limit Category</option>
                        </select>
                    </div>
                </div>
            </form>`;
        document.body.prepend(elem);
    }
};

document.body.addEventListener("meccg-deckbuilder-searchbar", SearchBar.updateFormFields, false);
