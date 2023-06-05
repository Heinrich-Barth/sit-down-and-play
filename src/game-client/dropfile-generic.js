
const DropZone = {

    _dropzoneId : "",

    dragenter : function(e) 
    {
        e.preventDefault();
        const elem = document.getElementById(DropZone._dropzoneId);
        if (elem !== null)
            elem.classList.add("on-drag-over");   
    },

    onFileDropped : function(file)
    {
        if (file === undefined)
            return;

        try
        {
            const reader = new FileReader();
            reader.onerror = () => document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Cannot read given file." }));
            reader.onload = (event) => DropZone.onFileRead(event.target.result, file.name);
            reader.readAsText(file);
        }
        catch(err)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Cannot read given file." }));   
            console.error(err);
        }
    },

    onFileRead : function(sText, file)
    {
        if (sText === undefined || sText.trim() === "")
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "File seems to be empty..." }));

        document.body.dispatchEvent(new CustomEvent("meccg-file-dropped", { "detail": sText }));
        document.body.dispatchEvent(new CustomEvent("meccg-file-dropped-name", { "detail": file }));
    },

    drop : function(ev)
    {
        ev.preventDefault();

        const elem = document.getElementById(DropZone._dropzoneId);
        if (elem !== null)
            elem.classList.remove("on-drag-over");

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

    init : function(sId)
    {
        const elem = document.getElementById(sId);
        if (elem === null)
            return;

        this._dropzoneId = sId;
        this.addCss();

        elem.ondragover = DropZone.dragenter;
        elem.ondragexit = DropZone.dragleave;
        elem.ondragleave = DropZone.dragleave;
        elem.ondrop = DropZone.drop;
    },

    dragleave : function(e)
    {
        e.preventDefault();

        const elem = document.getElementById(DropZone._dropzoneId);
        if (elem !== null)
            elem.classList.remove("on-drag-over");
    },

    ondragend : function(e)
    {
        document.body.classList.remove("on-drag-over");
        e.preventDefault();
    }
};

document.body.addEventListener("meccg-init-dropzone", (e) => DropZone.init(e.detail), false);
