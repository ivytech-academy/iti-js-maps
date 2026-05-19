const esriConfig = await $arcgis.import("@arcgis/core/config.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");

//TODO001: Import SimpleLineSymbol and SimpleRenderer modules


//TODO005: Import UniqueValueRenderer module


import {
    API_KEY,
    ROUTES_URL,
    STOPS_URL
} from "./config.js";


esriConfig.apiKey = API_KEY;

const viewElement = document.querySelector("arcgis-map");
await viewElement.componentOnReady();


//Add Layers
const map = viewElement.map;
const metroStopsLayer = new FeatureLayer({
    url: STOPS_URL,
    title: "Metro Stations",
    outFields: ["*"]
    
});

//TODO002: Create Simple renderer


//TODO004 Create visual variables and assign it to the renderer


const routesLayer = new FeatureLayer({
  url: ROUTES_URL,
  title: "Transit Routes",
  outFields: ["*"],
  //TODO003: set renderer property to the defined renerer  
  
});

map.addMany([routesLayer, metroStopsLayer]);


//TODO006: Apply Data-Driven Visualization


//TODO007: Apply Scale-Dependent Visualization
