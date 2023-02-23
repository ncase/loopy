// Copyright (c) 2014, The WebRTC project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
// Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
// Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
// Neither the name of Google nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

const mediaSource = new MediaSource();

mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;


let canvas;
let stream;
let downloadDisabled = true;
var recordTimeout;

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  console.log('Recorder stopped: S', event);
  const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
}

function toggleRecording(self) {
  canvas = document.querySelector('canvas');
  stream = canvas?.captureStream(); // frames per second
  console.log('Started stream capture from canvas element: ', stream);
  if (self.textContent === "Start Recording GIF") {
    startRecording(self);

  } else {
    stopRecording();
  }
}

function startRecording(recordButton) {
  let options = {mimeType: 'video/webm'};
  recordedBlobs = [];
  mediaRecorder = new MediaRecorder(stream, options);

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';

  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(100); // collect 100ms of data

  recordTimeout = setTimeout(stopRecording,30000);

  console.log('MediaRecorder started', mediaRecorder);

}

function stopRecording() {
  clearTimeout(recordTimeout);
  if (mediaRecorder.state != "inactive"){
    document.getElementById("record").textContent = 'Start Recording GIF'; //Hardcoded for condition in toggleRecording()
    mediaRecorder.stop();
    // console.log('Recorded Blobs: ', recordedBlobs);
    downloadDisabled = false;
  }
}

function getFileAsDataURL(blob){
  return new Promise((resolve,reject) =>{
    var fileRdr = new FileReader();
    fileRdr.onload = () => resolve(fileRdr.result);
    fileRdr.onerror = () => reject(fileRdr);
    fileRdr.readAsDataURL(blob);
  });
}
function toggleImageSmoothing(_CANVAS, isEnabled) {
	_CANVAS.getContext('2d').mozImageSmoothingEnabled = isEnabled;
	_CANVAS.getContext('2d').webkitImageSmoothingEnabled = isEnabled;
	_CANVAS.getContext('2d').msImageSmoothingEnabled = isEnabled;
	_CANVAS.getContext('2d').imageSmoothingEnabled = isEnabled;
}

function scaleCanvas(_CANVAS, videoObj, vidHeight, vidWidth, scale) {
    _CANVAS['style']['height'] = `${vidHeight}px`;
    _CANVAS['style']['width'] = `${vidWidth}px`;

    let cWidth=vidWidth*scale;
    let cHeight=vidHeight*scale;

    console.log('canvasHeight/Width');
    console.log(cHeight);
    console.log(cWidth);

    _CANVAS.width=cWidth;
    _CANVAS.height=cHeight;

    toggleImageSmoothing(_CANVAS, true);
    _CANVAS.getContext('2d').scale(scale, scale);
}

const loadVideo = (url) => new Promise((resolve, reject) => {
  var vid = document.createElement('video');
  vid.addEventListener('canplay', () => resolve(vid));
  vid.addEventListener('error', (err) => reject(err));
  vid.src = url;
});
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
const byteToKBScale = 0.0009765625;
const displayedSize=500;
const scale = window.devicePixelRatio;
async function download() {
  if (!downloadDisabled){
    
    var FPS=0;
    const blob = new Blob(recordedBlobs, {type: 'video/webm'});
    
    
    let b64Str = await getFileAsDataURL(blob);  
    let videoObj = await loadVideo(b64Str);
    videoObj.autoplay=false;
    videoObj.muted=true;
    videoObj.loop=false;
    
    let exactVideoDuration=videoObj.duration; //Used Later in Encoding

    let vidHeight=videoObj.videoHeight;
    let vidWidth=videoObj.videoWidth;
    console.log('VidHeight/Width');
    console.log(vidHeight);
    console.log(vidWidth);
    

    videoObj.height=vidHeight;
    videoObj.width=vidWidth;
    videoObj['style']['height']=`${vidHeight}px`;
    videoObj['style']['width']=`${vidWidth}px`;

    let _CANVAS = document.createElement('canvas');
    scaleCanvas(_CANVAS, videoObj, vidHeight, vidWidth, scale);
    // _CANVAS.getContext('2d').will
    let hiddencanvas = document.createElement('div');
    hiddencanvas.id = 'hiddenCanvas';
    document.body.appendChild(hiddencanvas);

    document.getElementById('hiddenCanvas').appendChild(_CANVAS);
    
    // let totalFrames=10;

    let totalFrames=33;
    if(exactVideoDuration <= 10) {
        totalFrames=33;
    } else if(exactVideoDuration <= 12) {
        totalFrames=25;
    } else if(exactVideoDuration <= 15) {
      totalFrames=20;
    } else if(exactVideoDuration <= 25) {
      totalFrames=12;
    } else if(exactVideoDuration <= 30) {
      totalFrames=10;
    } else if(exactVideoDuration <= 35) {
      totalFrames=8;
    } else if(exactVideoDuration <= 42) {
      totalFrames=7;
    } else if(exactVideoDuration <= 60) {
      totalFrames=5;
    }

    
    // let sizeBenchmark=vidHeight;
    // if(vidWidth>vidHeight) {
    // 	sizeBenchmark=vidWidth;
    // }
    // let scaleRatio=parseFloat(displayedSize/sizeBenchmark);
    let scaleRatio = 0.5;
    let displayedHeight=scaleRatio*vidHeight;
    let displayedWidth=scaleRatio*vidWidth;
    videoObj['style']['height']=`${displayedHeight}px`;
    videoObj['style']['width']=`${displayedWidth}px`;
    scaleCanvas(_CANVAS, videoObj, displayedHeight, displayedWidth, scale);


    totalFrames = totalFrames*2;
    // let displayedHeight=vidHeight;
    // let displayedWidth=vidWidth;
        
    var encoder = new GIFEncoder(vidWidth, vidHeight);
    encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
    encoder.setDelay(0);  // frame delay in ms // 500
    encoder.setQuality(16); // [1,30] | Best=1 | >20 not much speed improvement. 10 is default.
    
    // Sets frame rate in frames per second
    var startTime=0;
    var frameIndex=0;
    var staticFrames='';
    var continueCallback=true;
    console.log('running download 1');
    let ctx = _CANVAS.getContext("2d", { willReadFrequently: true });
    const step = async() => {
      // in milliseconds
      startTime=( startTime==0 ? Date.now() : 0);
      ctx.drawImage(videoObj, 0, 0, displayedWidth, displayedHeight);
      encoder.addFrame(ctx);
      
      let frameB64Str=_CANVAS.toDataURL();
      staticFrames+=`<th><small>Frame #${frameIndex++}</small><br><img src=${frameB64Str} width='75' /></th>`;
      
      if(FPS==0) {
        let ms_elapsed = ((Date.now()) - startTime);
        FPS=(frameIndex / ms_elapsed)*1000.0;
        console.log('FPS: '+FPS+' | Duration: '+exactVideoDuration);
        console.log((( (totalFrames*1.0)/exactVideoDuration)-FPS));
        let encodeDelaySetting=( (FPS*exactVideoDuration) >= totalFrames ) ? 0 : (( (totalFrames*1.0)/exactVideoDuration)-FPS);
        encodeDelaySetting=Math.floor(encodeDelaySetting*1000);
        console.log(encodeDelaySetting);
        encoder.setDelay(encodeDelaySetting);
      }
      
      if(continueCallback) { 
        videoObj.requestVideoFrameCallback(step);
      }
    };
    
    console.log('prePlayListener');
    videoObj.addEventListener('play', (vEvt) => {
      if(continueCallback) {
        videoObj.requestVideoFrameCallback(step);
      }
      console.log('running encoder');
      encoder.start();
      
      
    }, false);
    
    console.log('preEndListener');
    videoObj.addEventListener('ended', (vEvt) => {
      console.log('ended');
      continueCallback=false;
      encoder.finish();
      console.log('encoder Finished');
      // encoder.download("download.gif");
      
      var fileType='image/gif';
      var fileName = `gif-output-${(new Date().toGMTString().replace(/(\s|,|:)/g,''))}.gif`;
      var readableStream=encoder.stream();
      var binary_gif =readableStream.getData();
      var b64Str = 'data:'+fileType+';base64,'+encode64(binary_gif);
      var fileSize = readableStream.bin.length*byteToKBScale;
      fileSize=fileSize.toFixed(2);
      
      let dwnlnk = document.createElement('a');
      dwnlnk.download = fileName;
      dwnlnk.href = b64Str;

      document.body.appendChild(dwnlnk);
      dwnlnk.click();
      
      
    }, false);
    
    console.log('preplay');
    videoObj.play();
    console.log('postplay');
  }
}
