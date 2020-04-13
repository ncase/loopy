/** stdB64ToUrl and urlToStdB64 */ {
testEqual(`more url friendly chr (especially + => _)`, "-_.", async ()=>stdB64ToUrl("/+=") );
testEqual(`compact usual LZMA header`, "/plop", async ()=>stdB64ToUrl("XQAAAAISAAAAAAAAAAAtplop") );
testEqual(`compact usual LZMA header with changes`, "9A6B/plop", async ()=>stdB64ToUrl("XQAAAAISAAAAAAABAAAtplop") );
testEqual(`b64 url conversion`, "XQAAAAISAAAAAAAAAAAkplop/+==", async ()=>urlToStdB64(stdB64ToUrl("XQAAAAISAAAAAAAAAAAkplop/+==")) );
}
/** factoryRatio encode decode */ {
testEqual(`factoryRatio encode decode back as close as possible to the original`, 42, async ()=>{
    const bits = 6;
    const data = 42
    const f = factoryRatio(bits,100);
    return f.decode((new BitArray(bits)).append(f.encode(data),bits).get(bits,0));
} );
testEqual(`factoryRatio encode decode back as close as possible to the original`, 42, async ()=>{
    const bits = 7;
    const data = 42
    const f = factoryRatio(bits,100, true);
    return f.decode((new BitArray(bits)).append(f.encode(data),bits).get(bits,0));
} );
testEqual(`factoryRatio encode decode back as close as possible to the original`, -42, async ()=>{
    const bits = 7;
    const data = -42;
    const f = factoryRatio(bits,100, true);
    return f.decode((new BitArray(bits)).append(f.encode(data),bits).get(bits,0));
} );
testEqual(`factoryRatio encode decode like it should ?`, 403, async ()=>{
    const bits = 10;
    const data = 403;
    const f = factoryRatio(bits,1920);
    return f.decode((new BitArray(bits)).append(f.encode(data),bits).get(bits,0));
} );
testEqual(`factoryRatio encode decode like it should ?`, 223, async ()=>{
    const bits = 10;
    const data = 223;
    const f = factoryRatio(bits,610);
    return f.decode((new BitArray(bits)).append(f.encode(data),bits).get(bits,0));
} );
}

/** saveToBinary and loadFromBinary */{
    function initPersist(){
        PERSIST_MODEL[0] = [];
        PERSIST_MODEL[0][1] = {name:"something",bit:3,encode:(v)=>v,decode:(v)=>v};
        PERSIST_MODEL[0][5] = {name:"thing",bit:3,encode:(v)=>v,decode:(v)=>v};
        PERSIST_MODEL[0][2] = {name:"otherThing",bit:6,encode:(v)=>v,decode:(v)=>v};
    }
    testEqual(`saveToBinary store in order`, '11110101 00010110 00000001', async ()=>{
        initPersist();
        const bitArray = new BitArray(24);
        saveToBinary(bitArray,{something:7,thing:1,otherThing:42},0,12)
        saveToBinary(bitArray,{something:3,thing:1,otherThing:0},0,12)
        return binView(bitArray.rawData.buffer);
    } );
    testEqual(`loadFromBinary restore in order`, `[{"something":7,"otherThing":42,"thing":1},{"something":3,"otherThing":0,"thing":1}]`, async ()=>{
        initPersist();
        const bitArray = new BitArray(24);
        bitArray.append(parseInt('111101010001011000000001',2),24);
        bitArray.resetOffset();
        const res = [];
        res.push(loadFromBinary(bitArray,0,12,[2]));
        res.push(loadFromBinary(bitArray,0,12,[2]));
        return JSON.stringify(res);
    } );
    testEqual(`loadFromBinary partial restore if partial data`, `[{"something":7,"otherThing":42},{"something":3,"otherThing":0}]`, async ()=>{
        initPersist(); // with 12 bit by entity (3+6+3)
        const bitArray = new BitArray(18);
        bitArray.append(parseInt('111101010011000000',2),18);
        bitArray.resetOffset();
        const res = [];
        res.push(loadFromBinary(bitArray,0,9,[2]));
        res.push(loadFromBinary(bitArray,0,9,[2]));
        return JSON.stringify(res);
    } );

}
/** appendArea and extractArea */{
    function extraInitPersist(){
        initPersist();

        if(typeof LoopyNode === "undefined") {LoopyNode = ()=> {};LoopyNode._CLASS_ = LoopyNode.name= 'Node';}
        if(typeof Edge === "undefined") {Edge = ()=> {};Edge._CLASS_ = Edge.name= 'Edge';}
        if(typeof Label === "undefined") {Label = ()=> {};Label._CLASS_ = Label.name= 'Label';}
        if(typeof Loopy === "undefined") {Loopy = ()=> {};Loopy._CLASS_ = Loopy.name= 'Loopy';}

        loopy = {model:{nodes:[
                {something:7,thing:1,otherThing:42},
                {something:3,thing:1,otherThing:0}
            ]}}
    }
    testEqual(`appendArea store adjusted`,
        '10000000 11000000 11000000 10000000 [0:8b] 10000000 [0:8b] 10000000 [0:24b] 11000000 01000000'
        /* before rotate :
        111 101010 001
        011 000000 001' */,
        async ()=>{
            extraInitPersist();
            const bitArray = new BitArray(12*8+1);
            appendArea(bitArray,"nodes",{nodes:12});
            bitArray.append(1,2);
            return binView(bitArray.rawData.buffer);
        } );
    testEqual(`appendArea store 8padded`,
        '10000000 11000000 11000000 10000000 [0:8b] 10000000 [0:8b] 10000000 [0:24b] 11000000 [0:32b] 01000000'
        /* before rotate :
        111 101010 001
        011 000000 001' */,
        async ()=>{
            extraInitPersist();
            const bitArray = new BitArray(16*8+1);
            appendArea(bitArray,"nodes",{nodes:16});
            bitArray.append(1,2);
            return binView(bitArray.rawData.buffer);
        } );
    testEqual(`extractArea restore adjusted`,`[{"something":7,"otherThing":42,"thing":1},{"something":3,"otherThing":0,"thing":1}]`,
        async ()=>{
            extraInitPersist();
            const writeBitArray = new BitArray(12*8+1);
            appendArea(writeBitArray,"nodes",{nodes:12});
            writeBitArray.append(1,2);
            const readBitArray = new BitArray(writeBitArray.rawData.buffer);
            const res = extractArea(readBitArray,"nodes",[12],[2]);
            return JSON.stringify(res);
        } );
    testEqual(`extractArea restore 8padded`,`[{"something":7,"otherThing":42,"thing":1},{"something":3,"otherThing":0,"thing":1}]`,
        async ()=>{
            extraInitPersist();
            const writeBitArray = new BitArray(16*8+1);
            appendArea(writeBitArray,"nodes",{nodes:16});
            writeBitArray.append(1,2);
            const readBitArray = new BitArray(writeBitArray.rawData.buffer);
            const res = extractArea(readBitArray,"nodes",[16],[2]);
            return JSON.stringify(res);
        } );

}