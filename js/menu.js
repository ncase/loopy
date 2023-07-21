const {app, Menu} = require('electron');
const isMac = process.platform === 'darwin';
const debug = true;

const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        { role: 'save' ,
          click: async () => { 
            const save = require("./save.js");
            save();
          } ,
          accelerator: "CmdOrCtrl+s",          
          label: 'Save'
          },
        isMac ? { role: 'close' } : { label: 'Quit', accelerator:"Ctrl+q",click: async ()=>{app.quit();}},
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        //DEBUG
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools'},
        
        
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
  
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
  ]
  
module.exports.menu = Menu.buildFromTemplate(template)