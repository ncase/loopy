// Edge features
injectProperty("edge", "strength",{
    defaultValue:1,
    persist:3,
    sideBar:{
        index: 1,
        options: [1,-1],
        labelFunc: (v)=>`Relationship : ${v===1?'same':'invert'} effect`,
        simpleOnly: true
    }
});

injectProperty("edge", "signBehavior",{
    defaultValue:0,
    persist:5,
    sideBar:{
        index: 2,
        options: [0,1,2,3,4,5],
        labelFunc: (v,obj)=>`<sup title="Relationship state in simple mode">${obj.strength>0?'+':'–'} </sup>Valency : ${[
            "preserved",
            "inverted",
            "allow only negative",
            "allow only positive",
            "convert to negative",
            "convert to positive",
        ][v]}`,
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
                if(parseInt(v)=== -1) return "Color conversion : as is";
                else return `Color conversion : to ${COLORS_NAME[v]}`;
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
        index: 98,
        label: "Custom name :",
        advanced: true
    }
});
injectProperty("edge", "lengthInfo",{
    sideBar:{
        index: 99,
        html:`(to make a stronger relationship, draw multiple arrows!)
            <br><br>(to make a delayed relationship, draw longer arrows)`
    }
});
