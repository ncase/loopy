// A loopy implementation of SOLID Open–closed principle
const PERSIST_MODEL = [];
const EDIT_MODEL = [];

/*
onNodeInit
onNodeTakeSignal
onNodeSendSignal
onEdgeAddSignal
onLoopyInit
onPlayReset

 */

/**
 *
 * @param objType : Object class like LoopyNode, Edge or Loopy
 * @param propertyName: String, name of the property
 * @param config : Object with optional : defaultValue, immutableDefault, persist*1, sideBar*2
 * *1 : if no persist Object given => don't persist this property
 * persist = {index, [serializeFunc], [deserializeFunc]}
 * *2 :
 * sideBar = {
 *   index,
 *   options: slider enum,
 *   label: string || func,
 *   advanced: boolean
 * }
 *
 */
function injectProperty(objType,propertyName,config={}) {
    let typeIndex = objTypeToTypeIndex(objType);
    objType = get_PERSIST_TYPE_array()[typeIndex];

    if(!objType.default) objType.default = {};
    if(typeof config.defaultValue === "undefined") config.defaultValue = 0;
    if(typeof objType.default[propertyName] !== "undefined") throw `objType.default[propertyName] collision with ${propertyName}`;
    objType.default[propertyName] = config.defaultValue;
    if(!EDIT_MODEL[typeIndex]) EDIT_MODEL[typeIndex] = [];
    if(config.sideBar){
        if(EDIT_MODEL[typeIndex][config.sideBar.index]) throw `sideBar position collision : ${config.sideBar.index} ${propertyName}`;

        const sideBarData = config.sideBar;
        sideBarData.name = propertyName;
        sideBarData.defaultValue = config.defaultValue;
        EDIT_MODEL[typeIndex][config.sideBar.index] = sideBarData;

        //noinspection JSUnresolvedVariable
        if(!config.immutableDefault) EDIT_MODEL[typeIndex][config.sideBar.index].updateDefault = (value)=> objType.default[propertyName] = value;
    }


    if(typeof config.persist !== "undefined"){
        if(typeof config.persist !== "object" && isFinite(parseInt(config.persist))) config.persist = {index:config.persist};
        if(isNaN(parseInt(config.persist.index))) throw `in injectProperty, if config.persist, config.persist.index is required`;
        if(!PERSIST_MODEL[typeIndex]) PERSIST_MODEL[typeIndex] = [];
        if(PERSIST_MODEL[typeIndex][config.persist.index]) throw `config.persist.index collision : ${JSON.stringify(PERSIST_MODEL[typeIndex][config.persist.index])}`;
        const persist = {name:propertyName,jsonOnly:config.persist.jsonOnly};

        persist.serializeFunc = config.persist.serializeFunc?config.persist.serializeFunc:(v)=>v;
        persist.deserializeFunc = config.persist.deserializeFunc?config.persist.deserializeFunc:(v)=>v;
        persist.defaultValue = config.defaultValue;
        persist.bit = config.persist.bit?config.persist.bit:
            config.persist.binFunc?config.persist.binFunc.bit:
                config.sideBar?config.sideBar.options?Math.ceil(Math.log2(config.sideBar.options.length)):0:0;
        if(!persist.jsonOnly){
            persist.encode = config.persist.binFunc? config.persist.binFunc.encode:(v)=>config.sideBar.options.indexOf(v);
            persist.decode = config.persist.binFunc? config.persist.binFunc.decode:(v)=>config.sideBar.options[v];
        }
        PERSIST_MODEL[typeIndex][config.persist.index] = persist;
    }

}
function injectPropsInSideBar(page,typeIndex){
    for(let i in EDIT_MODEL[typeIndex]) if(EDIT_MODEL[typeIndex].hasOwnProperty(i)){
        const feat = EDIT_MODEL[typeIndex][i];
        const componentConfig = feat;
        componentConfig.bg = feat.name;
        if(feat.options) page.addComponent(feat.name, new ComponentSlider(componentConfig));
        else if(feat.html) page.addComponent(feat.name, new ComponentHTML(componentConfig));
        else page.addComponent(feat.name, new ComponentInput(componentConfig));
    }
}
function injectPropsUpdateDefault(component, value){
    const typeIndex = objTypeToTypeIndex(component.page.id);
    for(let i in EDIT_MODEL[typeIndex]) if(EDIT_MODEL[typeIndex].hasOwnProperty(i)){
        const feat = EDIT_MODEL[typeIndex][i];
        if(feat.name === component.propName && feat.updateDefault) feat.updateDefault(value)
    }
}
function injectPropsLabelInSideBar(page,typeIndex){
    for(let i in EDIT_MODEL[typeIndex]) if(EDIT_MODEL[typeIndex].hasOwnProperty(i)){
        const feat = EDIT_MODEL[typeIndex][i];
        const component = page.getComponent(feat.name);
        if(parseInt(typeIndex)===3){ //if loopy/global, init
            if(feat.oninput) feat.oninput(page.target, page.target[feat.name]);
            component.show();
        }

        if(parseInt(typeIndex)===0){ //if node, set BG Color
            component.setBGColor(LoopyNode.COLORS[page.target.hue]);
        }
        if(feat.labelFunc) component.dom.querySelector('.component_label').innerHTML = feat.labelFunc(page.target[feat.name],page.target);
    }
}
function injectedDefaultProps(targetConfig,typeIndex) {
    const objType = get_PERSIST_TYPE_array()[typeIndex];
    for(let i in objType.default) if(objType.default.hasOwnProperty(i)){
        targetConfig[i]=objType.default[i];
    }
}

function applyInitialPropEffects(element) {
    const typeIndex = objTypeToTypeIndex(element);
    for(let i in EDIT_MODEL[typeIndex]) {
        if(EDIT_MODEL[typeIndex][i].oninput) EDIT_MODEL[typeIndex][i].oninput({page:{target:element}},element[i]);
    }
}
function get_PERSIST_TYPE_array() {
    return [
        LoopyNode,
        Edge,
        Label,
        Loopy,
        //Group,
        //GroupPair,
    ];
}
function objTypeToTypeIndex(objType) {
    if(typeof objType === "object") objType = objType._CLASS_;
    const PERSIST_TYPE = get_PERSIST_TYPE_array();
    for(let i in PERSIST_TYPE) if(PERSIST_TYPE.hasOwnProperty(i)){
        if(
            objType===i
            || objType===PERSIST_TYPE[i]
            || objType===PERSIST_TYPE[i].name
            || objType===PERSIST_TYPE[i].name+'s'
            || objType===PERSIST_TYPE[i].name.toLowerCase()
            || objType===PERSIST_TYPE[i].name.toLowerCase()+'s'
            || objType===PERSIST_TYPE[i]._CLASS_
            || objType===PERSIST_TYPE[i]._CLASS_+'s'
            || objType===PERSIST_TYPE[i]._CLASS_.toLowerCase()
            || objType===PERSIST_TYPE[i]._CLASS_.toLowerCase()+'s'
        ) return parseInt(i);
    }
    return 3; // default : Loopy global state
    //throw `${objType} unknown`;
}
