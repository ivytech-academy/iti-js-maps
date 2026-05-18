//TODO002: Import required modules
const esriConfig = await $arcgis.import("@arcgis/core/config.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");
const Query = await $arcgis.import("@arcgis/core/rest/support/Query.js");

//TODO003: Import our custom configurations from config.js 
import {
    API_KEY,
    ROUTES_URL,
    STOPS_URL
} from "./config.js";

//TODO004: Set API Ket
esriConfig.apiKey = API_KEY;


const viewElement = document.querySelector("arcgis-map");
await viewElement.componentOnReady();


//TODO005: Get reference to Map 
const map = viewElement.map;

//TODO006: Create and Add feature layer to the map
const metroStopsLayer = new FeatureLayer({
    url: STOPS_URL,
    title: "Metro Stations",
    outFields: ["*"],
    popupTemplate: {
        title: "{Name}",
        content: `
      Type: {StationLev}<br>
      Route ID: {LineNumber}<br>      `
    }
});

map.add(metroStopsLayer);

//TODO008: Wait for the layer to be loaded
//await reactiveUtils.whenOnce(() => metroStopsLayer.loaded)
reactiveUtils.watch(
    // Track scale, extent, and movement in the view.
    () => [metroStopsLayer.loaded],
    ([layerLoaded]) => {
        console.log(metroStopsLayer.fields)
        console.log("Stations layer loaded successfully.");

    },
);


//TODO009: Wait for the LAYER VIEW to be loaded
const metroStopsLayerView = await viewElement.view.whenLayerView(metroStopsLayer);

//TODO010: Create and add routes feature layer to the map

const routesLayer = new FeatureLayer({
    url: ROUTES_URL,
    title: "Transit Routes",
    outFields: ["*"],
    popupTemplate: {
        title: "{Name}",
        content: `
        Name: {Name}<br>
        Code: {MetroNumbe}<br>
      `
    }
});

map.add(routesLayer);