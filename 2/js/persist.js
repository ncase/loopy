function log(bitArray) {
    console.log(bitArray.maxOffset,binView(bitArray.rawData.buffer));
}
function saveToBinary(bitArray,objToPersist,typeIndex,entityBitSize){
    const toSave = [];
    for(let i in PERSIST_MODEL[typeIndex]) {
        const prop = PERSIST_MODEL[typeIndex][i];
        if(prop.bit) {
            let bitSize = prop.bit;
            if(typeof prop.bit === "function") bitSize = prop.bit();
            if(typeof toSave[i] !== "undefined") throw `collision : ${typeIndex} ${prop.name}`;
            toSave[i] = {value:prop.encode(objToPersist[prop.name]),bit:bitSize};
        }
    }
    const tmpBitArray = new BitArray(entityBitSize);
    toSave.forEach((e)=>tmpBitArray.append(e.value,e.bit));
    tmpBitArray.offset = 0;
    bitArray.append(tmpBitArray,entityBitSize);
}
function loadFromBinary(bitArray,typeIndex,bitSize,entitiesCount) {
    const entity = {};
    const startOffset = bitArray.offset;
    for(let i in PERSIST_MODEL[typeIndex]) {
        const prop = PERSIST_MODEL[typeIndex][i];
        if(prop.bit) {
            let propBitSize = prop.bit;
            if(typeof prop.bit === "function") propBitSize = Math.ceil(Math.log2(entitiesCount[0]));//FIXME: prop.bit();
            if(bitArray.offset+propBitSize>startOffset+bitSize) break;
            const rawValue = bitArray.get(propBitSize)
            entity[prop.name] = prop.decode(rawValue);
        }
    }
    bitArray.setOffset(startOffset+bitSize);
    return entity;
}
function humanReadableJsonPersistProps(objToPersist) {
    const typeIndex = objTypeToTypeIndex(objToPersist);
    const persist = {};
    for(let i in PERSIST_MODEL[typeIndex]) persist[PERSIST_MODEL[typeIndex][i].name] = PERSIST_MODEL[typeIndex][i].serializeFunc( objToPersist[PERSIST_MODEL[typeIndex][i].name]);
    return persist;
}
function legacyJsonPersistProps(objToPersist) {
    const typeIndex = objTypeToTypeIndex(objToPersist);
    const persistArray = [];
    for(let i in PERSIST_MODEL[typeIndex]) persistArray[i] = PERSIST_MODEL[typeIndex][i].serializeFunc( objToPersist[PERSIST_MODEL[typeIndex][i].name]);
    return persistArray;
}
function legacyJsonRestoreProps(srcArray, targetConfig, typeIndex) {
    // include in targetConfig
    for(let i in PERSIST_MODEL[typeIndex]) {
        //if(typeof targetConfig[PERSIST_MODEL[typeIndex][i].name] !== "undefined" && parseInt(typeIndex)!==3) throw `collision : ${typeIndex} ${PERSIST_MODEL[typeIndex][i].name}`; // except for loopy globals
        if(typeof srcArray[i] !== "undefined" && srcArray[i] !== null)
            targetConfig[PERSIST_MODEL[typeIndex][i].name] = PERSIST_MODEL[typeIndex][i].deserializeFunc( srcArray[i] );
    }
    return targetConfig;
}
function legacyIdFix(newModel){
    newModel.nodes.forEach((n,i)=>{
        if(n.id && n.id !== i){
            const oldId = n.id;
            const newId = i;
            n.id = newId;
            newModel.edges.forEach(edge=>{
                if(edge.from===oldId) edge.from=newId;
                if(edge.to===oldId) edge.to=newId;
            });
        }
    });
}

function serializeToUrl (embed){
    const alternatives = []
    console.log('tiny');
    alternatives.push(stdB64ToUrl(binToB64(serializeToBinary(embed,false,false))));
    console.log('size8');
    alternatives.push(stdB64ToUrl(binToB64(serializeToBinary(embed,true,false))));
    console.log('count8');
    alternatives.push(stdB64ToUrl(binToB64(serializeToBinary(embed,false,true))));
    console.log('8x8');
    alternatives.push(stdB64ToUrl(binToB64(serializeToBinary(embed,true,true))));
    alternatives.push(serializeToLegacyJson(embed));
    alternatives.push(stdB64ToUrl(binToB64(LZMA.compress(serializeToLegacyJson(embed),9).map((v)=>v<0?v+256:v))));

    const json = serializeToLegacyJson(embed);
    const compressedJson = stdB64ToUrl(binToB64(LZMA.compress(json,9).map((v)=>v<0?v+256:v)));
    console.log(`json: ${json.length}, zjson: ${compressedJson.length}`);
    console.log(`hrJson: ${serializeToHumanReadableJson(embed).length}, zhrJson: ${stdB64ToUrl(binToB64(LZMA.compress(serializeToHumanReadableJson(embed),9).map((v)=>v<0?v+256:v))).length}`);
    const minSized = alternatives.reduce((acc,cur)=>{return cur.length>acc.size?acc:{size:cur.length,content:cur};},{size:+Infinity,content:''});
    console.log(`selected size : ${minSized.size}`);
    return minSized.content;
}
function deserializeFromUrl (dataString){
    if(dataString[0]==='[') return deserializeFromLegacyJson(dataString);
    if(dataString[0]==='{') return deserializeFromHumanReadableJson(dataString);
    return deserializeFromBinary(b64ToBin(urlToStdB64(dataString)).map((v)=>v>128?v-256:v));
}
function deserializeFromArrayBuffer(dataInArrayBuffer){
    const enc = new TextDecoder("utf-8");
    let content = enc.decode(dataInArrayBuffer);
    if(content[0]==='[') return deserializeFromLegacyJson(content);
    if(content[0]==='{') return deserializeFromHumanReadableJson(content);
    return deserializeFromBinary(new Uint8Array(dataInArrayBuffer));
}

function listStringFields() {
    const stringFields = [];
    for(let typeIndex in EDIT_MODEL) if(EDIT_MODEL.hasOwnProperty(typeIndex))
        for(let i in EDIT_MODEL[typeIndex]) if(EDIT_MODEL[typeIndex].hasOwnProperty(i)) {
            const field = EDIT_MODEL[typeIndex][i];
            if(!field.options && !field.html) stringFields.push({type:typeIndex,fieldName:field.name});
        }
    return stringFields;
}
function externalizeStrings(){
    const stringFields = listStringFields();
    const strings = [];
    for(let stringField of stringFields){
        const typeName = get_PERSIST_TYPE_array()[stringField["type"]]._CLASS_.toLowerCase();
        loopy.model[`${typeName}s`].forEach((item)=>strings.push(item[stringField["fieldName"]]));
    }
    const utf8string = strings.join('`');
    const stringUint8Array = (new StringView(utf8string)).rawData;
    return stringUint8Array;
}
function restoreStrings(bitArray, newModel) {
    const areaStart = bitArray.offset/8;
    const areaEnd = bitArray.rawData.buffer.byteLength;
    const bin = new Uint8Array(areaEnd-areaStart);
    bin.set(new Uint8Array(bitArray.rawData.buffer,areaStart,areaEnd-areaStart), 0);
    const utf8string = (new StringView(bin)).toString();
    const strings = utf8string.split('`');
    const stringFields = listStringFields();
    for(let stringField of stringFields){
        const typeName = get_PERSIST_TYPE_array()[stringField["type"]]._CLASS_.toLowerCase();
        newModel[`${typeName}s`].forEach((item)=>item[stringField["fieldName"]] = strings.shift());
    }
}
function appendArea (bitArray,typeStr,entitiesSizes,entitiesCountVolume,bytesAlignSection=true){
    const areaStart = bytesAlignSection?Math.ceil(bitArray.maxOffset/8)*8:bitArray.maxOffset;
    bitArray.setOffset(areaStart);
    loopy.model[typeStr].forEach((n)=>saveToBinary(bitArray,n,objTypeToTypeIndex(typeStr),entitiesSizes[typeStr]));
    bitArray.setOffset(areaStart);
    bitArray.rotate(entitiesSizes[typeStr],entitiesCountVolume[typeStr]);
}
function extractArea (bitArray,typeStr,entitiesSizes,entitiesCount,entitiesCountVolume,bytesAlignSection=true){
    const areaStart = bytesAlignSection?Math.ceil(bitArray.maxOffset/8)*8:bitArray.maxOffset;
    bitArray.setOffset(areaStart);
    const typeIndex = objTypeToTypeIndex(typeStr);
    if(!entitiesCount[typeIndex]) return [];
    bitArray.rotate(entitiesCountVolume[typeIndex],entitiesSizes[typeIndex],areaStart);
    bitArray.setOffset(areaStart);
    const entities = [];
    for(let i=0;i<entitiesCount[typeIndex];i++) entities.push(loadFromBinary(bitArray,typeIndex,entitiesSizes[typeIndex],entitiesCount));
    bitArray.setOffset(areaStart + entitiesCountVolume[typeIndex] * entitiesSizes[typeIndex]);
    return entities;
}
function serializeToBinary(embed, bytesSize=true,bytesEntitiesCount=true,bytesAlignSection=true) {
    const entitiesKindsCount = 4; // nodes, edges, labels, loopys //, groups, groupPairs
    const entitiesCount = countEntities();
    const entitiesCountVolume = countEntities(bytesEntitiesCount);
    const bitToRefAnyEntity = entityRefBitSize();
    const entitiesSizes = entitiesSize(bytesSize);

    let size = 11;
    size+=Object.keys(entitiesCount).length*(bitToRefAnyEntity+1);
    size+=Object.keys(entitiesSizes).length*8+entitiesSizes['loopys'];//+stringArea.length*8;
    if(bytesAlignSection) size = Math.ceil(size/8)*8;
    for (let entity in entitiesCount) size+=entitiesCountVolume[entity]*entitiesSizes[entity];

    const bitArray = new BitArray(size);
    bitArray.append(0,1);// Version number (This Version Start With 0, on 1bit, to allow evolution starting with 1)
    bitArray.append(bytesEntitiesCount?1:0,1); // 0: count = volume 1:padded to Bytes for better LZMA compression
    bitArray.append(embed?1:0,1);
    bitArray.append(entitiesKindsCount,4); // include loopy globals type
    bitArray.append(bitToRefAnyEntity,4);
    for (let entity in entitiesCount) bitArray.append(entitiesCount[entity],bitToRefAnyEntity+1); // exclude loopy globals type
    for (let entity in entitiesSizes) if(entity==="loopys" || entitiesCount[entity]) bitArray.append(entitiesSizes[entity],8);
    saveToBinary(bitArray,loopy,3,entitiesSizes["loopys"],bitArray.maxOffset);

    appendArea(bitArray,"nodes",entitiesSizes,entitiesCountVolume,bytesAlignSection);
    appendArea(bitArray,"edges",entitiesSizes,entitiesCountVolume,bytesAlignSection);
    appendArea(bitArray,"labels",entitiesSizes,entitiesCountVolume,bytesAlignSection);
    //appendArea(bitArray,"groups",entitiesSizes);
    //appendArea(bitArray,"groupPairs",entitiesSizes);

    const stringArea = externalizeStrings();

    const realBytesSize = Math.ceil(bitArray.maxOffset/8);
    const bin = new Uint8Array(realBytesSize + stringArea.buffer.byteLength);
    bin.set(new Uint8Array(bitArray.rawData.buffer,0,realBytesSize), 0);
    bin.set(stringArea, realBytesSize);

    const compressedBin = LZMA.compress(bin,9).map((v)=>v<0?v+256:v);

    if(bin.buffer.byteLength < compressedBin.length) return bin;
    return compressedBin;
}
function deserializeFromBinary (dataUint8Array){
    const newModel = {globals:{},nodes:[],edges:[],labels:[]};
    let bin = dataUint8Array;
    if(bin[0]===93) bin = LZMA.decompress(dataUint8Array);
    bin = new BitArray(bin);
    if(bin.get(1)!==0) console.warn("hazardous unknown version"); // Version number (This Version Start With 0, on 1bit, to allow evolution starting with 1)
    const bytesEntitiesCount = bin.get(1);
    const embed = bin.get(1);
    const entitiesKindsCount = bin.get(4);
    const bitToRefAnyEntity = bin.get(4);
    const knownEntities = get_PERSIST_TYPE_array().map(e=>e._CLASS_.toLowerCase()+'s');
    const entitiesCount = [];
    for(let i=0;i<entitiesKindsCount;i++) {
        if(i===objTypeToTypeIndex('loopy')) entitiesCount[i] = 0;
        else entitiesCount[i] = bin.get(bitToRefAnyEntity+1);
    }
    const entitiesCountVolume=bytesEntitiesCount?entitiesCount.map(n=>Math.ceil(n/8)*8):entitiesCount;
    const entitiesSizes = [];
    for (let i=0;i<entitiesKindsCount;i++) if(knownEntities[i]==="loopys" || entitiesCount[i]) entitiesSizes[i] = bin.get(8);

    newModel.globals = loadFromBinary(bin,objTypeToTypeIndex("loopy"),entitiesSizes[3],entitiesCount);
    newModel.globals.embed = embed;

    newModel.nodes = extractArea(bin,"nodes",entitiesSizes,entitiesCount,entitiesCountVolume);
    newModel.edges = extractArea(bin,"edges",entitiesSizes,entitiesCount,entitiesCountVolume);
    newModel.labels = extractArea(bin,"labels",entitiesSizes,entitiesCount,entitiesCountVolume);
    //extractArea(bin,"groups",entitiesSizes,entitiesCount);
    //extractArea(bin,"groupPairs",entitiesSizes,entitiesCount);

    restoreStrings(bin, newModel);
    return newModel;
}
function serializeToLegacyJson(embed){
    const data = [];
    data.push(loopy.model.nodes.map(n=>legacyJsonPersistProps(n)));  // 0 - nodes
    data.push(loopy.model.edges.map(n=>legacyJsonPersistProps(n)));  // 1 - edges
    data.push(loopy.model.labels.map(n=>legacyJsonPersistProps(n))); // 2 - labels
    loopy.embed = embed;
    data.push(legacyJsonPersistProps(loopy));                        // 3 - globalState (including UID)
    delete loopy.embed;
    return JSON.stringify(data);
}
function deserializeFromLegacyJson (dataString){
    const data = JSON.parse(dataString);
    const newModel = {globals:{},nodes:[],edges:[],labels:[]};
    // Get from array!
    const nodes = data[0];
    const edges = data[1];
    const labels = data[2];
    const globalState = data[3];
    for(let i=0;i<nodes.length;i++) newModel.nodes.push(legacyJsonRestoreProps(nodes[i],{},objTypeToTypeIndex("node")));
    for(let i=0;i<edges.length;i++) newModel.edges.push(legacyJsonRestoreProps(edges[i],{},objTypeToTypeIndex("edge")));
    for(let i=0;i<labels.length;i++) newModel.labels.push(legacyJsonRestoreProps(labels[i],{},objTypeToTypeIndex("label")));
    // META.
    const importArray = typeof globalState === "object"?globalState:[globalState];
    newModel.globals.embedded = loopy.embedded?1:importArray[3];
    newModel.globals = legacyJsonRestoreProps(importArray,newModel.globals,objTypeToTypeIndex("loopy"));

    legacyIdFix(newModel);
    return newModel;
}
function serializeToHumanReadableJson(embed){
    const json = {
        globals:humanReadableJsonPersistProps(loopy),
        nodes:loopy.model.nodes.map(n=>humanReadableJsonPersistProps(n)),
        edges:loopy.model.edges.map(n=>humanReadableJsonPersistProps(n)),
        labels:loopy.model.labels.map(n=>humanReadableJsonPersistProps(n))
    };
    if(embed) json.globals.embed=true;
    return JSON.stringify(json);
}
function deserializeFromHumanReadableJson (dataString){
    return JSON.parse(dataString);
}


const RECURRENT_LZMA_SCHEME = "XQAAAAISAAAAAAAAAAAt";
function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}
function urlToStdB64(urlStr) {
    let b64 = urlStr;
    const parts = urlStr.split("/");
    if(parts.length===2){
        b64 = RECURRENT_LZMA_SCHEME;
        let lastDifferencePos = 0;
        for(let i = 0; i< parts[0].length;i+=2) {
            const position = parseInt(parts[0][i])+lastDifferencePos;
            b64 = setCharAt(b64,position,parts[0][i+1]);
            lastDifferencePos=position;
        }
        b64 += parts[1];
    }
    return b64.split('_').join('+').split('-').join('/').split('.').join('=');
}
function stdB64ToUrl(b64){
    b64 = b64.split('+').join('_').split('/').join('-').split('=').join('.').replace(/[^-_.a-zA-Z0-9]/g,'');
    let start = '';
    let lastDifferencePos = 0;
    for(let i =0; i<RECURRENT_LZMA_SCHEME.length; i++){
        if(b64[i]!==RECURRENT_LZMA_SCHEME[i]){
            let pos = i-lastDifferencePos;
            while(pos>9){
                start+=`${9}${b64[lastDifferencePos+9]}`;
                lastDifferencePos += 9;
                pos = i-lastDifferencePos;
            }
            lastDifferencePos = i;
            start+=`${pos}${b64[i]}`;
        }
    }
    const diffStartVersion =`${start}/${b64.substr(RECURRENT_LZMA_SCHEME.length)}`;
    if(diffStartVersion.length<b64.length) return diffStartVersion;
    else return b64;
}
function binToB64(arr){
    return (new StringView(arr)).toBase64();
}
function b64ToBin(b64) {
    return StringView.makeFromBase64(b64).rawData;
}
function factoryRatio(bitNumber,ratioRef,signed=false){
    if (signed) return {
        bit: bitNumber,
        encode: (v) => Math.min(Math.pow(2, bitNumber)-1, Math.max(0, Math.round(Math.pow(2, bitNumber-1) * v / ratioRef) + Math.pow(2, bitNumber-1))),
        decode: (v) => Math.round((v - Math.pow(2, bitNumber-1)) * ratioRef / Math.pow(2, bitNumber-1))
    };
    else return {
        bit: bitNumber,
        encode: (v) => Math.min(Math.pow(2, bitNumber)-1, Math.max(0, Math.round(Math.pow(2, bitNumber) * v / ratioRef))),
        decode: (v) => Math.round(v * ratioRef / Math.pow(2, bitNumber))
    };
}
function countEntities(ceil8=false){
    const types = get_PERSIST_TYPE_array().map(t=>`${t._CLASS_.toLowerCase()}s`);
    const entities = {};
    types.filter(t=>loopy.model[t]).forEach(t=>entities[t]=loopy.model[t].length);
    if(ceil8) for(let i in entities)entities[i]=Math.ceil(entities[i]/8)*8;
    return entities;
}
function entityRefBitSize(){
    const entitiesCount = countEntities();
    const maxEntities = Object.values(entitiesCount).reduce((acc,cur)=>Math.max(acc,cur),1);
    return Math.ceil(Math.log2(maxEntities));
}
function entitiesSize(ceil8=false){
    const types = get_PERSIST_TYPE_array().map(t=>`${t._CLASS_.toLowerCase()}s`);
    const entities = {};
    for(let i in PERSIST_MODEL)
        PERSIST_MODEL.forEach((t,i)=>entities[types[i]]=t.reduce((acc,cur)=>acc+(typeof cur.bit==="function"?cur.bit():cur.bit)||acc,0));
    if(ceil8) for(let i in entities)entities[i]=Math.ceil(entities[i]/8)*8;
    return entities;
}
function binView(buffer,compactness=true){
    const view = new Uint8Array(buffer);
    let str = "";
    for(let i in view){
        const bin = view[i].toString(2);
        let pad = '';
        for (let i=8;i>bin.length;i--) pad = `0${pad}`;
        str = `${str}${pad}${bin} `;
    }
    // compactView
    if(!compactness) return str.trim();
    else {
        let compactStr = '';
        const emptyBytes = str.split('00000000 ');
        let empty = 0;
        let i=0;
        for(i in emptyBytes){
            if(i>0) empty+=8;
            if(emptyBytes[i]!==''){
                if(empty>0) compactStr=`${compactStr}[0:${empty}b] ${emptyBytes[i]}`;
                else compactStr=`${compactStr}${emptyBytes[i]}`;
                empty=0;
            }
        }
        if(empty>0) compactStr=`${compactStr}[0:${empty}b] ${emptyBytes[i]}`;
        return compactStr.trim();
    }
}
