function initBitArray(size=8*8){
    const rawBuffer = new ArrayBuffer(Math.ceil(size/8));
    const data = new DataView(rawBuffer);
    data.setUint32(0,242_424_242,false);
    return new BitArray(data);
}

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
testEqual(`set bitArray`,
    '00001110 01110011 00010000 11100111 00110001 10011011 00100000 [0:8b] 00001110 01110011 00011001 10110010 [0:32b]',
    async ()=>binView(initBitArray(16*8).set(initBitArray(),32,64).set(initBitArray(),32,20).rawData.buffer));
testEqual(`export partial bitArray`,
    '10101000',
    async ()=>binView((new BitArray(16)).append(42,10).export(6,4).rawData.buffer));

testEqual(`equalSequence pass if equal`,
    true,
    async ()=>(new BitArray(15)).append(42,15).equalSequence(6,9,(new BitArray(10)).append(42,9),3));
testEqual(`equalSequence fail if not equal`,
    false,
    async ()=>(new BitArray(15)).append(43,15).equalSequence(6,9,(new BitArray(10)).append(42,9),3));
testEqual(`rotateArea 111 000 000 000 became 1000 1000 1000`,
    '10001000 10000000',
    async ()=>binView((new BitArray(12)).append(7,3).rotate(3,4,0).rawData.buffer));
testEqual(`rotate and rotate back give same as with no rotate at all`,
    '11100000 [0:8b]',
    async ()=>binView((new BitArray(12)).append(7,3).rotate(3,4,0).rotate(4,3,0).rawData.buffer));


{
    testEqual(`zGet first identical 30bit`,
        '[0:24b] 10101000',
        async ()=>binView((new BitArray(64)).append(42,30).append(parseInt('1111110001111110',2),16).zGet(30,0,0).rawData.buffer));
    testEqual(`zGet 2nd identical 30bit`,
        '[0:24b] 10101000',
        async ()=>binView((new BitArray(64)).append(42,30).append(parseInt('1111110001111110',2),16).zGet(30,0,1).rawData.buffer));


    testEqual(`zPush some identical data on 30bit each`,
        {offset:48/*90*/, bitView:'[0:24b] 10101011 11110001 11111000 [0:80b]'},
        async ()=>{
            const res = initBitArray(128).zPush(42,30).zPush(42,30).zPush(42,30);
            return {offset:res.offset,bitView:binView(res.rawData.buffer)};
        });
    testEqual(`zPush some similar data on 30bit each`,
        {offset:55/*90*/, bitView:'[0:24b] 10101011 11101000 00001111 11110010 [0:72b]'},
        async ()=>{
            const res = initBitArray(128).zPush(42,30).zPush(43,30).zPush(42,30);
            return {offset:res.offset,bitView:binView(res.rawData.buffer)};
        });
    testEqual(`zPush some similar data on 100bit each`,
        {offset:136/*200*/, bitView:'[0:88b] 00101010 00001101 01000000 00000101 10101101 10111000 [0:72b]'},
        async ()=>{
            const line0 = (new BitArray(100)).set(42,6,90);
            const line1 = (new BitArray(100)).set(42,6,90).set(42,6,40);
            const res = (new BitArray(202)).zPush(line0,100).zPush(line1,100);
            return {offset:res.offset,bitView:binView(res.rawData.buffer)};
        });
    testEqual(`zPush some similar data on 100bit each (and don't compress when it's not effective)`,
        {offset:149/*200*/, bitView:'[0:88b] 00101010 00001101 01000000 00000101 10101101 10010000 00000101 10000000 [0:56b]'},
        async ()=>{
            const line0 = (new BitArray(100)).set(42,6,90);
            const line1 = (new BitArray(100)).set(43,6,90).set(42,6,40);
            const res = (new BitArray(202)).zPush(line0,100).zPush(line1,100);
            return {offset:res.offset,bitView:binView(res.rawData.buffer)};
        });
}
