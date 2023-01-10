const registerServiceWorker = async () => 
{
    try 
    {
        if ("serviceWorker" in navigator) 
        {
           const registration = await navigator.serviceWorker.register("/serviceWorker.js", { scope: "/" });
            if (registration.installing) 
                console.log("Service worker installing");
            else if (registration.waiting) 
                console.log("Service worker installed");
            else if (registration.active)
                console.log("Service worker active");
        }
    }
    catch (error) 
    {
        console.error(`Registration failed with ${error}`);
    }     
};

registerServiceWorker();