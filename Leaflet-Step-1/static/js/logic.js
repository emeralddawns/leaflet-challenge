// Store our API endpoint as queryUrl.
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";

// Perform a GET request to the query URL.
d3.json(queryUrl).then(function (data) {
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
    for (let i = 0; i < depthLimits.length; i++){
      if (input < depthLimits[i]) {
        var color = colorScale[i];
        break;
      } else if (input <= depthLimits[i]){
        var color = colorScale[i];
        break;
      }
    };
    return color;
  };


// MAKE THE MAP
function createMap(earthquakes) {
  let quakeMarkers = [];

  // Loop through locations, and create the markers and the pop-ups.
  for (let i in earthquakes) {

    //Make quakemarker layer - GEOJSON coordinates are backwards
    quakeMarkers.push(
      L.circle([earthquakes[i].geometry.coordinates[1], earthquakes[i].geometry.coordinates[0]], {
        stroke: true,
        weight: .5,
        fillOpacity: .75,
        color: "gray",
        fillColor: getColor(earthquakes[i].geometry.coordinates[2]),
        radius: earthquakes[i].properties.mag * 20000
      }).bindPopup(`<h2>${earthquakes[i].properties.place}: Magnitude ${earthquakes[i].properties.mag}, Depth: ${earthquakes[i].geometry.coordinates[2]}</h2>`)
    );
  };
    let quakeLayer = L.layerGroup(quakeMarkers);

  //TECTONIC LAYER    
  //tectonicLayer has to be created before the function that adds the data so that the variable can be read globally
  let tectonicLayer = new L.LayerGroup();
  
  // Getting our GeoJSON data to show the visible plates
  d3.json("static/data/PB2002_boundaries.json").then(data => {
    console.log(data);
    
    // Adding the retrieved and formatted data to the GeoJSON layer
    L.geoJson(data, {
      style: (feature) => {
        return {
          color: "#ff8b14",
          fillColor: "white",
          fillOpacity: 0,
          weight: 1.75
        };
      }
    }).addTo(tectonicLayer);
  }); 

  //Adding hovertext - must use enclosed polygons
  d3.json("static/data/PB2002_plates.json").then(data => {
    console.log(data);
    
    // Adding the retrieved and formatted data to the GeoJSON layer
    L.geoJson(data, {
      style: (feature) => {
        return {
          color: "#ff8b14",
          fillColor: "white",
          fillOpacity: 0,
          weight: 0
        };
      },
      onEachFeature: (feature, layer) => {
        layer.on({
            'add': function(){
                layer.bringToBack()
            },
            click: (event) => {
                myMap.fitBounds(event.target.getBounds());
            },
            mouseover: (event) => {
                event.target.setStyle({color: "#99000d", weight: .5})
            },
            mouseout: (event) => {
                event.target.setStyle({color: "#ff8b14", weight: 0})
            }
        })
        layer.bindPopup( `<h3>Plate Name: ${feature.properties.PlateName}</h3>`);
      }
    }).addTo(tectonicLayer);
  }); 

  // Create the base layers.

  //Street Map base layer
  var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      // noWrap: true
  });

  var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
  });

  var googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
  });

  var googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
  });

  //Top Map base layer
  var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Create a baseMaps object.
  var baseMaps = {
    "Street Map": street,
    "Satellite (from Google)": googleSat,
    "Satellite with Borders": googleHybrid, 
    "Terrain (from Google)": googleTerrain,
    "Topographic Map": topo, 
  };

  // Creat an overlays object.
  var overlayMaps = {
    "Earthquakes": quakeLayer,
    "Tectonic Plates": tectonicLayer,
  };

  // Create a default "landing" map 
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
    div.innerHTML = `<h3>Earthquake Depth (km)</h3>` +  //title
      `<div class=\"labels\"><div class=\"min\">${depthLimits[0]} or less</div>` + //min
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

  // Create a layer control (top right) that contains our baseMaps and overlayMaps.
  L.control.layers(baseMaps, overlayMaps, {collapsed: true}).addTo(myMap);
  // controlLayers.addOverlay(tectonicLayer, "Tectonic Plates");
}