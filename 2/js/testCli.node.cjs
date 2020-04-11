#!/usr/bin/env node
const fs = require('fs');
const testHtmlLauncher = fs.readFileSync("test.html","utf8");
let jsToRun = "";
testHtmlLauncher.replace(new RegExp(`<script( src="([^"]+)")?>((?!</script>)[\\s\\S]+)?</script>`,'g'),
    (found,optionalPattern,url,jsContent,chrNumber,wholeDocument)=>{
        if(url) jsToRun+= fs.readFileSync(url,"utf8");
        if(jsContent) jsToRun+=jsContent;
    });
fs.writeFileSync('.generated.toRun.js',jsToRun);
require('./.generated.toRun.js');
fs.unlinkSync('.generated.toRun.js');