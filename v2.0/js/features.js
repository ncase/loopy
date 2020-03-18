/*injectProperty("node", "transmissionBehavior",{
        defaultValue:0,
        persist:6,
        sideBar:{
            index: 4,
            options: [ 0, 1,2],
            labelFunc: (v)=>[
                "On signal : <br/>allways transmit",
                "On signal : <br/>transmit if outbound",
                "On signal : <br/>transmit if overflow, die if empty",
            ][v],
            advanced: true
        }
    }
);*/
injectProperty("node", "overflow",{
        defaultValue:0,
        persist:6,
        sideBar:{
            index: 4,
            options: [ 0, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4],
            label: "Positive overflow threshold :",
            advanced: true
        }
    }
);
injectProperty("node", "explodeCap",{
        defaultValue:0,
        persist:8,
        sideBar:{
            index: 5,
            options: [ 0, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4],
            label: "Explode threshold :",
            advanced: true
        }
    }
);
injectProperty("node", "underflow",{
        defaultValue:0,
        persist:9,
        sideBar:{
            index: 6,
            options: [ 0, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4],
            label: "Negative overflow threshold :",
            advanced: true
        }
    }
);
injectProperty("node", "implodeCap",{
        defaultValue:0,
        persist:10,
        sideBar:{
            index: 7,
            options: [ 0, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4],
            label: "Implode threshold :",
            advanced: true
        }
    }
);
injectProperty("node", "aggregationLatency",{
        defaultValue:0,
        persist:7,
        sideBar:{
            index: 8,
            options: [ 0, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4],
            labelFunc: (v)=>"Aggregation latency : "+v+"s",
            advanced: true
        }
    }
);
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
    }
);
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
    }
);
const COLORS_NAME = ["red", "orange", "yellow", "green", "blue", "purple"];
injectProperty("edge", "edgeFilterColor",{
        defaultValue:-1,
        persist:6,
        sideBar:{
            index: 4,
            options: [-1,0,1,2,3,4,5],
            labelFunc: (v)=>{
                if(loopy.globalState.colorMode===1){
                    if(parseInt(v)=== -1) return "Color filter : all signal pass";
                    else return `Color filter : ${COLORS_NAME[v]} signal only`;
                } else return "Start color : ";
            },
            advanced: true
        }
    }
);
injectProperty("edge", "edgeTargetColor",{
        defaultValue:-1,
        persist:7,
        sideBar:{
            index: 5,
            options: [-1,0,1,2,3,4,5],
            labelFunc: (v)=>{
                if(loopy.globalState.colorMode===1){
                    if(parseInt(v)=== -1) return "Color converter : as is";
                    else return `Color converter : to ${COLORS_NAME[v]}`;
                } else{
                    if(parseInt(v)=== -1) return "End color : auto from start color";
                    else return `End color : ${COLORS_NAME[v]}`;
                }
            },
            advanced: true
        }
    }
);
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
    }
);

