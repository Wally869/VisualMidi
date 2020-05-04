// tracking stuff
var chart = null;

function registerChart(newChart) {
  // Keeping track of chart object, coz need it to delete it
  chart = newChart;
}

const selectors = ["NoteHeights", "DeltaTimes", "Intervals"];
var chartSelectors = {
  NoteHeights: true,
  DeltaTimes: false,
  Intervals: false,
  Drums: false,
};

function toggleSelection(selected) {
  if (selected === "Drums") {
    chartSelectors["Drums"] = !chartSelectors["Drums"];
  } else {
    // check if selected already true, if true, then ignore
    if (chartSelectors[selected]) {
      return null;
    }

    // else, we change everything
    selectors.forEach((s) => {
      chartSelectors[s] = false;
    });
    chartSelectors[selected] = true;
  }

  // now update chart, we switch to the new data
  updateToggleButtons();
  updateChart();
}

function updateToggleButtons() {
  let selectorsPlusDrums = ["NoteHeights", "DeltaTimes", "Intervals", "Drums"];

  let selectedClasses =
    "w-full border-indigo-200 border-2 rounded-full py-2 px-4 bg-indigo-200 text-white font-bold shadow";
  let unselectedClasses =
    "w-full border-indigo-200 border-2 rounded-full py-2 px-4 font-semibold shadow";

  selectorsPlusDrums.forEach((s) => {
    if (chartSelectors[s]) {
      document.getElementById(s + "Button").classList = selectedClasses;
    } else {
      document.getElementById(s + "Button").classList = unselectedClasses;
    }
  });
}

// creating a pool of colors
function randomColorString() {
  let r = Math.floor(Math.random() * 255);
  let g = Math.floor(Math.random() * 255);
  let b = Math.floor(Math.random() * 255);
  return "rgba(" + String(r) + ", " + String(g) + ", " + String(b) + ", 0.7)";
}

class ColorPool {
  constructor() {
    this.colors = [];
  }
  getColor(id) {
    while (id > this.colors.length - 1) {
      this.colors.push(randomColorString());
    }
    return this.colors[id];
  }
}

var colorPool = new ColorPool();

async function getFiles() {
  const res = await fetch("./files");
  let strFiles = await res.text();
  let fileNames = JSON.parse(strFiles);
  //document.getElementById("listFiles").innerHTML = fileNames;
  return fileNames;
}

async function updateFileSelectList() {
  let optionList = document.getElementById("fileSelect");
  getFiles().then(function (fileNames) {
    for (let i = optionList.options.length - 1; i >= 0; i--) {
      optionList.remove(i);
    }

    fileNames.forEach((f) => {
      optionList.options.add(new Option(f, f));
    });
  });
}

var rawData = [];
var currentSpecs = [];

async function callAnalyze(filename) {
  document.body.style.cursor = "wait";
  const res = await fetch("./analyze/" + filename).then(async (res) => {
    let textResp = await res.text();
    rawData = JSON.parse(textResp);
  });
}

function updateChart() {
  document.body.style.cursor = "wait";

  // get current key
  let currKey = "";
  selectors.forEach((s) => {
    if (chartSelectors[s]) {
      currKey = s;
    }
  });

  if (currKey == "NoteHeights") {
    currKey = "FrequencyPoints";
  }

  // prepareData
  var canvas = document.getElementById("myChart");
  var ctx = canvas.getContext("2d");
  if (chart) {
    chart.destroy();
  }

  if (currKey == "FrequencyPoints") {
    let currId = 0;

    var datasets = [];
    for (var idTrack = 0; idTrack < rawData.length; idTrack++) {
      if (rawData[idTrack]["IsPercussions"] && chartSelectors["Drums"]) {
        // is drums tracks and ignoring drums
      } else {
        var arrs = rawData[idTrack][currKey];
        var points = [];
        for (var i = 0; i < arrs[0].length; i++) {
          points.push({ x: arrs[0][i], y: arrs[1][i] });
        }

        datasets.push({
          label: "Track " + String(idTrack),
          data: points,
          pointBackgroundColor: colorPool.getColor(idTrack), //"rgba(157, 148, 42, 1)",
          backgroundColor: colorPool.getColor(idTrack),
        });
      }
    }

    var newChart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: datasets,
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
        maintainAspectRatio: true,
        responsive: true,
      },
    });
  } else {
    // both are dicts
    // for now, concatenating all tracks?
    let concatVals = [];
    for (var idTrack = 0; idTrack < rawData.length; idTrack++) {
      if (rawData[idTrack]["IsPercussions"] && chartSelectors["Drums"]) {
        // is drums tracks and ignoring drums
      } else {
        concatVals = concatVals.concat(rawData[idTrack][currKey]);
      }
    }

    // and counting all occurrences
    let counter = {};
    concatVals.forEach((val) => {
      if (!counter[val]) {
        counter[val] = 1;
      } else {
        counter[val] = counter[val] + 1;
      }
    });

    // now extract keys and values
    let labels = Object.keys(counter);
    let vals = [];
    labels.forEach((l) => {
      vals.push(counter[l]);
    });

    let datasets = [
      {
        label: currKey,
        data: vals,
        backgroundColor: colorPool.getColor(idTrack),
      },
    ];

    var newChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
        maintainAspectRatio: true,
        responsive: true,
      },
    });
  }

  registerChart(newChart);
  document.body.style.cursor = "default";
}

async function analyzeFile() {
  var filename = document.getElementById("fileSelect").value;
  if (filename != "placeholder") {
    callAnalyze(filename).then(updateChart);
  } else {
    console.log("put a warning for placeholder?");
  }

  //updateChart();
  //console.log(filename);
}
