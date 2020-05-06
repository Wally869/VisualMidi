const {app, BrowserWindow} = require('electron')
const path = require('path')

const {srv} = require('./index.js');


console.log("here")
function createWindow () {
    console.log("creating window")
    var port = 3000;
    srv.listen(port, () =>
        console.log(`srv listening at http://localhost:${port}`)
    );
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 1024,
      height: 1024,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })
    mainWindow.setMenuBarVisibility(false);
  
    // and load the index.html of the app.
    //mainWindow.loadFile('index.html')
    mainWindow.maximize();
    mainWindow.loadURL('http://localhost:' + port);
    mainWindow.focus();


    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
  }
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(createWindow)
  
  // Quit when all windows are closed.
  app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
  })