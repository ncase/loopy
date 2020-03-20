function factorySwitchMode(disabledClass,activatedClass){
    return function(value){
        let apply;
        if(value) apply = function(page){
            page.dom.classList.add(activatedClass);
            page.dom.classList.remove(disabledClass);
        };
        else apply = function(page){
            page.dom.classList.add(disabledClass);
            page.dom.classList.remove(activatedClass);
        };
        loopy.sidebar.pages.forEach(apply);
    }
}

// Loopy global features

injectProperty("loopy", "loopyMode",{
    defaultValue:0,
    persist:1,
    sideBar:{
        index: 1,
        options: [ 0, 1], // Simple || Advanced
        label: "LOOPY v2 mode :",
        oninput: factorySwitchMode("simple","advanced")
    }
});
injectProperty("loopy", "colorLogic",{
    defaultValue:0,
    persist:2,
    sideBar:{
        index: 2,
        options: [ 0, 1],
        labelFunc: (v)=>v?"Color : significant for logic":"Color : only aesthetic",
        advanced: true,
        oninput: factorySwitchMode("colorAestheticMode","colorLogicMode")
    }
});
injectProperty("loopy", "redKill",{
    defaultValue:0,
    persist:3,
    sideBar:{
        index: 3,
        options: [ 0, 1],
        labelFunc: (v)=>v?"Red : propagate death":"Red : is a normal color",
        advanced: true,
        colorLogic:true
    }
});
injectProperty("loopy", "greenLife",{
    defaultValue:0,
    persist:4,
    sideBar:{
        index: 4,
        options: [ 0, 1],
        labelFunc: (v)=>v?"Green : back to life signal":"Green : is a normal color",
        advanced: true,
        colorLogic:true
    }
});

// Node features

injectProperty("node", "label",{
    defaultValue:"?",
    immutableDefault:true,
    persist:{
        index:4,
        serializeFunc:(v)=>encodeURIComponent(encodeURIComponent(v)),
        deserializeFunc:decodeURIComponent
    },
    sideBar:{
        index: 1,
        label: "Name :"
    }
});
injectProperty("node", "hue",{
    defaultValue:0,
    persist:5,
    sideBar:{
        index: 2,
        options: [0,1,2,3,4,5],
        label: "Color :"
    }
});
injectProperty("node", "size",{
    defaultValue:1,
    persist:6,
    sideBar:{
        index: 3,
        options: [0.0001, 1, 5, 100],
        label: "Size :",
        advanced: true
    }
});
injectProperty("node", "init",{
    defaultValue:0.5,
    persist:3,
    sideBar:{
        index: 4,
        options: [0, 0.16, 0.33, 0.50, 0.66, 0.83, 1],
        //options: [0, 1/6, 2/6, 3/6, 4/6, 5/6, 1],
        label: "Start Amount :"
    }
});
injectProperty("node", "overflow",{
    defaultValue:0,
    persist:8,
    sideBar:{
        index: 5,
        options: [ 0, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4],
        label: "Positive overflow threshold :",
        advanced: true
    }
});
injectProperty("node", "underflow",{
    defaultValue:0,
    persist:9,
    sideBar:{
        index: 6,
        options: [ 0, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4],
        label: "Negative overflow threshold :",
        advanced: true
    }
});
injectProperty("node", "aggregationLatency",{
    defaultValue:0,
    persist:7,
    sideBar:{
        index: 7,
        options: [ 0, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4],
        labelFunc: (v)=>"Aggregation latency : "+v+"s",
        advanced: true
    }
});
injectProperty("node", "explode",{
    defaultValue:0,
    persist:10,
    sideBar:{
        index: 8,
        options: [ 0, -1, 1, 2],
        labelFunc: (v)=>{
            const cases = [];
            cases[0] ="Explode : never";
            cases[-1]="Explode : if empty";
            cases[1] ="Explode : if full";
            cases[2] ="Explode : if empty or full";
            return cases[parseInt(v)];
        },
        advanced: true
    }
});

// Edge features

injectProperty("edge", "signBehavior",{
    defaultValue:0,
    persist:5,
    sideBar:{
        index: 2,
        options: [ 0, 1, 2],
        labelFunc: (v)=>[
            "Sign Behavior : <br/>apply relationship effect",
            "Sign Behavior : <br/>apply arrow sign",
            "Sign Behavior : <br/>filter by arrow sign"
        ][v],
        advanced: true
    }
});
injectProperty("edge", "quantitative",{
    defaultValue:0,
    persist:9,
    sideBar:{
        index: 3,
        options: [0, 1],
        labelFunc: (v)=>[
            "Signal type : tendency",
            "Signal type : quantity",
        ][v],
        advanced: true
    }
});
const COLORS_NAME = ["red", "orange", "yellow", "green", "blue", "purple"];
injectProperty("edge", "edgeFilterColor",{
    defaultValue:-1,
    persist:6,
    sideBar:{
        index: 4,
        options: [-1,0,1,2,3,4,5],
        labelFunc: (v)=>{
            if(loopy.colorLogic===1){
                if(parseInt(v)=== -1) return "Color filter : all signal pass";
                else return `Color filter : ${COLORS_NAME[v]} signal only`;
            } else return "Start color : ";
        },
        advanced: true
    }
});
injectProperty("edge", "edgeTargetColor",{
    defaultValue:-1,
    persist:7,
    sideBar:{
        index: 5,
        options: [-1,0,1,2,3,4,5],
        labelFunc: (v)=>{
            if(loopy.colorLogic===1){
                if(parseInt(v)=== -1) return "Color converter : as is";
                else return `Color converter : to ${COLORS_NAME[v]}`;
            } else{
                if(parseInt(v)=== -1) return "End color : auto from start color";
                else return `End color : ${COLORS_NAME[v]}`;
            }
        },
        advanced: true
    }
});
injectProperty("edge", "customLabel",{
    defaultValue:"",
    persist:{
        index:8,
        serializeFunc:(v)=>encodeURIComponent(encodeURIComponent(v)),
        deserializeFunc:decodeURIComponent
    },
    sideBar:{
        index: 99,
        label: "Custom name :",
        advanced: true
    }
});
