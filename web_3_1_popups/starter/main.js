const esriConfig = await $arcgis.import("@arcgis/core/config.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");
const SimpleLineSymbol = await $arcgis.import("@arcgis/core/symbols/SimpleLineSymbol.js");
const SimpleMarkerSymbol = await $arcgis.import("@arcgis/core/symbols/SimpleMarkerSymbol.js");
const SimpleRenderer = await $arcgis.import("@arcgis/core/renderers/SimpleRenderer.js");
const UniqueValueRenderer = await $arcgis.import("@arcgis/core/renderers/UniqueValueRenderer.js");

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
  //TODO001: Add popup template for Metro stations (Inspect field names)
  
});

let routeRenderer = new SimpleRenderer({
  symbol: new SimpleLineSymbol({
    color: "#801180",
    width: 4,
  })
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
  //TODO002: Add popup template with ACTIONS to get total stops for the selected route
  
});

map.addMany([routesLayer, metroStopsLayer]);

const applyAttSizeElem = document.querySelector("#applyColorRendererBtn")
applyAttSizeElem.addEventListener("click", () => {
  applyDataDrivenVisualization();
});

function applyDataDrivenVisualization() {
  const routeLengthRenderer = new UniqueValueRenderer({
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

  routesLayer.renderer = routeLengthRenderer;
}


const applyScaleDepSizeElem = document.querySelector("#applyScaleDepSizeBtn")
applyScaleDepSizeElem.addEventListener("click", () => {
  applyScaleDependentSize();
});
function applyScaleDependentSize() {

  const sizeVisualVariable = {
    type: "size",
    valueExpression: "$view.scale",
    stops: [
      { size: 2, value: 577790.5542885 },
      { size: 4, value: 288895.2771445 },
      { size: 6, value: 72223.819286 },
      { size: 12, value: 18055.9548215 }
    ]
  };
  routesLayer.renderer.visualVariables = [sizeVisualVariable];
}


//TODO003: Handle popup actions (listen to viewElement.view.popup event)
