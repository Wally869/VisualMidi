const express = require("express");
const app = express();
app.use(express.static('jsfiles'))
const port = 3000;

const path = require('path');
const fs = require("fs");
var files = []

const { analyzeSong } = require("./songAnalyzer")
//import analyzeSong from "./songAnalyzer.js"; //= require("songAnalyzer.js")
//const { analyzeSong } = require("./songAnalyzer.js")

app.get("/", (req, res) => res.sendFile(path.join(__dirname+'/index.html')));
app.get("/files", function(req, res) { 
    files = fs.readdirSync('TestInputs');
    res.send(files)
});
app.get("/analyze/:filename", async function(req, res) { 
    var filename = req.params.filename;
    console.log("Analyzing: " + filename);
    specs = await analyzeSong(filename);
    res.send(specs);
});
app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
