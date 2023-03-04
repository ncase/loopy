self.importScripts('jsgif/GifEncoder.js')
self.importScripts('jsgif/LZWEncoder.js')
self.importScripts('jsgif/NeuQuant.js')
function encode64(input) {
	var output = '', i = 0, l = input.length,
	key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=', 
	chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	while (i < l) {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		if (isNaN(chr2)) enc3 = enc4 = 64;
		else if (isNaN(chr3)) enc4 = 64;
		output = output + key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
	}
	return output;
}
onmessage = (e)=>{
    let frames = e.data[0];
    
    
    let frame;
    // const canvas = document.createElement('canvas');
    frame = frames[0];
    const canvas = new OffscreenCanvas(frame.width,frame.height);
    const ctx = canvas.getContext("2d", {willReadFrequently:true});
    
    var encoder = new GIFEncoder(frame.width, frame.height);
    encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
    encoder.setQuality(16); // [1,30] | Best=1 | >20 not much speed improvement. 10 is default.
    encoder.setFrameRate(30);
    encoder.start();
    for (let i = 0; i<frames.length; i++){
        frame = frames[i];        
        canvas.width = frame.width;
        canvas.height = frame.height;
        ctx.drawImage(frame, 0, 0);
        
        encoder.addFrame(ctx);
        console.log(i);
        // printFromImageBitmap(frame);
        postMessage(['progress'])
        
    }
    
    encoder.finish();
    // document.body.removeChild(canvas); 
    
    var fileType='image/gif';
    var readableStream=encoder.stream();
    var binary_gif =readableStream.getData();
    var b64Str = 'data:'+fileType+';base64,'+encode64(binary_gif);
    postMessage(['fin',b64Str]);
}
