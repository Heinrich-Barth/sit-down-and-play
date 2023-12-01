const registerServiceWorker = async () => 
{
    try 
    {
        if ("serviceWorker" in navigator) 
        {
           const registration = await navigator.serviceWorker.register("/serviceWorker.js", { scope: "/" });
            if (registration.installing) 
                console.info("Service worker installing");
            else if (registration.waiting) 
                console.info("Service worker installed");
            else if (registration.active)
                console.info("Service worker active");
        }
    }
    catch (error) 
    {
        console.error(`Registration failed with ${error}`);
    }     
};

registerServiceWorker();