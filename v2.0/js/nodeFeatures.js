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
