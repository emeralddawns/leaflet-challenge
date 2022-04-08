// Store our API endpoint as queryUrl.
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";


// Perform a GET request to the query URL.
d3.json(queryUrl).then(function (data) {
  console.log(data.features);
  createMap(data.features);
});

//Set up limits for each group of depths
let depthLimits = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

//COLOR RETRIEVAL FUNCTION
function getColor(input) {
  //according to https://earthquake.usgs.gov/data/comcat/index.php#depth the typical depth values are [0, 1000] 

  let startColor = '#fafa6e';
  let endColor = '#2A4858';

  //chroma.js returns a list of hex colors
  let colorScale = chroma.scale([startColor, endColor]).mode('lch').colors(depthLimits.length + 1);
    for (let i = (depthLimits.length - 1); i >= 0; i--){
      if (input >= depthLimits[i]) {
        var color = colorScale[i];
        break;
      } else if (input < depthLimits[i]){
        var color = colorScale[i];
        // break;
      }
    };
    return color;
  };

function chooseData() {
  var input = document.getElementById('userInput');
  var timeSpan = parseInt(input.value);

  if(timeSpan == 7) {
    alert('YOU ARE UNDER 20');
  }
}

// MAKE THE MAP
function createMap(earthquakes) {
  let quakeMarkers = [];

  // Loop through locations, and create the markers and the pop-ups.
  for (let i in earthquakes) {

    //GEOJSON coordinates are backwards
    quakeMarkers.push(
      L.circle([earthquakes[i].geometry.coordinates[1], earthquakes[i].geometry.coordinates[0]], {
        stroke: true,
        weight: .5,
        fillOpacity: 1,
        color: "gray",
        fillColor: getColor(earthquakes[i].geometry.coordinates[2]),
        radius: earthquakes[i].properties.mag * 20000
      }).bindPopup(`<h2>${earthquakes[i].properties.place}: Magnitude ${earthquakes[i].properties.mag}, Depth: ${earthquakes[i].geometry.coordinates[2]}</h2>`)
    );
  }
  
  let quakeLayer = L.layerGroup(quakeMarkers);

  // Create the base layers.

  //Street Map base layer
  var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  //Top Map base layer
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
    Earthquakes: quakeLayer,
  };

  // Create a new map and add the earthquake data to the layers.
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    layers: [street, quakeLayer]
  });

  //LEGEND
  let legend = L.control({position: 'bottomright'});

  legend.onAdd = function() {
    const div = L.DomUtil.create("div", "info legend");
    const labels = [];

    //Create legend title and min, max labels
    div.innerHTML = `<h1>Earthquake Depth (km)</h1>` +  //title
      `<div class=\"labels\"><div class=\"min\"> >${depthLimits[0]}</div>` + //min
      `<div class=\"max\">${depthLimits[depthLimits.length - 1]}</div>` + //max
      `</div>`;

    //Get sequence of colors for legend  
    depthLimits.forEach(function(depthLimit, index) {
      labels.push(`<li style=\"background-color: ${getColor(depthLimit)}\"></li>`);
    });
    div.innerHTML += "<ul>" + labels.join("") + "</ul>";

    return div;
  };
  legend.addTo(myMap);

  // Create a layer control that contains our baseMaps.
  // Be sure to add an overlay Layer that contains the earthquake GeoJSON.
  L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(myMap);
  //collapsed refers to the top right "pick layers" interface
}