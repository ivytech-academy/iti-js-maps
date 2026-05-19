const esriConfig = await $arcgis.import("@arcgis/core/config.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");
const Query = await $arcgis.import("@arcgis/core/rest/support/Query.js");

const SimpleLineSymbol = await $arcgis.import("@arcgis/core/symbols/SimpleLineSymbol.js");
const SimpleRenderer = await $arcgis.import("@arcgis/core/renderers/SimpleRenderer.js");
const UniqueValueRenderer = await $arcgis.import("@arcgis/core/renderers/UniqueValueRenderer.js");

const Graphic = await $arcgis.import("@arcgis/core/Graphic.js");
const SimpleMarkerSymbol = await $arcgis.import("@arcgis/core/symbols/SimpleMarkerSymbol.js");
const FeatureFilter = await $arcgis.import("@arcgis/core/layers/support/FeatureFilter.js");

const distanceOperator = await $arcgis.import("@arcgis/core/geometry/operators/distanceOperator.js");
//const { execute, supportsCurves } = await $arcgis.import("@arcgis/core/geometry/operators/distanceOperator.js");

import {
  API_KEY,
  ROUTES_URL,
  STOPS_URL
} from "./config.js";


console.log("API Key", API_KEY);
esriConfig.apiKey = API_KEY;
let highlightHandle = null;

const outputElem = document.getElementById("output");

const viewElement = document.querySelector("arcgis-map");
await viewElement.componentOnReady();

console.log("MapView is ready!");

//Load layers
const map = viewElement.map;

const stopsRenderer = new SimpleRenderer({
  symbol: new SimpleMarkerSymbol({
    color: "#0000FF",
    size: 10,
    outline: new SimpleLineSymbol({
      width: 2,
      color: "#3c3c3c"
    })
  })
});

const metroStopsLayer = new FeatureLayer({
  url: STOPS_URL,
  title: "Metro Stations",
  outFields: ["*"],
  renderer: stopsRenderer,
  popupTemplate: {
    title: "{Name}",
    content: `
      Type: {StationLev}<br>
      Route ID: {LineNumber}<br>      `
  }
});

//Routes Layer
const routeRenderer = new UniqueValueRenderer({
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
    title: "{Route_Name}",
    content: `
        Type: {Type}<br>
        Frequency: {Frequency}<br>
        Status: {Status}
      `
  },
});

document.getElementById("routeNumberFilter")
  .addEventListener("calciteSelectChange", (event) => {

    const selectedType = event.target.value;
    metroStopsLayer.definitionExpression =
      selectedType === "All"
        ? "1=1"
        : `LineNumber=${selectedType}`;

    output.innerHTML = `Showing Stations for Route: ${selectedType}`;
  });

//TODO001: Add Graphics layer module
const GraphicsLayer = await $arcgis.import("@arcgis/core/layers/GraphicsLayer.js");

//TODO002 Create Graphics layer and add it to the map
const graphicsLayer = new GraphicsLayer({
  title: "Analysis Graphics"
});

//Add layers to the map
map.addMany([routesLayer, metroStopsLayer, graphicsLayer]);

reactiveUtils.watch(
  () => [metroStopsLayer.loaded],
  async ([layerLoaded]) => {
    console.log(metroStopsLayer.fields);
    console.log("Stations layer loaded successfully.");
  },
);

//Get Reference to layer views
const routesLayerView = await viewElement.view.whenLayerView(routesLayer);
const metroStopsLayerView = await viewElement.view.whenLayerView(metroStopsLayer);

reactiveUtils.when(
  () => !metroStopsLayerView.updating,
  () => {
    console.log("Stops LayerView finished rendering.");
  }
);

// await reactiveUtils.whenOnce(
//   () => !routesLayerView.updating && !stopsLayerView.updating
// );


//Display stops inside current extent
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

outputElem.innerHTML = "Layers ready.";
const mapView = viewElement.view;

//TODO003 handle onClick event
mapView.on("click", async (event) => {

  graphicsLayer.removeAll();

  if (highlightHandle) {
    highlightHandle.remove();
    highlightHandle = null;
  }

  //TODO004 Apply hitTest
  const hitResponse = await mapView.hitTest(event);
  console.log(hitResponse);

  const routeResult = hitResponse.results.find(
    result => result.graphic.layer === routesLayer
  );

  const stopResult = hitResponse.results.find(
    result => result.graphic.layer === metroStopsLayer
  );

  //TODO005 handle stops 
  if (stopResult) {
    const stopGraphic = stopResult.graphic;

    highlightHandle = metroStopsLayerView.highlight(stopGraphic);

    output.innerHTML = `
          Stop: ${stopGraphic.attributes.Name}<br>
          Route: ${stopGraphic.attributes.LineNumber}<br>
          Type: ${stopGraphic.attributes.StationLev}
        `;

    return;
  }

  //TODO006 handle routes 
  if (routeResult) {

    const routeGraphic = routeResult.graphic;

    highlightHandle = routesLayerView.highlight(routeGraphic);

    output.innerHTML = `
          Route: ${routeGraphic.attributes.Name}<br>
          Length: ${routeGraphic.attributes.route_length_km} KM<br>
          Route Number: ${routeGraphic.attributes.MetroNumbe}
        `;

    return;
  }

  //TODO007 get nearest stops 
  const query = metroStopsLayer.createQuery();
  query.returnGeometry = true;
  query.outFields = ["*"];
  query.where = "1=1";

  const stopResults = await metroStopsLayer.queryFeatures(query);

  let nearestStop = null;
  let nearestDistance = Infinity;

  stopResults.features.forEach((feature) => {

    const distance = distanceOperator.execute(
      event.mapPoint,
      feature.geometry,
      "kilometers"
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestStop = feature;
    }
  });

  if (nearestStop) {

    /* Highlight */
    highlightHandle = metroStopsLayerView.highlight(nearestStop);

    /* User click point */
    const clickGraphic = new Graphic({
      geometry: event.mapPoint,
      symbol: {
        type: "simple-marker",
        color: "black",
        size: 8
      }
    });

    /* Connection line */
    const lineGraphic = new Graphic({
      geometry: {
        type: "polyline",
        paths: [
          [
            [event.mapPoint.longitude, event.mapPoint.latitude],
            [nearestStop.geometry.longitude, nearestStop.geometry.latitude]
          ]
        ]
      },
      symbol: {
        type: "simple-line",
        color: "#D62828",
        width: 2,
        style: "dash"
      }
    });

    graphicsLayer.addMany([
      clickGraphic,
      lineGraphic
    ]);

    output.innerHTML = `
          Nearest Stop: ${nearestStop.attributes.Name}<br>
          Distance: ${nearestDistance.toFixed(2)} KM<br>
          Type: ${nearestStop.attributes.StationLev}
        `;
  }
});
