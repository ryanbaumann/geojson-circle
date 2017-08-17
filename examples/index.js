'use strict';

const Circle = require('./Circle.js')
const turf_inside = require('@turf/inside');
const turf_helpers = require('@turf/helpers');
const turf_truncate = require('@turf/truncate');
const turf_distance = require('@turf/distance');
const accessToken = require('./token.json');

mapboxgl.accessToken = accessToken['token'];

var mapzoom = 12;

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    center: [-75.343, 39.984],
    zoom: mapzoom
});

// Circle Setup

var center = [-75.343, 39.984];
var radius = 3;
var units = 'kilometers';
var properties = { foo: 'bar' };

var myCircle = new Circle(center, radius, {
    units: units,
    zoom: mapzoom,
    properties: properties
});

// DOM elements
var bounds_el = document.getElementById('circleBounds');
var radius_el = document.getElementById('selectRadius');
var drag_el = document.getElementById('selectRadius');
var center_el = document.getElementById('circleCenter');
var radiusLabel_el = document.getElementById('circleRadiusLabel');
bounds_el.innerHTML = 'Bounds: ' + myCircle.getBounds();
center_el.innerHTML = 'Center: ' + myCircle.getCenter();
radiusLabel_el.innerHTML = 'Radius: ' + myCircle.getRadius() + ' ' + units;

// Helper functions
var loading = false;
var animateCircle = function() {
    map.getSource('circle-1').setData(myCircle.asGeojson());
    bounds_el.innerHTML = 'Bounds: ' + myCircle.getBounds();
    center_el.innerHTML = 'Center: ' + myCircle.getCenter();
}

var adjustCirclePrecision = function() {
    let cur_zoom = map.getZoom();
    myCircle.updateZoom(cur_zoom);
    animateCircle();
}

var onMoveCircle = function(e) {
    let mousePoint = turf_truncate(turf_helpers.point(map.unproject(e.point).toArray()), 6);
    myCircle.updateCenter(mousePoint.geometry.coordinates);
    animateCircle();
}

var mouseUpCircle = function() {
    map.setPaintProperty('circle-center-point', 'circle-color', '#fb6a4a');
    map.off('mousemove', onMoveCircle);
}

var mouseDownCircle = function(e) {
    map.setPaintProperty('circle-center-point', 'circle-color', '#a50f15');
    map.on('mousemove', onMoveCircle);
    map.once('mouseup', mouseUpCircle);
};

var onMovePoint = function(e) {
    let clickPoint = map.unproject(e.point).toArray();
    myCircle.updateRadius(turf_distance(myCircle.getCenter(), clickPoint, units));
    radiusLabel_el.innerHTML = 'Radius: ' + Math.trunc(myCircle.getRadius()) + ' ' + units;
    animateCircle();
}

var mouseUpPoint = function() {
    map.setPaintProperty('circle-control-points', 'circle-color', 'white');
    map.off('mousemove', onMovePoint);
}

var mouseDownPoint = function(e) {
    map.setPaintProperty('circle-control-points', 'circle-color', '#a50f15');
    map.on('mousemove', onMovePoint);
    map.once('mouseup', mouseUpPoint);
};

var onMousemove = function(e) {

    map.off('mousedown', mouseDownCircle);
    map.off('mousedown', mouseDownPoint);

    let pointFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['circle-control-points']
    });

    let circleFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['circle-center-point']
    });

    if ((!pointFeatures.length) && (!circleFeatures.length)) {
        map.dragPan.enable();
        map.getCanvas().style.cursor = '';
        return
    }

    if (pointFeatures.length) {
        map.getCanvas().style.cursor = 'pointer';
        map.dragPan.disable();
        map.on('mousedown', mouseDownPoint);
    } else if (circleFeatures.length) {
        map.getCanvas().style.cursor = 'pointer';
        map.dragPan.disable();
        map.on('mousedown', mouseDownCircle);
    }
}

map.on('load', () => {

    map.addSource('circle-1', {
        type: "geojson",
        data: myCircle.asGeojson(),
        tolerance: 0.01,
        maxzoom: 22
    });

    map.addLayer({
        id: "circle-line",
        type: "line",
        source: "circle-1",
        paint: {
            "line-color": "#fb6a4a",
            "line-width": {
                stops: [
                    [0, 0.1],
                    [16, 5]
                ]
            }
        },
        filter: ["==", "$type", "Polygon"]
    }, 'waterway-label')

    map.addLayer({
        id: "circle-fill",
        type: "fill",
        source: "circle-1",
        paint: {
            "fill-color": "#fb6a4a",
            "fill-opacity": 0.5
        },
        filter: ["==", "$type", "Polygon"]
    }, 'waterway-label');

    map.addLayer({
        id: "circle-control-points",
        type: "circle",
        source: "circle-1",
        paint: {
            "circle-color": "white",
            "circle-radius": {
                stops: [
                    [0, 6],
                    [4, 10],
                    [18, 12]
                ]
            },
            "circle-stroke-color": "black",
            "circle-stroke-width": {
                stops: [
                    [0, 0.1],
                    [8, 1],
                    [16, 4]
                ]
            }
        },
        filter: ["all", ["==", "$type", "Point"],
            ["!=", "type", "center"]
        ]
    });

    map.addLayer({
        id: "circle-center-point",
        type: "circle",
        source: "circle-1",
        paint: {
            "circle-color": "#fb6a4a",
            "circle-radius": {
                stops: [
                    [0, 6],
                    [4, 10],
                    [18, 12]
                ]
            },
            "circle-stroke-color": "black",
            "circle-stroke-width": {
                stops: [
                    [0, 0.1],
                    [8, 1],
                    [16, 4]
                ]
            }
        },
        filter: ["all", ["==", "$type", "Point"],
            ["==", "type", "center"]
        ]
    });

    // Add map event listeners

    map.on('zoomend', adjustCirclePrecision);
    map.on('mousemove', _.debounce(onMousemove, 12, { trailing: true, leading: true }))
});