const esriConfig = await $arcgis.import("@arcgis/core/config.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");
const SimpleLineSymbol = await $arcgis.import("@arcgis/core/symbols/SimpleLineSymbol.js");
const SimpleMarkerSymbol = await $arcgis.import("@arcgis/core/symbols/SimpleMarkerSymbol.js");
const SimpleRenderer = await $arcgis.import("@arcgis/core/renderers/SimpleRenderer.js");
const UniqueValueRenderer = await $arcgis.import("@arcgis/core/renderers/UniqueValueRenderer.js");
const Graphic = await $arcgis.import("@arcgis/core/Graphic.js");

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

routeRenderer.visualVariables = [
  {
    type: "size",
    field: "route_length_km",
    stops: [
      {
        value: 24,
        size: 4,
        label: "Short Route"
      },
      {
        value: 48,
        size: 7,
        label: "Medium Route"
      },
      {
        value: 52,
        size: 9,
        label: "Major Corridor"
      }
    ],

    legendOptions: {
      title: "Route Length (KM)"
    }
  }
];

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

//Get reference to Search component and Info cards
const stationInfo = document.querySelector("#stationInfoNotice");
const stationInfoContent = document.querySelector("#stationsInfoContent");
const searchComp = document.querySelector("arcgis-search")
await searchComp.componentOnReady();

reactiveUtils.watch(
  () => [metroStopsLayer.loaded],
  async ([layerLoaded]) => {
    console.log(metroStopsLayer.fields)
    console.log("Stations layer loaded successfully.");

    //TODO003: Set Metro Stations as Search Source
    
    const searchSources = {
      layer: metroStopsLayer,
      placeholder: "Write to find a station",
      maxResults: 5,
      searchFields: ["Name"],
      displayField: "Name",
      name: "In Metro Stations"
    };
    searchComp.sources.push(searchSources);
  }
);

searchComp.addEventListener("arcgisSearchClear", () => {
  //TODO004: Clear search result
  console.log("Search cleared");
  stationInfo.open = false;
  stationInfoContent.innerHTML = "";
  viewElement.view.graphics.removeAll();
});


searchComp.addEventListener("arcgisSelectResult", (event) => {
  //TODO005: Change Graphic of search result
  viewElement.view.graphics.removeAll();
  const { result } = event.detail;
  if (result?.feature) {
    stationInfo.open = true;
    stationInfoContent.innerHTML = result.name;
    console.log("User selected:", result.name);

    // Access geometry
    const geometry = result.feature.geometry;
    const graphic = new Graphic({
      geometry: geometry,
      symbol: new SimpleMarkerSymbol({
        size: 12,
        color: "#2bd518"
      })
    });
    viewElement.view.graphics.push(graphic);

  }
});



reactiveUtils.on(
  () => viewElement.view.popup,
  "trigger-action",
  (event) => {
    if (event.action.id === "action_total_stops") {
      console.log("Get Total Stops for this route");
    }
  }
);