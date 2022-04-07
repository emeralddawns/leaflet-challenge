// import chroma from "chroma-js";

// Store our API endpoint as queryUrl.
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";


// Perform a GET request to the query URL.
d3.json(queryUrl).then(function (data) {
  console.log(data.features);
  createMap(data.features);
});



function getColor(input, index) {
  //according to https://earthquake.usgs.gov/data/comcat/index.php#depth the typical depth values are [0, 1000] 
  let depthLimits = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

  //from https://leafletjs.com/SlavaUkraini/examples/choropleth/ - may need to remove sections of the link once the Russians are expelled from Ukraine

  //chroma.js returns a list of hex colors
  let colorScale = chroma.scale(['#fafa6e','#2A4858']).mode('lch').colors(depthLimits.length);
  console.log(colorScale)
    for (km in depthLimits){
      if (input < km) {
        color = colorScale[5];
      }
    };
    return color;

    // return depth > 600 ? '#800026' :
    //         depth > 500  ? '#BD0026' :
    //         depth > 400  ? '#E31A1C' :
    //         depth > 300  ? '#FC4E2A' :
    //         depth > 200   ? '#FD8D3C' :
    //         depth > 100   ? '#FEB24C' :
    //         depth > 0   ? '#FED976' :
    //                   '#FFEDA0';
};


function chooseData() {
  var input = document.getElementById('userInput');
  var timeSpan = parseInt(input.value);

  if(timeSpan == 7) {
    alert('YOU ARE UNDER 20');
  }
}

// let minDepth = 0;
// let maxDepth = 0;


function createMap(earthquakes) {
  let quakeMarkers = [];

  // Loop through locations, and create the city and state markers.
  for (let i in earthquakes) {

    // if (earthquakes[i].geometry.coordinates[2] < minDepth){
    //   minDepth = earthquakes[i].geometry.coordinates[2]
    // } else if (earthquakes[i].geometry.coordinates[2] > maxDepth) {
    //   maxDepth = earthquakes[i].geometry.coordinates[2]
    // };

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
      }).bindPopup(`<h2>${earthquakes[i].properties.place}: Magnitude ${earthquakes[i].properties.mag}, Depth: ${earthquakes[i].geometry.coordinates[2]}</h2>`)
    );
  }
  // console.log(quakeMarkers);

  // console.log(` Min Depth: ${minDepth}`)
  // console.log(` Max Depth: ${maxDepth}`)
  





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
    Earthquakes: quakeLayer,
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

  let legend = L.control({position: 'bottomright'});

  legend.onAdd = function() {
    const div = L.DomUtil.create("div", "info legend");
    const grades = [0, 100, 200, 300, 400, 500, 600];
    const labels = [];

    //Create legend title and min, max labels
    div.innerHTML = `<h1>Earthquake Depth (km)</h1>` +  //title
      `<div class=\"labels\"><div class=\"min\">${grades[0]}</div>` + //min
      `<div class=\"max\">${grades[grades.length - 1]}</div>` + //max
      `</div>`;

    //Get sequence of colors for legend  
    grades.forEach(function(grade, index) {
      labels.push(`<li style=\"background-color: ${getColor(grade)}\"></li>`);
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