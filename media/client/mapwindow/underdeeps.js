
const map = L.map('map', 
{
    minZoom: 3,
    maxZoom: 6,
    dragging: true
});

L.tileLayer('/media/maps/underdeeps/{z}/tile_{x}_{y}.jpg').addTo(map);
map.setView(L.latLng(66, -90.800), 4);

