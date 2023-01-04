const staticDevCoffee = "sit down and play meccg"
const assets = [
  "/media/assets/favicon.png",
  "/data/decks",
  "/data/list/cards",
  "/data/list/images",
  "/data/list/underdeeps",
  "/data/list/sites",
  "/data/list/map"
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticDevCoffee).then(cache => {
      cache.addAll(assets)
    })
  )
})


self.addEventListener("fetch", fetchEvent => 
{
  fetchEvent.respondWith(caches.match(fetchEvent.request).then(res => 
    {
      return res || fetch(fetchEvent.request)
    })
  )
})