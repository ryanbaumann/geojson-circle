# Geojson

Create geojson circles in javascript.

```
var center = [-75.343, 39.984];
var radius = 3;
var units = 'kilometers';
var properties = { foo: 'bar' };

var myCircle = new Circle(center, radius, {
    units: units,
    zoom: 12,
    properties: properties
});

var geojson = myCircle.asGeojson();

// Update circle center
myCircle.updateCenter([0,0]);`

// Update circle zoom
myCircle.updateZoom(10);

// Update circle radius
myCircle.updateRadius(100);

```

### Building

`npm install`

If using in your app, include the following library in your code:
`dist/geojson-circle.js`

If building a new version from source:
`num run build`

### Example

Use Mapbox GL JS to load the example implementation at /examples at www.mapbox.com/labs/draw-circle:

![](https://cl.ly/2W1t2M3N3g1C/download/Screen%20Recording%202017-08-17%20at%2002.46%20PM.gif)
