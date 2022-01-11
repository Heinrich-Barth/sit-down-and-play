/**
 * Adds a search icon to the map and allows to filter by region or
 * search for any site in the list
 */
class MapViewRegionsMovementFilterable extends MapViewRegionsMovement  {

    constructor(jMap, jTappedSites)
    {
        super(jMap, jTappedSites);
    }

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

    createInstance(sStartSiteCode)
    {
        if (super.createInstance(sStartSiteCode))
        {
            this.insertTemplate();
            this.initFilters();    
            return true;
        }
        else
            return false;
    }

    appendOption(value, text)
    {
        const opt = document.createElement('option');
        opt.appendChild( document.createTextNode(text) );
        opt.value = value; 
        return opt;
    }

    onSelChange()
    {
        const sRegionTitle = this.getCurrentRegion();
        if (sRegionTitle === "")
            return false;
        
        this.updateRegionSiteList(sRegionTitle);

        if (!this.ignoreMarkerClickOnce())
            this.fireRegionClick(sRegionTitle);
        
        this.setIgnoreMarkerClickOnce(false);
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

    initFilters()
    {
        const sel = document.getElementById('region');
        if (sel === null)
            return;
        
        // load regions
        let _region;
        const voRegions = this.getMapData();
        for (let key in voRegions)
        {
            _region = voRegions[key];
            
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

    onSearchByTitle()
    {
        const sText = document.getElementById("card_text").value.trim().toLowerCase();
        if (sText.length < 3)
            return;

        const showAlignment = this.createSearchLimitations();
        const map = this.getMapData();
        for (let _region in map)
        {
            if (_region.toLowerCase().indexOf(sText) > -1)
                this.getRegionImages(map[_region]);

            for (let _site in map[_region].sites)
            {
                if (_site.toLowerCase().indexOf(sText)  > -1)
                    this.getSiteImages(map[_region].sites[_site], showAlignment);
            }
        }

        this.fillSiteList();
    }

}