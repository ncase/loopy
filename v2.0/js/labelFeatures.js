
// Label features
injectProperty("label", "textColor",{
    defaultValue:-1,
    persist:4,
    sideBar:{
        index: 1,
        options: [-1,0,1,2,3,4,5],
        label: "Text color :",
        advanced: true
    }
});
injectProperty("label", "visibility",{
    defaultValue:0,
    persist:3,
    sideBar:{
        index: 2,
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
        index: 3,
        label: "Label :",
        textarea:true
    }
});
