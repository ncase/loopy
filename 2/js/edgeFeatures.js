// Edge features
const bitToRefAnything = (b)=>b;
injectProperty("edge", "from",{persist:{index:0,binFunc:{bit:bitToRefAnything,encode:(v)=>v.id,decode:(v)=>v},serializeFunc:(v)=>v.id}});
injectProperty("edge", "to",{persist:{index:1,binFunc:{bit:bitToRefAnything,encode:(v)=>v.id,decode:(v)=>v},serializeFunc:(v)=>v.id}});
injectProperty("edge", "arc",{persist:{index:2,binFunc:factoryRatio(10,2048,true),serializeFunc:v=>Math.round(v)}});
injectProperty("edge", "rotation",{persist:{index:4,binFunc:factoryRatio(4,360),serializeFunc:v=>Math.round(v)}});
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
            "allow only negative",// remove (invert can do it)
            "allow only positive",
            "convert to negative", // remove (invert can do it)
            "convert to positive",
        ][v]}`,
        advanced: true
    }
});

injectProperty("edge", "filter",{
    defaultValue:0,
    persist:10,
    sideBar:{
        index: 3,
        options: [0, 1, 2, 3, 4, 5],
        labelFunc: (v)=>[
            "Allow : any signal",
            "Allow : only arrow signal", // ⬍ ⮃
            "Allow : only death signal", // ☠ 💀 🕱
            "Allow : only life signal", // ❀ 🏵
            "Allow : death & life signal",
            "Allow : randomly some signal", // 🎲
        ][v],
        advanced: true
    }
});
injectProperty("edge", "quantitative",{
    defaultValue:0,
    persist:9,
    sideBar:{
        index: 4,
        options: [0, 1, 2],
        labelFunc: (v)=>[
            "Signal : input as tendency",
            "Signal : input as quantity",
            "Signal : output as vital change"
        ][v],
        advanced: true
    }
});

const COLORS_NAME = ["red", "orange", "yellow", "green", "blue", "purple"];
injectProperty("edge", "edgeFilterColor",{
    defaultValue:-1,
    persist:6,
    sideBar:{
        index: 5,
        options: [-1,0,1,2,3,4,5],
        labelFunc: (v)=>{
            if(loopy.colorLogic===1){
                if(parseInt(v)=== -1) return "Color filter : all color signal pass";
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
        index: 6,
        options: [-1,0,1,2,3,4,5,-2,-3],
        labelFunc: (v)=>{
            if(loopy.colorLogic===1){
                if(parseInt(v)=== -1) return "Color conversion : none";
                if(parseInt(v)=== -2) return "Color conversion : to random";
                if(parseInt(v)=== -3) return "Signal color to node color";
                return `Color conversion : to ${COLORS_NAME[v]}`;
                // convert to random color (from target output allowed color) (colorLogic only)
                // convert node to signal color (colorLogic only)
            } else{
                if(parseInt(v)=== -1) return "End color : auto from start color";
                if(parseInt(v)=== -2) return "End color : rainbow";
                if(parseInt(v)=== -3) return "End color : black double arrow";
                return `End color : ${COLORS_NAME[v]}`;
            }
        },
        advanced: true,
        colorLogic: true
    }
});
injectProperty("edge", "customLabel",{
    defaultValue:"",
    persist:{
        index:8,
        deserializeFunc:decodeURIComponent
    },
    sideBar:{
        index: 90,
        label: "Custom name :", // ⚙
        advanced: true
    }
});
injectProperty("edge", "lengthInfoDetail",{
    sideBar:{
        index: 99,
        simpleOnly: true,
        html:`(to make a stronger relationship, draw multiple arrows!)
            <br><br>(to make a delayed relationship, draw longer arrow : <span class="component_label"></span>)`,
        labelFunc: (v,edge)=>`${(edge.getArrowLength()/240).toPrecision(2)}s`,
    }
});
injectProperty("edge", "lengthInfoEssential",{
    sideBar:{
        index: 98,
        advanced: true,
        html:`Stronger link : multiple arrows
            <br>Delay signal : longer arrow
            <br/>Signal thru this arrow : <span class="component_label"></span>`,
        labelFunc: (v,edge)=>`${(edge.getArrowLength()/240).toPrecision(3)}s`,
    }
});
