
// Label features
injectProperty("label", "x",{persist:{index:0,binFunc:factoryRatioForXY(),serializeFunc:v=>Math.round(v)}});
injectProperty("label", "y",{persist:{index:1,binFunc:factoryRatioForXY(),serializeFunc:v=>Math.round(v)}});
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
    immutableDefault:true,
    persist:{
        index:2,
        deserializeFunc:decodeURIComponent
    },
    sideBar:{
        index: 3,
        label: "Label :",
        textarea:true
    }
});
injectProperty("label", "href",{
    defaultValue:"",
    immutableDefault:true,
    persist:{
        index:5,
        deserializeFunc:decodeURIComponent
    },
    sideBar:{
        index: 4,
        label: "Clickable ? Add an Url :",
        advanced: true
    }
});
