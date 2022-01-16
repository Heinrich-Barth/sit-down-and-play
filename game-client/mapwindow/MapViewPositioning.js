
class MapViewPositioning extends MapViewRegions {

    constructor(jMap)
    {
        super(jMap);

        this.mapPositions = {};
        this.mapCoordinates = {};

        this.currentSelection = {
            region: "",
            code: "",
            title: "",
            isSite: false
        };

        this.newPositions = {};
    }

    insertSearchTemplate()
    {
        let div = document.createElement("div");
        div.setAttribute("class", "blue-box mapchooser");

        const sel = document.createElement("select");
        sel.setAttribute("id", "region");
        sel.setAttribute("name", "region");
        sel.onchange = this.onSelChange.bind(this)
        div.appendChild(sel);

        const span = document.createElement("span");
        span.setAttribute("class", "fa fa-floppy-o");
        span.onclick = this.copyPositions.bind(this);
        div.appendChild(span);
        document.body.appendChild(div);
    }

    copyPositions()
    {
        navigator.clipboard.writeText(JSON.stringify(this.newPositions));
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Copied to clipboard"}));

    }

    updateSelectBox()
    {
        let listCompleted = [];
        let listIncomplete = [];

        for (let key in this.mapCoordinates)
        {
            let _region = this.mapCoordinates[key];
            if (_region.area.length !== 2)
            {
                listIncomplete.push(key);
                continue;
            }
              
            let isComplete = true;
            for (let _site in _region.sites)
            {
                if (_region.sites[_site].length !== 2)
                {
                    isComplete = false;
                    break;
                }
            }

            if (isComplete)
                listCompleted.push(key);
            else 
                listIncomplete.push(key);
        }

        this.updateSelectContent(listCompleted, listIncomplete)
    }

    updateSelectContent(listCompleted, listIncomplete)
    {
        const sel = document.getElementById('region');
        if (sel === null)
            return;

        sel.selectedIndex = 0;
        while (sel.size > 1)
            sel.remove(1);

        if (listIncomplete.length > 0)
        {
            sel.appendChild(this.appendOption("", "- Choose Region -"));
            for (let key of listIncomplete)
                sel.appendChild(this.appendOption(key, key));
        }

        sel.appendChild(this.appendOption("", "- Choose Region (completed) -"));
        for (let key of listCompleted)
            sel.appendChild(this.appendOption(key, key));
    }

    
    appendOption(value, text)
    {
        const opt = document.createElement('option');
        opt.appendChild( document.createTextNode(text) );
        opt.value = value; 
        return opt;
    }
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
    }

    performSearch(region, text)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-map-search", { "detail":  {
            region: region,
            text : text
        } }));
    }

    createInstance()
    {
        super.createInstance("");

        document.body.classList.add("map-editor");

        this.getMapInstance().addEventListener('mouseup', this.onMapClick.bind(this));
        this.initPositionData(this.getMapData());

        /** respond to click on site card */
        document.body.addEventListener("meccg-map-siteclick", this.onSelectLocationPosition.bind(this), false);
        document.body.addEventListener("meccg-map-show-images-done", this.onMarkSitesHasLocation.bind(this), false);

        this.insertSearchTemplate();
        this.updateSelectBox();
        return true;
    }

    onMarkSitesHasLocation(e)
    {
        const code = e == undefined || e.detail === undefined ? "found_sites" : e.detail;
        const container = document.getElementById(code);
        if (container === null)
            return;

        const list = container.getElementsByTagName("img");
        if (list === null || list.length === 0)
            return;

        const len = list.length;
        for (let i = 0; i < len; i++)
        {
            const _image = list[i];
            if (!_image.classList.contains("site-is-tapped") && this.isAvailable(_image.getAttribute("data-site")))
                _image.classList.add("site-is-tapped");
        }
    }

    isAvailable(code)
    {
        return code === null || code === "" ? false : this.mapPositions[code].length == 2;
    }

    setCurrentSelection(region, code, isSite, title)
    {
        this.currentSelection.region = region;
        this.currentSelection.code = code;
        this.currentSelection.isSite = isSite;
        this.currentSelection.title = title;
    }

    isValidClick()
    {
        /** there always has to be a region */
        return this.currentSelection.title !== "";
    }

    onSelectLocationPosition(e)
    {
        this.setCurrentSelection(e.detail.region, e.detail.code, e.detail.isSite, e.detail.title);
        this.changeGlow(e.detail.code); 
    }

    removeSelection()
    {
        this.removeGlow(document.getElementById("found_sites"));
        this.currentSelection.title = "";
    }

    changeGlow(code)
    {
        const elem = document.getElementById("found_sites");
        this.removeGlow(elem);
        this.setGlow(elem, code);        
    }

    setGlow(elem, code)
    {
        const list = elem === null ? null : elem.getElementsByTagName("img");
        if (list === null || list.length === 0)
            return;

        const len = list.length;
        for (let i = 0; i < len; i++)
        {
            const _img = list[i];
            if (code === _img.getAttribute("data-code"))
            {
                _img.classList.add("glow");
                break;
            }
        }
    }

    removeGlow(elem)
    {
        const list = elem === null ? null : elem.getElementsByClassName("glow");
        if (list === null || list.length === 0)
            return;

        const len = list.length;
        for (let i = 0; i < len; i++)
            list[i].classList.remove("glow");
    }

    updatePosition(lat, lng)
    {
        if (this.mapPositions[this.currentSelection.title] === undefined)
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not find " +  this.currentSelection.title }));
        else
        {
            this.mapPositions[this.currentSelection.title] = [lat, lng];
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Position updated<br>" + this.currentSelection.title}));
        }

        this.newPositions[this.currentSelection.title] = [lat, lng];
    }

    updateMakerPositionOnBoard(lat, lng)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-map-updatemarker", { 
            "detail": {
                region: this.currentSelection.region,
                title: this.currentSelection.title,
                isSite: this.currentSelection.isSite,
                lat : lat,
                lng : lng
            }
        }));
    }

    onMapClick(ev)
    {
        if (this.isValidClick())
        {
            const lat = ev.latlng.lat;
            const lng = ev.latlng.lng;
            
            this.updatePosition(lat, lng);
            this.updateMakerPositionOnBoard(lat, lng);
            this.removeSelection();
            this.onMarkSitesHasLocation();
        }

        this.setCurrentSelection("", "", false, "");
    }

    initPositionData(jMap)
    {
        for (let key in jMap)
        {
            this.mapCoordinates[key] = {
                area : [],
                sites : {}
            }

            const _region = jMap[key];
            if (_region.area !== undefined && _region.area.length === 2)
            {
                this.mapCoordinates[key].area = [..._region.area];
                this.mapPositions[key] = [..._region.area];
            }
            else
                this.mapPositions[key] = [];
                
            for (let _site in _region.sites)
            {
                const _location = _region.sites[_site];
                if (_location.area.length === undefined || _location.area.length !== 2)
                {
                    this.mapCoordinates[key].sites[_site] = [];
                    this.mapPositions[_site] = [];
                }
                else
                {
                    this.mapCoordinates[key].sites[_site] = [..._location.area];
                    this.mapPositions[_site] = [..._location.area];
                }
            }
        }
    }

}

/*
"Andrast": [
		"71.58725638163845",
		"-121.44287109375001"
	],

*/