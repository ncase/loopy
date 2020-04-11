let testOk = 0;
let skippedTest = 0;
const testList = [];
const xtest = xtestEqual = ()=>skippedTest++;
function testEqual(message,pendingResult,testFunc){
    testList.push({name:message,func:async ()=>{
            try{
                const res = await testFunc();
                const strRes = JSON.stringify(res);
                const strPending = JSON.stringify(pendingResult);
                if(strRes===strPending)testOk++;
                else {
                    console.error(`${strRes} should be ${strPending} in test : ${message}`);
                    console.log(strRes, "received");
                    console.log(strPending,"control");
                }
            } catch (e) {
                console.error(message,e);
            }
        }});
}
function test(message,testFunc){
    testList.push({name:message,func:async ()=>{
            try{
                if(await testFunc())testOk++;
                else console.error(message);
            } catch (e) {
                console.error(message,e);
            }
        }});
}
async function runAllTest(verbose=false){
    for(let t of testList) {
        if(verbose) console.log(t.name);
        await t.func();
    }
    let skipped = '';
    if(skippedTest) skipped = `, skipped : ${skippedTest}`;
    let failed = '';
    if(testOk<testList.length) failed = `, failed : ${testList.length-testOk}`;
    console.log(`Test summary : passed : ${testOk}${skipped}${failed}, TOTAL : ${testList.length+skippedTest}`);
}