// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu} = require('electron')
const {menu} = require("./electron-js/menu")

const path = require('path')
const isMac = process.platform === 'darwin'

Menu.setApplicationMenu(menu)

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon:'favicon.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

//   mainWindow.webContents.on('new-window', function(e, url) {
//     e.preventDefault();
//     require('electron').shell.openExternal(url);
//   });

  mainWindow.addEventListener('menu-save-command', (e) =>{
    e.preventDefault()
    console.log('this worked?')
  })

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}



// This method will be called when Electron has finished initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  
  

})


// Quit when all windows are closed, except on macOS. There, it's common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
