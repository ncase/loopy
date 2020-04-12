function log(bitArray) {
    console.log(bitArray.maxOffset,binView(bitArray.rawData.buffer));
}
function saveToBinary(bitArray,objToPersist,typeIndex,entityBitSize,zAreaStartOffset){
    const toSave = [];
    for(let i in PERSIST_MODEL[typeIndex]) {
        const prop = PERSIST_MODEL[typeIndex][i];
        if(prop.bit) {
            let bitSize = prop.bit;
            if(typeof prop.bit === "function") bitSize = prop.bit();
            if(typeof toSave[i] !== "undefined") throw `collision : ${typeIndex} ${prop.name}`;
            console.log(prop.name,objToPersist[prop.name],prop.encode(objToPersist[prop.name]),Math.ceil(Math.log2(prop.encode(objToPersist[prop.name])))<=bitSize);
            toSave[i] = {value:prop.encode(objToPersist[prop.name]),bit:bitSize};
        }
    }
    const tmpBitArray = new BitArray(entityBitSize);
    toSave.forEach((e)=>tmpBitArray.append(e.value,e.bit));
    tmpBitArray.offset = 0;
    bitArray.append(tmpBitArray,entityBitSize);
}
function loadFromBinary(bitArray,typeStr,bitSize,entitiesCount) {
    const entity = {};
    const startOffset = bitArray.offset;
    log(bitArray.export(bitSize,startOffset));
    const typeIndex = objTypeToTypeIndex(typeStr);
    for(let i in PERSIST_MODEL[typeIndex]) {
        const prop = PERSIST_MODEL[typeIndex][i];
        if(prop.bit) {
            let propBitSize = prop.bit;
            if(typeof prop.bit === "function") propBitSize = Math.ceil(Math.log2(entitiesCount[0]));//FIXME: prop.bit();
            if(bitArray.offset+propBitSize>startOffset+bitSize) break;
            const rawValue = bitArray.get(propBitSize)
            entity[prop.name] = prop.decode(rawValue);
            console.log(prop.name, rawValue, entity[prop.name]);
        }
    }
    bitArray.setOffset(startOffset+bitSize);
    console.log("entity",entity);
    return entity;
}
function legacyJsonPersistProps(objToPersist) {
    const typeIndex = objTypeToTypeIndex(objToPersist);
    const persistArray = [];
    for(let i in PERSIST_MODEL[typeIndex]) persistArray[i] = PERSIST_MODEL[typeIndex][i].serializeFunc( objToPersist[PERSIST_MODEL[typeIndex][i].name]);
    return persistArray;
}
function humanReadableJsonPersistProps(objToPersist) {
    const typeIndex = objTypeToTypeIndex(objToPersist);
    const persist = {};
    for(let i in PERSIST_MODEL[typeIndex]) persist[PERSIST_MODEL[typeIndex][i].name] = PERSIST_MODEL[typeIndex][i].serializeFunc( objToPersist[PERSIST_MODEL[typeIndex][i].name]);
    return persist;
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
    const bin = stdB64ToUrl(base64EncArr(serializeToBinary(embed)));
    const json = serializeToLegacyJson(embed);
    const compressedJson = stdB64ToUrl(base64EncArr(LZMA.compress(json,9).map((v)=>v<0?v+256:v)));
    console.log(`json: ${json.length}, zjson: ${compressedJson.length}`);
    if(json.length<bin.length && json.length<compressedJson.length) return json;
    if(compressedJson.length<bin.length && compressedJson.length<json.length) return compressedJson;
    return bin;
}
function deserializeFromUrl (dataString){
    if(dataString[0]==='[') return deserializeFromLegacyJson(dataString);
    if(dataString[0]==='{') return deserializeFromHumanReadableJson(dataString);
    return deserializeFromBinary(base64DecToArr(urlToStdB64(dataString)).map((v)=>v>128?v-256:v));
    //FIXME: StringView.makeFromBase64 or StringView.base64ToBytes in place of base64DecToArr
}
function deserializeFromArrayBuffer(dataInArrayBuffer){
    const enc = new TextDecoder("utf-8");
    let content = enc.decode(dataInArrayBuffer);
    if(content[0]==='[') return deserializeFromLegacyJson(content);
    if(content[0]==='{') return deserializeFromHumanReadableJson(content);
    return deserializeFromBinary(new Uint8Array(dataInArrayBuffer));
}

function externalizeStrings(){
    // for each type (nodes, edges, labels, groups), list strings fields
    // for each element of each type and for each string fields, store stringData as key with length as value.
    // sort by length (and alphabetically if length is equal)
    // replace length by order index
    // for each element of each type and for each string fields, add element.stringFieldNameIndex = the string index
    // export the string array

    // concatenate all strings map all characters used, choose an other as separator
    // concatenate them again with the separator between each
    // BWT transform them // or BWT BWFT ZRL BWBT EC SFE MTF JBE EJBE
    // index symbols and reduce bit by symbols if the result is smaller than original

    // OR JUST concatenate them with ` as separator and hope LZMA will do the job.

    const stringFields = [];
    for(let typeIndex in EDIT_MODEL) if(EDIT_MODEL.hasOwnProperty(typeIndex))
        for(let i in EDIT_MODEL[typeIndex]) if(EDIT_MODEL[typeIndex].hasOwnProperty(i)) {
            const field = EDIT_MODEL[typeIndex][i];
            if(!field.options && !field.html) stringFields.push({type:typeIndex,fieldName:field.name});
        }

    const strings = [];
    for(let stringField of stringFields){
        const typeName = get_PERSIST_TYPE_array()[stringField["type"]]._CLASS_.toLowerCase();
        loopy.model[`${typeName}s`].forEach((item)=>strings.push(item[stringField["fieldName"]]));
    }
    const utf8string = strings.join('`');
    const stringUint8Array = (new StringView(utf8string)).rawData;
    //console.log(utf8string.length,stringUint8Array.length);
    return stringUint8Array;
}
function serializeToBinary(embed) {
    const entitiesKindsCount = 4; // nodes, edges, labels, loopys //, groups, groupPairs
    const entitiesCount = countEntities();
    const bitToRefAnyEntity = entityRefBitSize();
    const entitiesSizes = entitiesSize(true);

    let size = 10+Object.keys(entitiesCount).length*bitToRefAnyEntity+Object.keys(entitiesSizes).length*8+entitiesSizes['loopys'];//+stringArea.length*8;
    size = Math.ceil(size/8)*8;
    for (let entity in entitiesCount) size+=Math.ceil(entitiesCount[entity]/8)*8*entitiesSizes[entity];

    console.log("serializeToBinary");
    console.log(entitiesCount,entitiesSizes,entitiesKindsCount,bitToRefAnyEntity);

    const bitArray = new BitArray(size);
    bitArray.append(0,1);// Version number (This Version Start With 0, on 1bit, to allow evolution starting with 1)
    bitArray.append(1,1);// 0: withSpecific optimisations 1:padded to Bytes for better LZMA compression
    bitArray.append(embed?1:0,1);
    bitArray.append(entitiesKindsCount,4); // include loopy globals type
    bitArray.append(bitToRefAnyEntity,4);
    console.log(`entitiesCount start offset : ${bitArray.maxOffset}`);
    for (let entity in entitiesCount) bitArray.append(entitiesCount[entity],bitToRefAnyEntity+1); // exclude loopy globals type
    console.log(`entitiesSizes start offset : ${bitArray.maxOffset}`);
    for (let entity in entitiesSizes) if(entity==="loopys" || entitiesCount[entity]) bitArray.append(entitiesSizes[entity],8);
    console.log(`globals start offset : ${bitArray.maxOffset}`);
    saveToBinary(bitArray,loopy,3,entitiesSizes["loopys"],bitArray.maxOffset);

    const appendArea = (bitArray,typeStr,entitiesSizes)=>{
        const areaStart = Math.ceil(bitArray.maxOffset/8)*8;
        bitArray.setOffset(areaStart);
        console.log(`${typeStr} start offset : ${bitArray.maxOffset}`);
        loopy.model[typeStr].forEach((n)=>saveToBinary(bitArray,n,objTypeToTypeIndex(typeStr),entitiesSizes[typeStr],areaStart,true));
        bitArray.rotate(entitiesSizes[typeStr],Math.ceil(loopy.model[typeStr].length/8)*8,areaStart);
    }
    appendArea(bitArray,"nodes",entitiesSizes);
    appendArea(bitArray,"edges",entitiesSizes);
    appendArea(bitArray,"labels",entitiesSizes);
    //appendArea(bitArray,"groups",entitiesSizes);
    //appendArea(bitArray,"groupPairs",entitiesSizes);

    //console.log(`pre-compressed bin size : ${bitArray.maxOffset}b + strArea`);
    const stringArea = externalizeStrings();
    //console.log(`strArea bin size : ${stringArea.buffer.byteLength*8}b`);
    //console.log("stringArea char stats : ",Object.values(statArray(stringArea)).sort((a,b)=>a<b));

    const realBytesSize = Math.ceil(bitArray.maxOffset/8);
    console.log(`stringArea start offset : ${realBytesSize*8}`);
    const bin = new Uint8Array(realBytesSize + stringArea.buffer.byteLength);
    bin.set(new Uint8Array(bitArray.rawData.buffer,0,realBytesSize), 0);
    bin.set(stringArea, realBytesSize);

    const compressedBin = LZMA.compress(bin,9).map((v)=>v<0?v+256:v);

    function b64l(bArr){return stdB64ToUrl(base64EncArr(bArr)).length;}
    console.log(`bin: ${b64l(bin)}, zbin: ${b64l(compressedBin)},`);
    if(bin.buffer.byteLength < compressedBin.length) return bin;
    return compressedBin;
}
function deserializeFromBinary (dataUint8Array){
    console.log("deserializeFromBinary");
    const newModel = {globals:{},nodes:[],edges:[],labels:[]};
    let bin = dataUint8Array;
    if(bin[0]===93) bin = LZMA.decompress(dataUint8Array);
    bin = new BitArray(bin);
    if(bin.get(1)!==0) console.warn("hasardous unknown version"); // Version number (This Version Start With 0, on 1bit, to allow evolution starting with 1)
    if(bin.get(1)!==1) console.warn("hasardous unsupported specific optimisation"); // 0: withSpecific optimisations 1:padded to Bytes for better LZMA compression
    const embed = bin.get(1);
    const entitiesKindsCount = bin.get(4);
    const bitToRefAnyEntity = bin.get(4);
    const knownEntities = get_PERSIST_TYPE_array().map(e=>e._CLASS_.toLowerCase()+'s');
    console.log(`entitiesCount start offset : ${bin.maxOffset}`);
    const entitiesCount = [];
    for(let i=0;i<entitiesKindsCount;i++) {
        if(i===objTypeToTypeIndex('loopy')) entitiesCount[i] = 0;
        else entitiesCount[i] = bin.get(bitToRefAnyEntity+1);
        console.log(i,bin.maxOffset,objTypeToTypeIndex('loopy'));
    }
    console.log(`entitiesSizes start offset : ${bin.maxOffset}`);
    const entitiesSizes = [];
    for (let i=0;i<entitiesKindsCount;i++) if(knownEntities[i]==="loopys" || entitiesCount[i]) entitiesSizes[i] = bin.get(8);

    console.log(entitiesCount,entitiesSizes,entitiesKindsCount,bitToRefAnyEntity);

    console.log(`globals start offset : ${bin.maxOffset}`);
    newModel.globals = loadFromBinary(bin,"loopy",entitiesSizes[3],entitiesCount);
    newModel.globals.embed = embed;

    const extractArea = (bitArray,typeStr,entitiesSizes,entitiesCount)=>{
        const areaStart = Math.ceil(bitArray.maxOffset/8)*8;
        bitArray.setOffset(areaStart);
        console.log(`${typeStr} start offset : ${bitArray.maxOffset}`);
        const typeIndex = objTypeToTypeIndex(typeStr);
        bitArray.rotate(Math.ceil(entitiesCount[typeIndex]/8)*8,entitiesSizes[typeIndex],areaStart);
        bitArray.setOffset(areaStart);
        const entities = [];
        for(let i=0;i<entitiesCount[typeIndex];i++) entities.push(loadFromBinary(bitArray,typeStr,entitiesSizes[typeIndex],entitiesCount));
        newModel[typeStr] = entities;
    }
    extractArea(bin,"nodes",entitiesSizes,entitiesCount);
    extractArea(bin,"edges",entitiesSizes,entitiesCount);
    extractArea(bin,"labels",entitiesSizes,entitiesCount);
    //extractArea(bin,"groups",entitiesSizes,entitiesCount);
    //extractArea(bin,"groupPairs",entitiesSizes,entitiesCount);


    let size = 10+entitiesKindsCount*bitToRefAnyEntity+Object.keys(entitiesSizes).length*8+entitiesSizes[objTypeToTypeIndex('loopys')];
    size = Math.ceil(size/8)*8;
    for (let entity in entitiesCount) size+=Math.ceil(entitiesCount[entity]/8)*8*entitiesSizes[entity];
    const strAreaStart = Math.ceil(size/8)*8;
    console.log(`stringArea start offset : ${strAreaStart}`);

    console.log(newModel);

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
function countEntities(){
    const types = get_PERSIST_TYPE_array().map(t=>`${t._CLASS_.toLowerCase()}s`);
    const entities = {};
    types.filter(t=>loopy.model[t]).forEach(t=>entities[t]=loopy.model[t].length);
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
