const name = "aggregationLatency";
injectProperty("node", name,{
    defaultValue:0,
    persist:7,
    sideBar:{
        index: 5,
        options: [ 0, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4],
        labelFunc: (v)=>"Aggregation latency : "+v+"s",
        advanced: true
    }
}
);