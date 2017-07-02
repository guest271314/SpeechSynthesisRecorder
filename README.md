# SpeechSynthesisRecorder.js
Utilize `navigator.mediaDevices.getUserMedia()` and `MediaRecorder` to get audio output from `window.speechSynthesis.speak()` call as `ArrayBuffer`, `AudioBuffer`, `Blob`, `MediaSource`, `ReadableStream`, or other object or data types, see [MediaStream, ArrayBuffer, Blob audio result from speak() for recording?](https://lists.w3.org/Archives/Public/public-speech-api/2017Jun/0000.html).




Usage 
---

Select `Monitor of Built-in Audio Analog Stereo` option instead of `Built-in Audio Analog Stereo` option at `navigator.mediaDevices.getUserMedia()` prompt.

    let ttsRecorder = new SpeechSynthesisRecorder("The revolution will not be televised", {
      voice: "english-us espeak",
      lang: "en-US",
      pitch: .75,
      rate: 1
    }, {
      mimeType: "audio/webm; codecs=opus"
    });
    // ReadableStream
    ttsRecorder.start()
    .then(tts => tts.readableStream())
    .then(({tts, data}) => {
       // do stuff with `ArrayBuffer`, `AudioBuffer`, `Blob`,
       // `MediaSource`, `MediaStream`, `ReadableStream`
       console.log(tts, data);
       data.getReader().read().then(({value, done}) => {
         // do stuff with stream
         tts.audioNode.src = URL.createObjectURL(value[0]);
         tts.audioNode.title = tts.utterance.text;
         tts.audioNode.onloadedmetadata = () => {
           console.log(tts.audioNode.duration);
           tts.audioNode.play();
         }
       })
     })
     // MediaSource
     ttsRecorder.start()
     .then(tts => tts.mediaSource())
     .then(({tts, data}) => {
       // do stuff with `ArrayBuffer`, `AudioBuffer`, `Blob`, 
       // `MediaSource`, `MediaStream`, `ReadableStream`;
       // for example, play audio, download audio
       console.log(tts, data); // `tts` : `SpeechSynthesisRecorder` instance, `data` : audio as `dataType`
       // `data` : `MediaSource`
       tts.audioNode.srcObj = data;
       tts.audioNode.title = tts.utterance.text;
       tts.audioNode.onloadedmetadata = () => {
         console.log(tts.audioNode.duration);
         tts.audioNode.play();
       }
     })
     // `data` : `ArrayBuffer`
     ttsRecorder.start()
     .then(tts => tts.arrayBuffer())
     .then(({tts, data}) => {
       tts.audioNode.src = URL.createObjectURL(new Blob([data], {type:tts.mimeType}));
       tts.audioNode.title = tts.utterance.text;
       tts.audioNode.onloadedmetadata = () => {
         console.log(tts.audioNode.duration);
         tts.audioNode.play();
       }
     })
     // `data` : `AudioBuffer`
     ttsRecorder.start()
     .then(tts => tts.audioBuffer())
     .then(({tts, data}) => {
       let source = tts.audioContext.createBufferSource();
       source.buffer = data;
       source.connect(tts.audioContext.destination);
       source.start()
     })
      // `data` : `Blob`
     ttsRecorder.start()
     .then(tts => tts.blob())
     .then(({tts, data}) => {
       tts.audioNode.src = URL.createObjectURL(blob);
       tts.audioNode.title = tts.utterance.text;
       tts.audioNode.onloadedmetadata = () => {
         console.log(tts.audioNode.duration);
         tts.audioNode.play();
       }
     })
     // `data` : `MediaStream`
     ttsRecorder.start()
     .then(tts => tts.mediaStream())
     .then(({tts, data}) => {
       // do stuff with active `MediaStream`
     })
     .catch(err => console.log(err))
     
 Demonstration
 ---
 [plnkr](https://plnkr.co/edit/7Y2ifjRK5K9YGwT9G8nn?p=preview)
