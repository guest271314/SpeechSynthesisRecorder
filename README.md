# SpeechSynthesisRecorder.js

Use [`navigator.mediaDevices.getUserMedia()`][getUserMedia] and 
[`MediaRecorder`][MediaRecorder] to get audio output from 
[`window.speechSynthesis.speak()`][speak] call as [`ArrayBuffer`][ArrayBuffer], 
[`AudioBuffer`][AudioBuffer], [`Blob`][Blob], [`MediaSource`][MediaSource], 
[`ReadableStream`][ReadableStream], or other object or data 
types, see [MediaStream, ArrayBuffer, Blob audio result from speak() for recording?](https://lists.w3.org/Archives/Public/public-speech-api/2017Jun/0000.html).

## Install

Add the following script tag

```html
<script type="text/javascript" src="https://unpkg.com/speech-synthesis-recorder@1.2.1/SpeechSynthesisRecorder.js"></script>
```

or npm install

```bash
$ npm install --save speech-synthesis-recorder
```

## Usage

Select `Monitor of Built-in Audio Analog Stereo` option instead of 
`Built-in Audio Analog Stereo` option at `navigator.mediaDevices.getUserMedia()` 
prompt.

```js
let ttsRecorder = new SpeechSynthesisRecorder({
  text: "The revolution will not be televised", 
  utteranceOptions: {
    voice: "english-us espeak",
    lang: "en-US",
    pitch: .75,
    rate: 1
  }
});
```

### ArrayBuffer

```js
ttsRecorder.start()
  // `tts` : `SpeechSynthesisRecorder` instance, `data` : audio as `dataType` or method call result
  .then(tts => tts.arrayBuffer())
  .then(({tts, data}) => {
    // do stuff with `ArrayBuffer`, `AudioBuffer`, `Blob`,
    // `MediaSource`, `MediaStream`, `ReadableStream`
    // `data` : `ArrayBuffer`
    tts.audioNode.src = URL.createObjectURL(new Blob([data], {type:tts.mimeType}));
    tts.audioNode.title = tts.utterance.text;
    tts.audioNode.onloadedmetadata = () => {
      console.log(tts.audioNode.duration);
      tts.audioNode.play();
    }
  })
```

### AudioBuffer

```js
ttsRecorder.start()
  .then(tts => tts.audioBuffer())
  .then(({tts, data}) => {
    // `data` : `AudioBuffer`
    let source = tts.audioContext.createBufferSource();
    source.buffer = data;
    source.connect(tts.audioContext.destination);
    source.start()
  })
```
### Blob

```js
ttsRecorder.start()
  .then(tts => tts.blob())
  .then(({tts, data}) => {
    // `data` : `Blob`
    tts.audioNode.src = URL.createObjectURL(blob);
    tts.audioNode.title = tts.utterance.text;
    tts.audioNode.onloadedmetadata = () => {
      console.log(tts.audioNode.duration);
      tts.audioNode.play();
    }
  })
```

### ReadableStream

```js
ttsRecorder.start()
  .then(tts => tts.readableStream())
  .then(({tts, data}) => {
    // `data` : `ReadableStream`
    console.log(tts, data);
    data.getReader().read().then(({value, done}) => {
      tts.audioNode.src = URL.createObjectURL(value[0]);
      tts.audioNode.title = tts.utterance.text;
      tts.audioNode.onloadedmetadata = () => {
        console.log(tts.audioNode.duration);
        tts.audioNode.play();
      }
    })
  })
```

### MediaSource

```js
ttsRecorder.start()
  .then(tts => tts.mediaSource())
  .then(({tts, data}) => {
    console.log(tts, data);
    // `data` : `MediaSource`
    tts.audioNode.srcObj = data;
    tts.audioNode.title = tts.utterance.text;
    tts.audioNode.onloadedmetadata = () => {
      console.log(tts.audioNode.duration);
      tts.audioNode.play();
    }
  })
```

### MediaStream

```js
let ttsRecorder = new SpeechSynthesisRecorder({
  text: "The revolution will not be televised", 
  utternanceOptions: {
    voice: "english-us espeak",
    lang: "en-US",
    pitch: .75,
    rate: 1
  }, 
  dataType:"mediaStream"
});
ttsRecorder.start()
  .then(({tts, data}) => {
    // `data` : `MediaStream`
    // do stuff with active `MediaStream`
  })
  .catch(err => console.log(err))
```

## Demo
[plnkr][plnkr]

[plnkr]: https://plnkr.co/edit/PmpCSJ9GtVCXDhnOqn3D?p=preview
[getUserMedia]: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
[MediaRecorder]: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
[speak]: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/speak
[ArrayBuffer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[AudioBuffer]: https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
[Blob]: https://developer.mozilla.org/en-US/docs/Web/API/Blob
[MediaSource]: https://developer.mozilla.org/en-US/docs/Web/API/MediaSource
[ReadableStream]: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
[MediaStream]: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
