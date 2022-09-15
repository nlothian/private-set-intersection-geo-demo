# GEO PSI Demo

Demonstration using private set intersection (PSI) to privately communicate locations a client has visited with locations a server knows about. 

Locations are encoded using [GeoHash](https://en.wikipedia.org/wiki/Geohash). There are [existing geohash explorer sites](https://chrishewett.com/blog/geohash-explorer/?) that allow you to explore geohashs. 

This demo consists of separate client and server programs (written for node.js). Data is stored in JSON files: `server_data.json` for the server and `client_data.json` for the client. 

The server (written using [express js](https://expressjs.com/)) provides a simple REST endpoint `/match` that allows the client to post the encrypted locations to the server. 

The client allows entry of specific decimal lat,long points, import of a GPX file or checking the saved points against the server.  

## Installation

```
nvm use
yarn install
```

## Usage

The server comes configured with a set of points it knows about. See the `server_data.json` file. Add new ones by choosing geohash points using an [existing geohash explorer site](https://chrishewett.com/blog/geohash-explorer/?).

The client is setup using points from the GPX file `sample_gpx_trace.gpx`. You can view this file on [GPX Studio](https://gpx.studio/).

Start the server:

```
node server.js
```

Test what points match:

```
node client.js check-points
```

Import a GPX file: 

```
node client.js import-gpx <filename>
```


Add a specific point to the client:

```
node client.js add-point \"-34.920728697483,138.60850731031323\"
```