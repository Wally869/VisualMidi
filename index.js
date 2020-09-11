const express = require("express");
const srv = express();
srv.use(express.static('jsfiles'))
const port = 4000;

const path = require('path');
const fs = require("fs");
var files = []

const { analyzeSong } = require("./songAnalyzer.js")
//import analyzeSong from "./songAnalyzer.js"; //= require("songAnalyzer.js")
//const { analyzeSong } = require("./songAnalyzer.js")

srv.get("/", (req, res) => res.sendFile(path.join(__dirname+'/index.html')));
srv.get("/files", function(req, res) { 
    files = fs.readdirSync('TestInputs');
    res.send(files)
});
srv.get("/analyze/:filename", async function(req, res) { 
    var filename = req.params.filename;
    console.log("Analyzing: " + filename);
    specs = await analyzeSong(filename);
    console.log(specs)
    res.send(specs);
});

if (process.argv.length > 2) {
  srv.listen(port, () =>
  console.log(`srv listening at http://localhost:${port}`)
  );
}
/*
srv.listen(port, () =>
  console.log(`srv listening at http://localhost:${port}`)
);
*/

module.exports = {srv};