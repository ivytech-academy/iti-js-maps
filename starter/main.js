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

const GraphicsLayer = await $arcgis.import("@arcgis/core/layers/GraphicsLayer.js");
const distanceOperator = await $arcgis.import("@arcgis/core/geometry/operators/distanceOperator.js");
const PortalItem = await $arcgis.import("@arcgis/core/portal/PortalItem.js");
const Portal = await $arcgis.import("@arcgis/core/portal/Portal.js");

import {
  API_KEY,
  ROUTES_URL,
  STOPS_URL
} from "./config.js";


console.log("API Key", API_KEY);
esriConfig.apiKey = API_KEY;
let highlightHandle = null;

let reportingMode = false;

const output = document.getElementById("output");
const incidentTypeSelect = document.getElementById("incidentType");
const descriptionInput = document.getElementById("incidentDescription");
const startReportingBtn = document.getElementById("startReportingBtn");
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


//TODO001: Add graphics layer for incidents
const incidentsLayer = new GraphicsLayer({
  title: "Transit Incidents"
});

map.add(incidentsLayer);

output.innerHTML = "Incident layer ready.";

//Add layers to the map
map.addMany([routesLayer, metroStopsLayer, incidentsLayer]);

reactiveUtils.watch(
  () => [metroStopsLayer.loaded],
  async ([layerLoaded]) => {
    console.log(metroStopsLayer.fields);
    console.log("Stations layer loaded successfully.");
  },
);

const metroStopsLayerView = await viewElement.view.whenLayerView(metroStopsLayer);
reactiveUtils.when(
  () => !metroStopsLayerView.updating,
  () => {
    console.log("Stops LayerView finished rendering.");
  }
);


//Get Reference to layer views
const routesLayerView = await viewElement.view.whenLayerView(routesLayer);
const stopsLayerView = await viewElement.view.whenLayerView(metroStopsLayer);

await reactiveUtils.whenOnce(
  () => !routesLayerView.updating && !stopsLayerView.updating
);

outputElem.innerHTML = "Layers ready.";
const mapView = viewElement.view;

//TODO002: Add incident (point) feature layers
const reportIncidentLayer = new FeatureLayer({
  id: "incident",
  portalItem: new PortalItem({
    id: "1f1c856eb7654c109e7ac46005d4a2fd",
    portal: new Portal({
      url: "https://ramighali.maps.arcgis.com/"
    })
  })
});

map.add(reportIncidentLayer);


//Add map click event
mapView.on("click", (event) => {

  if (!reportingMode) return;

  const incidentType = incidentTypeSelect.value;
  const description = descriptionInput.value || "No description provided.";

  //Set Incident Graphic Symbol logic
  let color;

  switch (incidentType) {
    case "Delay":
      color = "#D62828";
      break;

    case "Crowding":
      color = "#F4A261";
      break;

    case "Maintenance":
      color = "#005B99";
      break;

    default:
      color = "gray";
  }

  //TODO003: Add incident Graphic
  const incidentGraphic = new Graphic({
    geometry: event.mapPoint,

    symbol: {
      type: "simple-marker",
      style: "triangle",
      color,
      size: 14,
      outline: {
        color: "white",
        width: 1.5
      }
    },
    attributes: {
      "incident_type": incidentType,
      "incident_description": description,
      "reported_at": Date.now()
    },
    popupTemplate: {
      title: "{incident_type} Incident",
      content: `
            <b>Description:</b> {incident_description}<br>
            <b>Reported:</b> {reported_at}
          `
    }
  });

  incidentsLayer.add(incidentGraphic);

  output.innerHTML = `
        Incident Reported:<br>
        Type: ${incidentType}<br>
        Description: ${description}
      `;
});

//Watch for incidents count
reactiveUtils.watch(
  () => incidentsLayer.graphics.length,
  (count) => {
    console.log("Total incidents:", count);
  }
);


startReportingBtn.addEventListener("click", async () => {

  //TODO004: Save incidents to layer
  if (reportingMode && incidentsLayer.graphics.length > 0) {
    try {
      console.log(incidentsLayer.graphics.at(0).attributes);

      const result = await reportIncidentLayer.applyEdits({
        addFeatures: [incidentsLayer.graphics.at(0)]
      });


      if (
        result.addFeatureResults.length > 0 &&
        !result.addFeatureResults[0].error
      ) {
        const objectId = result.addFeatureResults[0].objectId;

        incidentsLayer.graphics.removeAll();
        incidentTypeSelect.value = "Delay";
        descriptionInput.value = "";

      } else {
        output.innerHTML =
          "Feature add failed.";
      }
    } catch (error) {
      console.error(error);
      output.innerHTML =
        "Error adding feature. Check service permissions.";
    }

  }
  reportingMode = !reportingMode;

  startReportingBtn.innerText = reportingMode
    ? "Save"
    : "Start Reporting Mode";

  output.innerHTML = reportingMode
    ? "Click map to place incident."
    : "Reporting mode disabled.";


});

