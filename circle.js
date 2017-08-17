'use strict'

const turf_circle = require('@turf/circle');
const turf_linedistance = require('@turf/line-distance');
const turf_bbox = require('@turf/bbox');
const turf_bbox_poly = require('@turf/bbox-polygon');
const turf_truncate = require('@turf/truncate');
const turf_destination = require('@turf/destination');
const turf_helpers = require('@turf/helpers');

function Circle(center, radius, options) {

    this.center = center; //Point geojson feature or array of [long,lat]
    this.radius = radius; //Radius of circle

    // miles, kilometers, degrees, or radians
    this.units = options.units ? options.units : 'kilometers'
    //Current zoom level detail of circle
    this.zoom = options.zoom ? options.zoom : 8
    // JSON Object - property metadata for circle
    this.properties = options.properties ? options.properties : {}

    this.steps = 100 // Default steps

    this.circle_gj = turf_circle(
        this.center,
        this.radius,
        this.steps,
        this.units,
        this.properties
    )

    this.controlPoints = [
        turf_destination(this.center, this.radius, 0, this.units),
        turf_destination(this.center, this.radius, 90, this.units),
        turf_destination(this.center, this.radius, 180, this.units),
        turf_destination(this.center, this.radius, -90, this.units)
    ]

    this._updateCircle = function() {

        this.steps = this._calcSteps(this.zoom)
        
        this.circle_gj = turf_circle(
            this.center,
            this.radius,
            this.steps,
            this.units,
            this.properties
        )

        this.controlPoints = [
            turf_destination(this.center, this.radius, 0, this.units),
            turf_destination(this.center, this.radius, 90, this.units),
            turf_destination(this.center, this.radius, 180, this.units),
            turf_destination(this.center, this.radius, -90, this.units)
        ]
    }

    this._calcSteps = function(zoom) {
        if (zoom <= 0.1) { zoom = 0.1 }
        var radius_km = turf_helpers.convertDistance(this.radius, this.units, 'kilometers')
        this.steps = (Math.sqrt(radius_km * 250) * zoom ^ 2);
    }

    this._calcSteps(this.zoom)

    this.asGeojson = function() {
        var feats = this.controlPoints
        feats.push(this.circle_gj)
        feats.push(turf_helpers.point(this.center, {"type": "center"}))
        return turf_helpers.featureCollection(feats)
    }

    this.updateCenter = function(newCenter) {
        this.center = newCenter;
        this._updateCircle();
    }

    this.updateRadius = function(newRadius) {
        this.radius = newRadius;
        this._updateCircle();
    }

    this.updateZoom = function(newZoom) {
        this.zoom = this._calcSteps(newZoom)
        this._updateCircle();
    }

    this.updateSteps = function(newSteps) {
        this.steps = newSteps;
        this._updateCircle();
    }

    this.updateUnits = function(newUnits) {
        this.units = newUnits;
        this._updateCircle();
    }

    this.getBounds = function() {
        var bbox_poly = turf_truncate(turf_bbox_poly(turf_bbox(this.circle_gj)), 6)
        var bounds = [
            bbox_poly.geometry.coordinates[0][0][0],
            bbox_poly.geometry.coordinates[0][0][1],
            bbox_poly.geometry.coordinates[0][2][0],
            bbox_poly.geometry.coordinates[0][2][1],
        ]
        return bounds
    }

    this.getBboxPoly = function() {
        return bbox_poly = turf_truncate(turf_bbox_poly(turf_bbox(this.circle_gj)), 6)
    }

    this.getCenter = function() {
        return this.center
    }

    this.getRadius = function() {
        return this.radius
    }

    this.getControlPoints = function() {
        return turf_helpers.featureCollection(this.controlPoints)
    }

}

module.exports = exports = Circle;