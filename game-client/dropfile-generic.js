
const DropZone = {

    dragenter : function(e) 
    {
        document.body.classList.add("on-drag-over");
        e.preventDefault();
    },

    onFileDropped : function(file)
    {
        if (file === undefined)
            return;

        const reader = new FileReader();
        reader.onload = (event) => DropZone.onFileRead(event.target.result);
        reader.onerror = () => Notify.error("Cannot read given file.");
        reader.readAsText(file);
    },

    onFileRead : function(sText)
    {
        if (sText === undefined || sText.trim() === "")
            Notify.error("File seems to be empty...");
        
        try
        {
            let json = JSON.parse(sText);
            document.body.dispatchEvent(new CustomEvent("meccg-file-dropped", { "detail": json }));
        }
        catch (e)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Failed to parse file data..." }));
        }
    },

    drop : function(ev)
    {
        document.body.classList.remove("on-drag-over");
        ev.preventDefault();

        if (ev.dataTransfer.items) 
        {
            const len = ev.dataTransfer.items.length;
            if (len === 1)
                DropZone.onFileDropped(ev.dataTransfer.items[0].getAsFile())
        } 
        else 
        {
            const len = ev.dataTransfer.files.length;
            if (len === 1)
                DropZone.onFileDropped(ev.dataTransfer.files[i]);
        }
    },

    addCss : function()
    {
        /** add CSS  */
        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href","/media/assets/css/dropfile.css");
        document.head.appendChild(link);
    },

    init : function()
    {
        this.addCss();
        const elem = document.body;

        elem.ondragover = DropZone.dragenter;
        elem.ondragleave = DropZone.dragleave;
        elem.ondrop = DropZone.drop;

        const div = document.createElement("div");
        div.setAttribute("class", "on-drop-info bgblue");
        div.innerHTML = "Drop Deck File<br>on the green";
        document.body.appendChild(div);
    },

    dragleave : function(e)
    {
        document.body.classList.remove("on-drag-over");
        e.preventDefault();
    },

    ondragend : function(e)
    {
        console.log("ondragend");
        document.body.classList.remove("on-drag-over");
        e.preventDefault();
    }
};

DropZone.init();
