testEqual(`more url friendly chr (especially + => _)`, "-_.", async ()=>stdB64ToUrl("/+=") );
testEqual(`compact usual LZMA header`, "/plop", async ()=>stdB64ToUrl("XQAAAAISAAAAAAAAAAAtplop") );
testEqual(`compact usual LZMA header with changes`, "9A6B/plop", async ()=>stdB64ToUrl("XQAAAAISAAAAAAABAAAtplop") );
testEqual(`b64 url conversion`, "XQAAAAISAAAAAAAAAAAkplop/+==", async ()=>urlToStdB64(stdB64ToUrl("XQAAAAISAAAAAAAAAAAkplop/+==")) );

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
