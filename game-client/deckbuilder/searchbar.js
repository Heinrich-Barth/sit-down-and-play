
const SearchBar = {
    
    initFormFields : function()
    {
        const vsOnChange = ["card_title", "view_card_type", "view_card_align", "view_card_category", "view_card_set", "view_card_keyword", "view_card_skill"];
        const vsOnEnter = ["card_title"];
        
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
            text : document.getElementById("card_title").value,
            title : document.getElementById("card_title").value,
            type : document.getElementById("view_card_type").value,
            set : document.getElementById("view_card_set").value,
            keyword : document.getElementById("view_card_keyword").value,
            skill : document.getElementById("view_card_skill").value
        };

        let res = "";
        for (let key in data)
            res += data[key];
        
        if (res !== "")
            document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-search", { "detail": data }));
    },

    updateFormFields : function(e)
    {
        SearchBar.init();
        SearchBar.fillSelect("view_card_type", e.detail.type, "_alltype");
        SearchBar.fillSelect("view_card_align", e.detail.align, "_allalign");
        SearchBar.fillSelect("view_card_category", e.detail.category, "_allcategory");
        SearchBar.fillSelect("view_card_keyword", e.detail.keywords, "_all");
        SearchBar.fillSelect("view_card_skill", e.detail.skills, "_all");
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

        this.clearOptionList(pSelectType);

        let dataName = pSelectType.getAttribute("data-name");
        if (dataName !== null && dataName !== "")
        {
            let option = document.createElement("option");
            option.text = dataName;
            option.value = "";
            pSelectType.add(option);
        }

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

    clearOptionList : function(pSelectType)
    {
        if (pSelectType === null || typeof pSelectType.options === "undefined")
            return;

        pSelectType.options.length = 0;
    },

    fillSelect : function(sId, sortedList, sAllowAll)
    {
        if (sortedList === undefined)
            sortedList = [];

        const pSelectType = document.getElementById(sId);
        this.clearOptionList(pSelectType);

        let dataName = pSelectType.getAttribute("data-name");
        if (dataName !== null && dataName !== "")
        {
            let option = document.createElement("option");
            option.text = dataName;
            option.value = "";
            pSelectType.add(option);
        }

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

        const form = document.createElement("form");
        form.onsubmit = () => {
            SearchBar.onTriggerSearch();
            return false;
        }
        
        form.innerHTML =  `
                <div class="fields">
                    <div class="field">
                        <input type="text" name="card_title" id="card_title" placeholder="Search text" />
                    </div>
                    <div class="field">
                        <select id="view_card_set" data-name="Set"></select>
                    </div>
                    <div class="field">
                        <select id="view_card_type" data-name="Card Type"></select>
                    </div>
                    <div class="field">
                        <select id="view_card_align" data-name="Alignment"></select>
                    </div>
                    <div class="field">
                        <select id="view_card_category" data-name="Category"></select>
                    </div>
                    <div class="field">
                        <select id="view_card_keyword" data-name="Keyword"></select>
                    </div>
                    <div class="field">
                        <select id="view_card_skill" data-name="Skill"></select>
                    </div>
                </div>`;
        elem.appendChild(form);
        document.body.prepend(elem);
    }
};

document.body.addEventListener("meccg-deckbuilder-searchbar", SearchBar.updateFormFields.bind(SearchBar), false);
