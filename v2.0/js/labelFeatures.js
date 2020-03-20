
// Label features
injectProperty("label", "visibility",{
    defaultValue:0,
    persist:3,
    sideBar:{
        index: 1,
        options: [0,1],
        labelFunc: (v)=>`Show : ${v===1?'only in edit mode':'always'}`,
        advanced: true
    }
});
injectProperty("label", "text",{
    defaultValue:"...",
    persist:{
        index:2,
        serializeFunc:(v)=>encodeURIComponent(encodeURIComponent(v)),
        deserializeFunc:decodeURIComponent
    },
    sideBar:{
        index: 2,
        label: "Label :",
        textarea:true
    }
});
