const {BrowserWindow} = require('electron');
function save(){
    let win = BrowserWindow.getFocusedWindow();
    win.webContents.executeJavaScript(
        "var element = document.createElement('a');"
        + 'var data = [];var nodes = [];for(var i=0;i<self.nodes.length;i++){var node = self.nodes[i];nodes.push([node.id,Math.round(node.x),Math.round(node.y),node.init,encodeURIComponent(encodeURIComponent(node.label)),node.hue]);}data.push(nodes);var edges = [];for(var i=0;i<self.edges.length;i++){var edge = self.edges[i];var dataEdge = [edge.from.id,edge.to.id,Math.round(edge.arc),edge.strength];if(dataEdge.f==dataEdge.t){dataEdge.push(Math.round(edge.rotation));}edges.push(dataEdge);}data.push(edges);var labels = [];for(var i=0;i<self.labels.length;i++){var label = self.labels[i];labels.push([Math.round(label.x),Math.round(label.y),encodeURIComponent(encodeURIComponent(label.text))]);}data.push(labels);data.push(Node._UID);var dataString = JSON.stringify(data);dataString = dataString.replace(/"/gi, "%22");dataString = dataString.substr(0, dataString.length-1) + "%5D";'
        + "element.setAttribute('href', 'data:text/plain;charset=utf-8,' + dataString);"
        + "element.setAttribute('download', 'system_model.loopy');"
        + "element.style.display = 'none';"
        + "document.body.appendChild(element);"
        + "element.click();"
        + "document.body.removeChild(element);"
    ).then(console.log('Save Successful')).catch(err => null);   
}
module.exports = save;