
/*
 *
 * MY STUFF NOW
 *
 */

// tracking stuff
var chart = null;

// variables
var rawData = [];
var chosenIdChannel = 0;
var channelsCount = 0;
var excludeDrums = false;

function UpdateChannelCount() {
  channelsCount = rawData.length;
}

function ChangeIdChannel(delta) {
  chosenIdChannel += delta;
  if (chosenIdChannel > channelsCount - 1) {
    chosenIdChannel = 0;
  } else if (chosenIdChannel < 0) {
    chosenIdChannel = channelsCount - 1;
  }

  document.getElementById("channelValue").textContent = chosenIdChannel;
  UpdateChart();
}

function ResetIdChannel() {
  chosenIdChannel = 0;
  ChangeIdChannel(0);
}

function registerNewChart(newChart) {
  // Keeping track of chart object, coz need it to delete it
  if (chart != null) {
    chart.destroy();
  }
  chart = newChart;
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
  getSplitted(id) {
    if (id > this.colors.length - 1) {
      this.getColor(id);
    }
    var currString = this.colors[id];
    currString = currString.replace("rgba(", "");
    currString = currString.replace(")");
    var splitted = currString.split(",");
    return [splitted[0], splitted[1], splitted[2]];
  }
}

var colorPool = new ColorPool();

// server communication

async function getFiles() {
  const res = await fetch("./files");
  let strFiles = await res.text();
  let fileNames = JSON.parse(strFiles);
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

async function callAnalyze(filename) {
  document.body.style.cursor = "wait";
  const res = await fetch("./analyze/" + filename)
    .then(async (res) => {
      let textResp = await res.text();
      rawData = JSON.parse(textResp);
    })
    .then(UpdateChannelCount);
}

async function analyzeFile() {
  var filename = document.getElementById("fileSelect").value;
  if (filename != "placeholder") {
    callAnalyze(filename).then(ResetIdChannel).then(UpdateChart);
  } else {
    console.log("put a warning for placeholder?");
  }
}

// Styling logic
var topButtons = ["buttonGlobal", "buttonSingleChannel"];
var sideButtons = [
  "buttonOverview",
  "buttonDeltaTimes",
  "buttonIntervalsHistogram",
  "buttonIntervalsSuccession",
];

var buttonsTracker = {
  buttonGlobal: true,
  buttonSingleChannel: false,
  buttonOverview: true,
  buttonDeltaTimes: false,
  buttonIntervalsHistogram: false,
  buttonIntervalsSuccession: false,
};

function SetElementsStyle() {
  var classListToApply;
  for (var idButton of topButtons) {
    if (buttonsTracker[idButton]) {
      classListToApply =
        "w-full border-indigo-200 border-2 py-2 px-4 bg-indigo-200 text-white font-bold shadow";
    } else {
      classListToApply =
        "w-full border-indigo-200 border-2 py-2 px-2 font-semibold shadow";
    }
    document.getElementById(idButton).classList = classListToApply;
  }

  for (idButton of sideButtons) {
    if (buttonsTracker[idButton]) {
      classListToApply =
        "w-full border-indigo-200 border-2 rounded-full py-2 px-4 bg-indigo-200 text-white font-bold shadow";
    } else {
      classListToApply =
        "w-full border-indigo-200 border-2 rounded-full py-2 px-4 font-semibold shadow";
    }
    document.getElementById(idButton).classList = classListToApply;
  }

  var channelSide = document.getElementById("channelSide");
  var drumsSide = document.getElementById("drumsSide");
  if (buttonsTracker["buttonGlobal"]) {
    channelSide.classList.add("invisible");
    drumsSide.classList.remove("invisible");
  } else {
    drumsSide.classList.add("invisible");
    channelSide.classList.remove("invisible");
  }
}

function NotifyClick(idElement) {
  if (!buttonsTracker[idElement]) {
    var buttonsToUpdate = sideButtons;
    if (topButtons.includes(idElement)) {
      buttonsToUpdate = topButtons;
    }

    for (var b of buttonsToUpdate) {
      buttonsTracker[b] = false;
    }
    buttonsTracker[idElement] = true;
  } else {
    return;
  }

  SetElementsStyle();
  UpdateChart();
}

function UpdateChart() {
  var canvas = document.getElementById("myChart");
  var ctx = canvas.getContext("2d");

  let datasets = [];

  if (buttonsTracker["buttonOverview"]) {
    if (buttonsTracker["buttonGlobal"]) {
      for (var channelId in rawData) {
        var channelData = rawData[channelId];
        var datapoints = [];

        if (excludeDrums & channelData["IsDrumsTrack"]) {
        } else {
          for (var i = 0; i < channelData["Times"].length; i++) {
            datapoints.push({
              x: channelData["Times"][i],
              y: channelData["Frequencies"][i],
            });
          }
          datasets.push({
            label: "Channel " + String(channelId),
            data: datapoints,
            pointBackgroundColor: colorPool.getColor(channelId), //"rgba(157, 148, 42, 1)",
            backgroundColor: colorPool.getColor(channelId),
          });
        }
      }
    } else {
      channelData = rawData[chosenIdChannel];
      datapoints = [];
      for (var i = 0; i < channelData["Times"].length; i++) {
        datapoints.push({
          x: channelData["Times"][i],
          y: channelData["Frequencies"][i],
        });
      }
      datasets.push({
        label: "Channel " + String(chosenIdChannel),
        data: datapoints,
        pointBackgroundColor: colorPool.getColor(chosenIdChannel), //"rgba(157, 148, 42, 1)",
        backgroundColor: colorPool.getColor(chosenIdChannel),
      });
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
  } else if (buttonsTracker["buttonDeltaTimes"]) {
    var idColor = 0;
    if (buttonsTracker["buttonGlobal"]) {
      var deltatimes = {};
      for (var channelData of rawData) {
        var keys = Object.keys(channelData["DeltaTimes"]);
        for (var k of keys) {
          if (Object.keys(deltatimes).includes(k)) {
            deltatimes[k] += channelData["DeltaTimes"][k];
          } else {
            deltatimes[k] = channelData["DeltaTimes"][k];
          }
        }
      }
    } else {
      deltatimes = rawData[chosenIdChannel]["DeltaTimes"];
      idColor = chosenIdChannel;
    }

    var labels = Object.keys(deltatimes);
    var values = Object.values(deltatimes);

    datasets = [
      {
        label: "Delta Times",
        data: values,
        backgroundColor: colorPool.getColor(idColor),
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
  } else if (buttonsTracker["buttonIntervalsHistogram"]) {
    var idColor = 0;
    if (buttonsTracker["buttonGlobal"]) {
      var intervals = {};
      for (var channelData of rawData) {
        var keys = Object.keys(channelData["IntervalsStandalone"]);
        for (var k of keys) {
          if (Object.keys(intervals).includes(k)) {
            intervals[k] += channelData["IntervalsStandalone"][k];
          } else {
            intervals[k] = channelData["IntervalsStandalone"][k];
          }
        }
      }
    } else {
      intervals = rawData[chosenIdChannel]["IntervalsStandalone"];
      idColor = chosenIdChannel;
    }

    labels = Object.keys(intervals);
    values = Object.values(intervals);

    datasets = [
      {
        label: "Intervals",
        data: values,
        backgroundColor: colorPool.getColor(idColor),
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
  } else if (buttonsTracker["buttonIntervalsSuccession"]) {
    if (buttonsTracker["buttonGlobal"]) {
      var idColor = 0;
      var dataHeatmap = [];
      for (var channelData of rawData) {
        for (var k1 of Object.keys(channelData["IntervalsSuccession"])) {
          for (var k2 of Object.keys(channelData["IntervalsSuccession"][k1])) {
            var foundItem = false;
            for (var elem of dataHeatmap) {
              if (elem["x"] == k1 && elem["y"] == k2) {
                elem["v"] += channelData["IntervalsSuccession"][k1][k2];
                foundItem = true;
              }
            }
            if (!foundItem) {
              dataHeatmap.push({
                x: k1,
                y: k2,
                v: channelData["IntervalsSuccession"][k1][k2],
              });
            }
          }
        }
      }
    } else {
      channelData = rawData[chosenIdChannel];
      dataHeatmap = [];
      for (var k1 of Object.keys(channelData["IntervalsSuccession"])) {
        for (var k2 of Object.keys(channelData["IntervalsSuccession"][k1])) {
          dataHeatmap.push({
            x: k1,
            y: k2,
            v: channelData["IntervalsSuccession"][k1][k2],
          });
        }
      }
    }

    var intervalsLabels = [];
    for (var elem of dataHeatmap) {
      intervalsLabels.push(elem["x"]);
      intervalsLabels.push(elem["y"]);
    }


    var uniqueLabels = [...new Set(intervalsLabels)];

    var dh = []
    for (var elem of dataHeatmap) {
        dh.push(
            {x: uniqueLabels.indexOf(elem['x']), 
            y: uniqueLabels.indexOf(elem["y"]), 
            z: elem["v"]}
        )
    }
    //console.log(uniqueLabels)

    var maxVal = 0;
    for (var elem of dh) {
        if (elem["z"] > maxVal) {
            maxVal = elem["z"]
        }
    }
    //console.log(dataHeatmap)

    var newChart = new Chart(ctx, {
        type: 'matrix',
        labels: uniqueLabels,
        data: {
            labels: uniqueLabels,
            datasets: [{
                label: 'Intervals Succession',
                data: dataHeatmap,
                backgroundColor: function(ctx) {
                    var value = ctx.dataset.data[ctx.dataIndex].v;
                    var alpha = value / (maxVal * 0.25);
                    
                    //return Color('green').alpha(alpha).rgbString();
                    var rgb = colorPool.getSplitted(chosenIdChannel)
                    return "rgba("+rgb[0]+", "+rgb[1]+", "+rgb[2]+", "+alpha+")"
                },
                borderWidth: {left: 3, right: 3},
                width: function(ctx) {
                    var a = ctx.chart.chartArea;
                    return (a.right - a.left) / uniqueLabels.length;
                },
                height: function(ctx) {
                    var a = ctx.chart.chartArea;
                    return (a.bottom - a.top) / uniqueLabels.length;
                }

            }],
        },
        tooltips: {
            mode: 'dataset',
            callbacks: {
              title: function() {
                return "*** AWAOOOOOYYYY ***"
              },
              label: function(tooltipItem, data) {
                for (elem of dataHeatmap) {
                    console.log("wassup")
                    if (tooltipItems[0].xLabel == elem["x"] && tooltipItems[0].yLabel == elem["y"]) {
                        return elem["v"]
                    }
                }
                return "Not Found"
              }
            }
          },
        options: {
            responsive : true,
            legend: {
                display: true
            }
        }

    });


  }

  registerNewChart(newChart);
  document.body.style.cursor = "default";
}
