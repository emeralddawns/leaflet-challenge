// Store our API endpoint as queryUrl.
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";


// Perform a GET request to the query URL.
d3.json(queryUrl).then(function (data) {
  console.log(data.features);
  createMap(data.features);
});

//from https://leafletjs.com/SlavaUkraini/examples/choropleth/ - may need to remove sections of the link once the Russians are expelled from Ukraine
function getColor(depth) {
    return depth > 100 ? '#800026' :
            depth > 75  ? '#BD0026' :
            depth > 50  ? '#E31A1C' :
            depth > 25  ? '#FC4E2A' :
            depth > 0   ? '#FD8D3C' :
            depth > -25   ? '#FEB24C' :
            depth > -50   ? '#FED976' :
                      '#FFEDA0';
}


function createMap(earthquakes) {
  let quakeMarkers = [];

  // Loop through locations, and create the city and state markers.
  for (var i = 0; i < earthquakes.length; i++) {

    console.log(earthquakes[i].geometry.coordinates[1])
    // Set the marker radius for the state by passing the population to the markerSize() function.
    //GEOJSON coordinates might be backwards
    quakeMarkers.push(
      L.circle([earthquakes[i].geometry.coordinates[1], earthquakes[i].geometry.coordinates[0]], {
        stroke: true,
        weight: .5,
        fillOpacity: 0.75,
        color: "gray",
        // scale: ['white', 'green'],
        // steps: 20,
        fillColor: getColor(earthquakes[i].geometry.coordinates[2]),
        radius: earthquakes[i].properties.mag * 20000 //(earthquakes[i].state.population)
      }).bindPopup(`<h2>${earthquakes[i].properties.place}: ${earthquakes[i].properties.mag}</h2>`)
    );
  }
  console.log(quakeMarkers);

  let quakeLayer = L.layerGroup(quakeMarkers);
  // Create the base layers.
  var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Create a baseMaps object.
  var baseMaps = {
    "Street Map": street,
    "Topographic Map": topo
  };

  // Creat an overlays object.

  var overlayMaps = {
    quakes: quakeLayer,
  };
  // Create a new map.
  // Edit the code to add the earthquake data to the layers.
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    layers: [street, quakeLayer]
  });

  // Create a layer control that contains our baseMaps.
  // Be sure to add an overlay Layer that contains the earthquake GeoJSON.
  L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(myMap);
  //collapsed refers to the top right "pick layers" interface
}