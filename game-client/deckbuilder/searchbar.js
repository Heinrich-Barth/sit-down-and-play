
const SearchBar = {
    
    initFormFields : function()
    {
        var vsOnChange = ["card_title", "card_text", "view_card_type", "view_card_align", "view_card_category", "view_card_set"];
        var vsOnEnter = ["card_title", "card_text"];
        
        for (var _id of vsOnEnter)
        {
            document.getElementById(_id).onkeydown = function(e)
            {
                if(e.keyCode === '13')
                    SearchBar.onTriggerSearch();
            };
        }

        for (var _id of vsOnChange)
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
        
        if (data.type !== "" || data.align !== "" || data.title !== "" || data.text !== "" || data.category !== "")
            document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-search", { "detail": data }));
    },

    updateFormFields : function(e)
    {
        SearchBar.init();

        SearchBar.fillSelect("view_card_type", e.detail.type, "_alltype");
        SearchBar.fillSelect("view_card_align", e.detail.align, "_allalign");
        SearchBar.fillSelect("view_card_category", e.detail.category, "_allcategory");
        SearchBar.fillSelect("view_card_set", e.detail.sets, "");
        SearchBar.initFormFields();
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

        for (var _val of sortedList)
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
                <div class="fields" style="margin: 0px;">
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
