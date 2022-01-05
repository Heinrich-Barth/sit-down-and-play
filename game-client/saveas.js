const SaveJsonAsDialog = {

    onSaveFile : function(e)
    {
        SaveJsonAsDialog.onSave(e.detail.data, e.detail.name + ".meccg-savegame");
    },

    onSaveDeck : function(e)
    {
        SaveJsonAsDialog.onSave(e.detail.data, e.detail.name + ".meccg");
    },

    onSave : function(data, filename)
    {
        if (!data)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "No data provided to store." }));
            return;
        }          

        try
        {
            const content = [JSON.stringify(data)];
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(new Blob(content, {"type": "application/json"}));
            a.download = filename;
            a.click();    
        }
        catch (err)
        {
            console.log(err);
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not store deck" }));
        }
    }
};

document.body.addEventListener("meccg-saveas-deck", SaveJsonAsDialog.onSaveDeck, false);
document.body.addEventListener("meccg-saveas-file", SaveJsonAsDialog.onSaveFile, false);
