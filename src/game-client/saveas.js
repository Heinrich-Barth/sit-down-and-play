const SaveJsonAsDialog = {

    onSaveFile : function(e)
    {
        SaveJsonAsDialog.onSave(e.detail.data, e.detail.name + ".meccg-savegame");
    },

    onSaveDeck : function(e)
    {
        SaveJsonAsDialog.onSave(e.detail.data, e.detail.name + ".meccg", false);
    },

    onSave : function(data, filename, toJson)
    {
        if (!data)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "No data provided to store." }));
            return;
        }          

        try
        {
            let content = data;
            let type = "text/plain"
            if (toJson === undefined || toJson)
            {
                content = JSON.stringify(data);
                type = "application/json";
            }
            
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(new Blob([content], {"type": type}));
            a.download = filename;
            a.click();    
        }
        catch (err)
        {
            console.error(err);
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not store deck" }));
        }
    },

    onSaveSessionToFile: function()
    {
        try
        {
            const content = sessionStorage.getItem("meccg_" + g_sRoom);
            if (content === null)
                return;
                       
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(new Blob([content], {"type": "application/json"}));
            a.download = g_sRoom + "-autosave.meccg-savegame";
            a.click();    
        }
        catch (err)
        {
            console.error(err);
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not store deck" }));
        }
    },

    onSaveSession: function(data)
    {
        sessionStorage.setItem("meccg_" + g_sRoom, JSON.stringify(data.detail.data));
    }
};

document.body.addEventListener("meccg-saveas-deck", SaveJsonAsDialog.onSaveDeck, false);
document.body.addEventListener("meccg-saveas-file", SaveJsonAsDialog.onSaveFile, false);
document.body.addEventListener("meccg-saveas-file-autosave", SaveJsonAsDialog.onSaveSessionToFile, false);
document.body.addEventListener("meccg-saveas-autosave", SaveJsonAsDialog.onSaveSession, false);
