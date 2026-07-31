# Rhode Island — Every Road

An interactive grayscale map of every public road in Rhode Island, built with [D3.js](https://d3js.org/).

- 31,268 road segments, ~8,400 miles, rendered on canvas for smooth pan/zoom
- Light/dark theme toggle
- Search box to find and zoom to any street
- Town/city labels for all 39 municipalities

## Data

Road and boundary geometry from the U.S. Census Bureau's [TIGER/Line 2023](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) shapefiles (public domain), simplified and converted to TopoJSON with [mapshaper](https://github.com/mbloch/mapshaper).

## Running locally

Any static file server works, e.g.:

```
npx http-server .
```

Then open the printed URL.
