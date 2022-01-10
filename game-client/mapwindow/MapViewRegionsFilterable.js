/**
 * Adds a search icon to the map and allows to filter by region or
 * search for any site in the list
 */
class MapViewRegionsFilterable {

    insertTemplate()
    {
        let div = document.createElement("div");
        div.setAttribute("class", "map-search cursor-pointer fr blue-box");
        div.innerHTML = '<i class="fa fa-search" aria-hidden="true" title="Click to see search options"></i>';
        div.onclick = this.toggleSearchTemplatePane.bind(this);
        document.body.appendChild(div);

        div = document.createElement("div");
        div.setAttribute("class", "blue-box mapchooser hide");

        div.innerHTML = `<div class="field"><input type="text" name="card_text" id="card_text" placeholder="Search site/region title" /></div>
                        <div class="field">
                            <select id="region" name="region">
                                <option value="">Select Region</option>
                            </select>
                        </div>
                        <div class="field hide"><select id="sitelist" name="region"><option value="">Select Site</option></select></div>`;

        document.body.appendChild(div);
    }

    createInstance(map)
    {
        this.insertTemplate();
        this.initFilters(map);    
    }

    appendOption(value, text)
    {
        const opt = document.createElement('option');
        opt.appendChild( document.createTextNode(text) );
        opt.value = value; 
        return opt;
    }

    /**
    * Get the "site"
    * @return String
    */ 
    getCurrentSite()
    {
        const yourSelect = document.getElementById("sitelist");
        return yourSelect.options[ yourSelect.selectedIndex ].value;
    }
 
     /**
      * Get the "region"
      * @return String
      */ 
    getCurrentRegion()
    {
        const yourSelect = document.getElementById("region");
        return yourSelect.options[ yourSelect.selectedIndex ].value;
    }

    onSelChange()
    {
        const sRegionTitle = this.getCurrentRegion();
        if (sRegionTitle !== "")
            this.performSearch(sRegionTitle, "");

        this.hideSearchTemplatePane();
    }

    hideSearchTemplatePane()
    {
        const jElem = document.querySelector(".mapchooser");
        if (!jElem.classList.contains("hide"))
            jElem.classList.add("hide");
    }

    toggleSearchTemplatePane()
    {
        const jElem = document.querySelector(".mapchooser");
        if (jElem.classList.contains("hide"))
        {
            jElem.classList.remove("hide");
            document.getElementById("card_text").focus();
        }
            
        else
            jElem.classList.add("hide");
    }

    initFilters(jMap)
    {
        const sel = document.getElementById('region');
        if (sel === null)
            return;
        
        let _region;

        for (let key in jMap)
        {
            _region = jMap[key];
            
            const count = Object.keys(_region.sites).length;
            if (count > 0)
                sel.appendChild(this.appendOption(key, _region.title + " (" + count + ")"));
        }
        
        sel.onchange = this.onSelChange.bind(this);
        
        const textBox = document.getElementById("card_text");
        textBox.onchange = this.onSearchByTitle.bind(this);
        textBox.onkeypress = this.onKeyPress.bind(this);
    }

    onKeyPress(e)
    {
        if (e.which === 13)
        {
            e.preventDefault();
            this.onSearchByTitle();
            return false;
        }
    }

    performSearch(region, text)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-map-search", { "detail":  {
            region: region,
            text : text
        } }));
    }

    onSearchByTitle()
    {
        const sText = document.getElementById("card_text").value.trim().toLowerCase();
        if (sText.length > 2)
        {
            this.performSearch("", sText);
            this.hideSearchTemplatePane();
        }
    }

}