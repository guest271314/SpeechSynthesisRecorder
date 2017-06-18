# SpeechSynthesisRecorder.js
Utilize `navigator.mediaDevices.getUserMedia()` and `MediaRecorder` to get audio output from `window.speechSynthesis.speak()` call as `ArrayBuffer`, `AudioBuffer`, `Blob`, `MediaSource`, `ReadableStream`, or other object or data types, see [MediaStream, ArrayBuffer, Blob audio result from speak() for recording?](https://lists.w3.org/Archives/Public/public-speech-api/2017Jun/0000.html).

Prerequisites
---

At `*nix` install [`espeak`](http://espeak.sourceforge.net/) or other speech synthesizer using package manager

`$ sudo apt install espeak`

Launch Chromium browser with `--enable-speech-dispatcher` flag set.

Usage 
---
    // Promise version
    let ttsRecorder = new SpeechSynthesisRecorder("The revolution will not be televised", {
      voice: "english-us espeak",
      lang: "en-US",
      pitch: .75,
      rate: 1
    }, {
      mimeType: "audio/webm; codecs=opus"
    }, "readableStream");

    ttsRecorder.start()
      .then(tts => tts.readableStream())
      .then(({tts, data}) => {
        // do stuff with `ArrayBuffer`, `AudioBuffer`, `Blob`, `MediaSource`, `MediaStream`, `ReadableStream`
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


<br>


    // async/await
    async function ttsRecorder(text, utteranceOptions, recorderOptions, dataType = void 0) {
      if (dataType === undefined) throw new TypeError("dataType is undefined");
      const ttsRecorder = await new SpeechSynthesisRecorder(text, utteranceOptions, recorderOptions, dataType);

      const tts = await ttsRecorder.start();
      // return `MediaStream`
      if (dataType === "mediaStream") return ttsRecorder.start();
      const data = await tts[dataType]();

      return {tts, data}
    }

     let ttsRecording = ttsRecorder("The revolution will not be televised", {
        voice: "english-us espeak",
        lang: "en-US",
        pitch: .75,
        rate: 1
      }, {
        mimeType: "audio/webm; codecs=opus"
      }, /* `dataType` */  "mediaStream");
      
      /*
      `dataType` : 
       "blob" : Blob,
       "arrayBuffer" : ArrayBuffer,
       "audioBuffer" : AudioBuffer,
       "mediaSource" : MediaSource, 
       "mediaStream" : MediaStream,
       "readableStream" : ReadableStream
      */

     ttsRecording
     .then(({tts, data}) => {
      // do stuff with `ArrayBuffer`, `AudioBuffer`, `Blob`, 
      // `MediaSource`, `MediaStream`, `ReadableStream`;
      // for example, play audio, download audio
      console.log(tts, data); // `tts` : `SpeechSynthesisRecorder` instance, `data` : audio as `dataType`
      /*
      // `data` : `MediaSource`
      tts.audioNode.srcObj = data;
      tts.audioNode.title = tts.utterance.text;
      tts.audioNode.onloadedmetadata = () => {
        console.log(tts.audioNode.duration);
        tts.audioNode.play();
      }
      */
      /*
      // `data` : `ArrayBuffer`
      tts.audioNode.src = URL.createObjectURL(new Blob([data], {type:tts.mimeType}));
      tts.audioNode.title = tts.utterance.text;
      tts.audioNode.onloadedmetadata = () => {
        console.log(tts.audioNode.duration);
        tts.audioNode.play();
      }
      */
      /*
      // `data` : `AudioBuffer`
      let source = tts.audioContext.createBufferSource();
      source.buffer = data;
      source.connect(tts.audioContext.destination);
      source.start()
      */
      /*
      // `data` : `Blob`
      tts.audioNode.src = URL.createObjectURL(blob);
      tts.audioNode.title = tts.utterance.text;
      tts.audioNode.onloadedmetadata = () => {
        console.log(tts.audioNode.duration);
        tts.audioNode.play();
      }
      */
      /*
      // `data` : `ReabableStream`
      data.getReader().read().then(({value, done}) => { 
        // do stuff with stream
        tts.audioNode.src = URL.createObjectURL(value[0]);
        tts.audioNode.title = tts.utterance.text;
        tts.audioNode.onloadedmetadata = () => {
          console.log(tts.audioNode.duration);
          tts.audioNode.play();
        }
      })
      */
      /*
      // `data` : `MediaStream`
      // do stuff with active `MediaStream`
     })
     .catch(err => console.log(err))
     
 Demonstration
 ===
 [plnkr](https://plnkr.co/edit/7Y2ifjRK5K9YGwT9G8nn?p=preview)
