/**
 * This code is heavily influenced by 
 * https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
 */

const CACHE_NAME = "v3";

/**
 * List of urls to cache
 */
const assets = [
  "/media/assets/backgrounds/home.webp"
]

/**
 * Check if given request path is to be cached at all
 * @param {String} url 
 * @returns success state
 */
const cacheRequestPath = function(url)
{
  return assets.includes(url) || url.startsWith("/data/images") || url.startsWith("/media/maps");
}

/**
 * Check if given event is to be cached (and do so) or not
 * @param {Object} event 
 * @returns success state
 */
const cacheRequest = function(event)
{
  if (!event.request.url.startsWith(self.location.origin))
    return false;
  else
    return cacheRequestPath(event.request.url.substring(self.location.origin.length));
}

/**
 * Cache request
 * @param {Object} request 
 * @param {Object} response 
 */
const putInCache = async (request, response) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
};

/**
 * Try to obtain object from cache first. If it does not exist, fetch and cache it
 * @param {Objects} param0 
 * @returns Response
 */
const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => 
{  
  /* Check cache first */
  const responseFromCache = await caches.match(request);
  if (responseFromCache) 
    return responseFromCache;
  

  /* Try to use and cache the preloaded response, if it's there */
  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) 
  {
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }

  /* Try to fetch the element */
  try {
    const responseFromNetwork = await fetch(request.clone(), {mode: 'cors'});

    /* response may be used only once we need to save clone to put one copy in cache and serve second one*/
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } 
  catch (error) 
  {
    console.warn(error.message);
  }

  /* Fetch impossible. Use fallback  */
  const fallbackResponse = await caches.match(fallbackUrl);
  if (fallbackResponse) 
    return fallbackResponse;

  /* generic error. we cannot do anything */
  return new Response("Network error happened", {
    status: 408,
    headers: { "Content-Type": "text/plain" },
  });
};

/**
 * Fetch Handler
 * @param {Event} event 
 */
const fetchListener = function(event) 
{
  if (cacheRequest(event)) 
  {
    event.respondWith(
      cacheFirst({
        request: event.request,
        preloadResponsePromise: event.preloadResponse,
        fallbackUrl: "/data/card-not-found-generic",
      })
    );
  }
}

/**
 * Register listeners
 */
self.addEventListener("install", installEvent => installEvent.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets))));
self.addEventListener("fetch", fetchListener);
