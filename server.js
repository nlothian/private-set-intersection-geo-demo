import express from "express"
import cors from "cors"
import PSI from '@openmined/psi.js'
import fs from "fs"
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer(storage);

//const upload = multer({ dest: 'uploads/' });


const app = express();

//app.use(express.json());

app.use(cors());
app.options('*', cors());


const port = 3000;

// Define mutually agreed upon parameters for both client and server
const fpr = 0.001 // false positive rate (0.1%)
const numClientElements = 100 // Size of the client set to check
const numTotalElements = 1000 // Maximum size of the server set
const revealIntersection = true // Allows to reveal the intersection (true)


const rawdata = fs.readFileSync('server_data.json');
const server_data = JSON.parse(rawdata);


async function doMatch(req, res) {

    let buf = req.file?.buffer

    //res.send('Got a POST request')
    const psi = await PSI();

    const server = psi.server.createWithNewKey(revealIntersection);

    const serverSetup = server.createSetupMessage(
        fpr,
        numClientElements,
        server_data.known_points
        // psi.dataStructure.GCS // This is the default and can omitted
    )

    // need to get the UInt8Array from the buffer
    let ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const deserializedClientRequest = psi.request.deserializeBinary(
        ab
    )

    const serverResponse = server.processRequest(deserializedClientRequest);

    const serializedServerResponse = serverResponse.serializeBinary();

    const serializedServerSetup = serverSetup.serializeBinary()

    const responseData = {
        "setup":  Buffer.from(serializedServerSetup).toString('base64'),
        "response": Buffer.from(serializedServerResponse).toString('base64')
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(responseData));
    
}

app.get('/', (req, res) => {
    res.send('PSI Server')
})

app.post('/match', upload.single('data'), doMatch);

app.get('/match', (req, res) => {
    res.send('PSI Server - Match')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})