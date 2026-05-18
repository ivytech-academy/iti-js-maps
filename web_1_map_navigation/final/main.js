//TODO001: Import required modules
const Extent = await $arcgis.import("@arcgis/core/geometry/Extent.js");
const Viewpoint = await $arcgis.import("@arcgis/core/Viewpoint.js");
const Point = await $arcgis.import("@arcgis/core/geometry/Point.js");
const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");

//TODO002: Get reference to map component and wait till it's ready
const mapElement = document.querySelector("arcgis-map");
await mapElement.componentOnReady();

//TODO003: Get reference to MapView
const view = mapElement.view;


//TODO004: Apply logic for streetsBtn to change basemap to "streets-navigation-vector"
document.getElementById("streetsBtn").addEventListener("click", () => {
    mapElement.map = new Map({
        basemap: "streets-navigation-vector"
    });
});

//TODO005: Apply logic for satelliteBtn to change basemap to "satellite"
document.getElementById("satelliteBtn").addEventListener("click", () => {
    mapElement.map = new Map({
        basemap: "satellite"
    });
});

//TODO006: Apply logic for topoBtn to change basemap to "satellite"
document.getElementById("topoBtn").addEventListener("click", () => {
    mapElement.map = new Map({
        basemap: "topo-vector"
    });
});

//TODO007: Apply logic for cairoBtn to CENTER and ZOOM to Cairo  (center= [31.2357, 30.0444], zoom=11)
document.getElementById("cairoBtn").addEventListener("click", () => {
    view.goTo({
        center: [31.2357, 30.0444],
        zoom: 11
    });
});

//TODO008: Apply logic for alexBtn to CENTER and ZOOM to ALEX  (center= [29.9187, 31.2001], zoom=12)
document.getElementById("alexBtn").addEventListener("click", () => {
    view.goTo({
        center: [29.9187, 31.2001],
        zoom: 12
    });
});

//TODO009: Apply logic for extentBtn to set MapView extent to Egypt
document.getElementById("extentBtn").addEventListener("click", () => {

    const egyptExtent = new Extent({
        xmin: 24.7,
        ymin: 22.0,
        xmax: 36.9,
        ymax: 31.8,
        spatialReference: {
            wkid: 4326
        }
    });

    view.extent = egyptExtent;
});

//TODO010: Apply logic for scaleBtn to set MapView scale to 50000
document.getElementById("scaleBtn").addEventListener("click", () => {
    view.scale = 50000;
});

//TODO011: Apply logic for rotateBtn to set center to Cairo and rotate by 45 degree
document.getElementById("rotateBtn").addEventListener("click", () => {

    const cairoPoint = new Point({
        longitude: 31.2357,
        latitude: 30.0444
    });

    view.viewpoint = new Viewpoint({
        targetGeometry: cairoPoint,
        scale: 75000,
        rotation: 45
    });
});

//TODO011: Apply logic for rotateBtn to set REACTIVE WATCHES for Zoom, scale and center
reactiveUtils.watch(
    () => view.zoom,
    (zoom) => {
        console.log("Zoom:", zoom);
    }
);

reactiveUtils.watch(
    () => view.scale,
    (scale) => {
        console.log("Scale:", scale);
    }
);

reactiveUtils.watch(
    () => view.center,
    (center) => {
        console.log("Center:", center.latitude, center.longitude);
    }
);
