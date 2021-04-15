
const Notify = {
  
    count : 0,
    
    init : function()
    {
        jQuery(document).ready(function()
        {
            jQuery("body").append('<div id="notifications"></div>');
        });
    },
    
    error : function(content)
    {
        this.msg(content, "failure", 3000);
    },
    
    success : function(content)
    {
        this.msg(content, "success", 1000);
    },
    
    msg : function(content, sClass, _time)
    {
        var id = "notify_" + this.count;
        this.count++;
        if (this.count === 10)
            this.count = 0;
        
        var sHtml = '<div class="' + sClass + ' notify" id="' + id + '">' + content + "</div>";
        jQuery("#notifications").append(sHtml);

        setTimeout(function()
        {
            jQuery("#notifications #" + id).remove();
        },_time);
    }
    
};

const MeccgApi =
{
    _routes : {},
    _socket : null,
    ipc : null,
    
    init : function(ipcRenderer)
    {
        this.ipc = ipcRenderer;
    },
    getHash : function(input)
    {
        return this.send("/get/hash", input).result;;
    },
    send : function(path, message)
    {
        if (typeof message === "undefined")
            message = "";
        
        try
        {
            return this.ipc.sendSync(path, message);
        }
        catch(error)
        {
            console.log(error);
        }
    },
    
    addListener : function(path, callbackFunction)
    {
        console.log("Add listener " + path);
        this.ipc.on(path, (event, ...args) => {
            callbackFunction(event, args);
        });
    }
};

MeccgApi.init(window.ipcRenderer);
MeccgApi.addListener("message-success", function(evt, args)
{
    if (args !== "")
        Notify.success(args);
});

MeccgApi.addListener("message-error", function(evt, args)
{
    if (args !== "")
        Notify.error(args);
});

Notify.init();
