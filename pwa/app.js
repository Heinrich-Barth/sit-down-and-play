
if ("serviceWorker" in navigator) 
{
    window.addEventListener("load", function() 
    {
        navigator.serviceWorker
            .register("/pwa/serviceWorker.js")
            .then(res => console.log("service worker registered"))
            .catch(err => console.error(err))
    });
}