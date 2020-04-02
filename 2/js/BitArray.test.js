function initBitArray(){
    const rawBuffer = new ArrayBuffer(8);
    const data = new DataView(rawBuffer);
    data.setUint32(0,242_424_242,false);
    return new BitArray(data);
}
function log(buffer){
    const view = new Uint8Array(buffer);
    let str = "";
    for(let i in view){
        const bin = view[i].toString(2);
        let pad = '';
        for (let i=8;i>bin.length;i--) pad = `0${pad}`;
        str = `${str}${pad}${bin} `;
    }
    console.log(str);
}
log(initBitArray().rawData.buffer);

testEqual(`get 0 for the first 4bit`, 0, async ()=>initBitArray().get(4,0));
testEqual(`get 14 for the first 8bit`, 14, async ()=>initBitArray().get(8,0));
testEqual(`get 14 for the 4bit at offset 4`, 14, async ()=>initBitArray().get(4,4));
testEqual(`get 7 for the 3bit at offset 4`, 7, async ()=>initBitArray().get(3,4));
testEqual(`get 7 for the 3bit at offset 9`, 7, async ()=>initBitArray().get(3,9));
testEqual(`get 4 for the 3bit at offset 6`, 4, async ()=>initBitArray().get(3,6));
testEqual(`get 59185 for the 16bit at offset 4`, 59185, async ()=>initBitArray().get(16,4));

testEqual(`set 1 on 1bit at offset 35`, 1, async ()=>initBitArray().set(1,1,35).get(1,35));
testEqual(`set 1 on 1bit at offset 25 (and verify previous and next data are preserved)`,
    7, async ()=>initBitArray().set(1,1,25).get(3,24));
testEqual(`set 42 on 6bit at offset 37`, 42, async ()=>initBitArray().set(42,6,37).get(6,37));
testEqual(`set 42 on 7bit at offset 20 (and verify previous and next data are preserved)`,
    341, async ()=>initBitArray().set(42,7,20).get(9,19));

testEqual(`append 1,0,1,42,0 (on 10bits)`,
    724, async ()=>initBitArray().append(1).append(0).append(1).append(42).append(0).get(10,0));
