import { program } from "commander";
import geohash from "ngeohash";
import fs from "fs";
import PSI from '@openmined/psi.js'
import GpxParser from "gpxparser";
//import http from "http";
import fetch from 'node-fetch';
import {FormData, Blob} from "formdata-node";


const GEOHASH_LENGTH = 7


function savePoint(client_data, lat, long) {
  let hashedLoc = geohash.encode(lat, long, GEOHASH_LENGTH);
  console.log(hashedLoc);

  client_data.known_points.push(hashedLoc);

  // remove any duplicates
  client_data.known_points = [...new Set(client_data.known_points)];

  fs.writeFileSync('client_data.json', JSON.stringify(client_data, null, 2));
}

function addPoint(str, options) {
  console.log(client_data);
  console.log(str);

  // lat,log. But we have to quote negative values because otherwise it thinks it is an option
  // eg: yarn client add-point \"-34.92945595949726,138.61839998748425\"
  let latlong = str.replace(/"/g, "");
  let [lat, long, ...rest] = latlong.split(",")
  console.log(lat, long);

  savePoint(client_data, lat, long);
}


function importGPX(arg, option) {
  console.log(arg);

  const gpxfiledata = fs.readFileSync(arg);

  let gpx = new GpxParser();
  gpx.parse(gpxfiledata);
  for (const pnt of gpx.tracks[0].points) {
    console.log(pnt.lat + "," + pnt.lon);
    savePoint(client_data, pnt.lat, pnt.lon);
  }

}

async function checkPoints() {

  const psi = await PSI();

  // Define mutually agreed upon parameters for both client and server
  const fpr = 0.001 // false positive rate (0.1%)
  const numClientElements = 100 // Size of the client set to check
  const numTotalElements = 1000 // Maximum size of the server set
  const revealIntersection = true // Allows to reveal the intersection (true)

  const client = psi.client.createWithNewKey(revealIntersection);

  // Create a client request to send to the server
  //console.log(client_data.known_points)
  const clientRequest = client.createRequest(client_data.known_points);

  const serializedClientRequest = clientRequest.serializeBinary();


  let form = new FormData();
  let buf = Buffer.from(serializedClientRequest)

  form.append("data", new Blob([buf]), 'the_data');

  fetch('http://localhost:3000/match', { method: 'POST', body: form })
    .then(function (res) {
      return res.json();
    }).then(function (json) {
      let setupBuffer = Buffer.from(json.setup, 'base64');
      let serializedServerSetup = setupBuffer.buffer.slice(setupBuffer.byteOffset, 
                                          setupBuffer.byteOffset + setupBuffer.byteLength);

      let responseBuffer = Buffer.from(json.response, 'base64');
      let serializedServerResponse = responseBuffer.buffer.slice(responseBuffer.byteOffset, 
                                          responseBuffer.byteOffset + responseBuffer.byteLength);

      const deserializedServerResponse = psi.response.deserializeBinary(
        serializedServerResponse
      );

      const deserializedServerSetup = psi.serverSetup.deserializeBinary(
        serializedServerSetup
      );

      // Reveal the intersection (only if `revealIntersection` was set to true)
      const intersection = client.getIntersection(
        deserializedServerSetup,
        deserializedServerResponse
      )

      // intersection contains the index of the items in the 
      // client_data.known_points array. It isn't very useful on its own
      // console.log('intersection', intersection)

      console.log("\n\nDisplaying intersecting points:\n")
      if (intersection.length > 0) {
        // Display the items in the intersection
        console.log(intersection.map((item) =>  client_data.known_points[item]))
      } else {
        console.log("No intersecting points found.")
      }
      console.log("\n")


    });

}


const rawdata = fs.readFileSync('client_data.json');
const client_data = JSON.parse(rawdata);

// bind the data
addPoint = addPoint.bind(client_data);
checkPoints = checkPoints.bind(client_data);
importGPX = importGPX.bind(client_data);

program.command("add-point")
  .description("add a new decimal lat,lon point")
  .argument("<string>", "decimal lat,long")
  .action(addPoint);

program.command("check-points")
  .description("check our points against server WITHOUT server knowning our point")
  .action(checkPoints);

program.command("import-gpx")
  .description("import a GPX track")
  .argument("<filename>", "file path of GPX file")
  .action(importGPX);

program.parse();
