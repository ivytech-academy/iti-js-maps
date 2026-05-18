const esriConfig = await $arcgis.import("@arcgis/core/config.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");
const SimpleLineSymbol = await $arcgis.import("@arcgis/core/symbols/SimpleLineSymbol.js");
const SimpleMarkerSymbol = await $arcgis.import("@arcgis/core/symbols/SimpleMarkerSymbol.js");
const SimpleRenderer = await $arcgis.import("@arcgis/core/renderers/SimpleRenderer.js");
const UniqueValueRenderer = await $arcgis.import("@arcgis/core/renderers/UniqueValueRenderer.js");

//TODO001: Import required modules
const Query = await $arcgis.import("@arcgis/core/rest/support/Query.js");
const FeatureFilter = await $arcgis.import("@arcgis/core/layers/support/FeatureFilter.js");


import {
  API_KEY,
  ROUTES_URL,
  STOPS_URL
} from "./config.js";


esriConfig.apiKey = API_KEY;

const outputElem = document.getElementById("output");

const viewElement = document.querySelector("arcgis-map");
await viewElement.componentOnReady();


//Add Layers
const map = viewElement.map;

const stopsRenderer = new SimpleRenderer({
  symbol: new SimpleMarkerSymbol({
    color: "#0000FF",
    size: 10,
    outline: new SimpleLineSymbol({
      width: 2,
      color: "#fff"
    })
  })
});

const metroStopsLayer = new FeatureLayer({
  url: STOPS_URL,
  title: "Metro Stations",
  outFields: ["*"],
  renderer: stopsRenderer,
  popupTemplate: {
    title: "Transit Station: {Name}",
    content: `
          <b>Name:</b> {Name}<br>
          <b>Route ID:</b> {LineNumber}<br>
          <b>Level:</b> {StationLev}
        `,
  }
});

let routeRenderer = new UniqueValueRenderer({
  field: "MetroNumbe",
  uniqueValueInfos: [
    {
      value: 1,
      symbol: {
        type: "simple-line",
        color: "#D62828",
        width: 5
      },
      label: "First Line"
    },
    {
      value: 2,
      symbol: {
        type: "simple-line",
        color: "#005B99",
        width: 5
      },
      label: "Second Line"
    },
    {
      value: 3,
      symbol: {
        type: "simple-line",
        color: "#2A9D8F",
        width: 5
      },
      label: "Third Line"
    }
  ]
});


const routesLayer = new FeatureLayer({
  url: ROUTES_URL,
  title: "Transit Routes",
  outFields: ["*"],
  renderer: routeRenderer,
  popupTemplate: {
    title: "Transit Route: {Name}",
    content: `
          <b>Name:</b> {Name}<br>
          <b>Route ID:</b> {MetroNumbe}<br>
          <b>Length:</b> {route_length_km} KM
        `,
    actions: [
      {
        id: "action_total_stops",
        title: "Find Total Stops"
      }
    ]
  }
});

map.addMany([routesLayer, metroStopsLayer]);


reactiveUtils.on(
  () => viewElement.view.popup,
  "trigger-action",
  (event) => {
    if (event.action.id === "action_total_stops") {
      console.log("Get Total Stops for this route");
    }
  }
);

//TODO002: Get Reference to layer views
const routesLayerView = await viewElement.view.whenLayerView(routesLayer);
const stopsLayerView = await viewElement.view.whenLayerView(metroStopsLayer);

await reactiveUtils.whenOnce(
  () => !routesLayerView.updating && !stopsLayerView.updating
);

outputElem.innerHTML = "Layers ready.";



document.getElementById("routeNumberFilter")
  .addEventListener("calciteSelectChange", (event) => {

    //TODO003: Add logic to routeNumberFilter-selection change to Apply definition expression to metro strops layer
    const selectedType = event.target.value;
    metroStopsLayer.definitionExpression =
      selectedType === "All"
        ? "1=1"
        : `LineNumber=${selectedType}`;

    output.innerHTML = `Showing Stations for Route: ${selectedType}`;
  });


document.getElementById("undergroundStopsBtn")
  .addEventListener("click", () => {

    //TODO004: Filter stops LAYER-VIEW to display only UNDERGROUND stations

    stopsLayerView.filter = new FeatureFilter({
      where: "StationLev = 'نفقية'"
    });

    output.innerHTML = "Showing accessible stops only.";
  });


document.getElementById("countAboveGroundStopsBtn")
  .addEventListener("click", async () => {

    //TODO005: Query count of AboveGround Metro Stations features
    const query = metroStopsLayer.createQuery();
    query.where = "StationLev = 'علوية'";

    const count = await metroStopsLayer.queryFeatureCount(query);

    output.innerHTML = `Above Ground Stops: ${count}`;
  });

document.getElementById("visibleStopsBtn")
  .addEventListener("click", async () => {

    //TODO006: Query count of stops by current map view extent
    const query = metroStopsLayer.createQuery();
    query.geometry = viewElement.view.extent;
    query.spatialRelationship = "intersects";

    const count = await metroStopsLayer.queryFeatureCount(query);

    output.innerHTML = `Stops in current extent: ${count}`;
  });

const stationInfoContent = document.querySelector("#stationsCount");
reactiveUtils.watch(
  () => viewElement.view.stationary,
  async (isStationary) => {

    if (!isStationary) return;

    //TODO007: Reactive watch for stops count by current map view extent
    const query = metroStopsLayer.createQuery();
    query.geometry = viewElement.view.extent;

    const count = await metroStopsLayer.queryFeatureCount(query);

    stationInfoContent.innerHTML = `${count} Station`;
  }
);