    // SpeechSynthesisRecorder.js guest271314 <guest271314@gmail.com> 6-17-2017
    // Version 0.0.2
    // Motivation: Get audio output from `window.speechSynthesis.speak()` call
    // as `ArrayBuffer`, `AudioBuffer`, `Blob`, `MediaSource`, `MediaStream`, `ReadableStream`, or other object or data types
    // See https://lists.w3.org/Archives/Public/public-speech-api/2017Jun/0000.html
    // https://github.com/guest271314/SpeechSynthesisRecorder

    // Configuration: Analog Stereo Duplex
    // Input Devices: Monitor of Built-in Audio Analog Stereo, Built-in Audio Analog Stereo
    // Playback: Chromium: Playback, speech-dspatcher: playback
    // Recording: Chrome input: RecordStream from Monitor of Built-in Audio Analog Stereo
    // Issues: Stop MediaStream, navigator.getUserMedia() when recording is complete
    // Issues: When MediaStream is returned avoid feedback; 
    // get accurate media duration; stop all associated MediaStream when  
    // SpeechSynthesisUtterance ended event dispatched

    class SpeechSynthesisRecorder {
      constructor(text = "", utteranceOptions = {}, recorderOptions = {}, dataType = void 0) {
        if (text === "") throw new Error("no words to synthesize");
        if (dataType === undefined) throw new TypeError("dataType is undefined");
        this.dataType = dataType;
        this.text = text;
        this.utterance = new SpeechSynthesisUtterance(this.text);
        this.speechSynthesis = window.speechSynthesis;
        this.mediaStream_ = new MediaStream();
        this.mediaSource_ = new MediaSource();
        this.mediaRecorder = new MediaRecorder(this.mediaStream);
          // Firefox logs operation not supported
          // _, recorderOptions || {
          // does not set value at chromium 58
          /* audioBitsPerSecond: 128000, */
          // mimeType: "audio/webm; codecs=opus"
          // });
        this.audioContext = new AudioContext();
        this.audioNode = new Audio();
        this.chunks = Array();
        this.mimeType = recorderOptions.mimeType || "audio/webm; codecs=opus";
        // adjust codecs set at `type` of `Blob` is necessary
        // this.blobType = this.mimeType.substring(0, this.mimeType.indexOf(";"));
        if (utteranceOptions) {
          if (utteranceOptions.voice) {
            this.speechSynthesis.onvoiceschanged = e => {
              const voice = this.speechSynthesis.getVoices().find(({
                name: _name
              }) => _name === utteranceOptions.voice);
              this.utterance.voice = voice;
              console.log(voice, this.utterance);
            }
            this.speechSynthesis.getVoices();
          }
          let {
            lang, rate, pitch
          } = utteranceOptions;
          Object.assign(this.utterance, {
            lang, rate, pitch
          });
        }
        this.audioNode.controls = "controls";
        document.body.appendChild(this.audioNode);
      }
      start(text = "") {
        if (text) this.text = text;
        if (this.text === "") throw new Error("no words to synthesize");
        return navigator.mediaDevices.getUserMedia({
            audio: true
          })
          .then(stream => new Promise(resolve => {
            const track = stream.getAudioTracks()[0];
            this.mediaStream_.addTrack(track);
            // return the current `MediaStream`
            if (this.dataType === "mediaStream") {
              resolve(this)
            };
            this.mediaRecorder.ondataavailable = event => {
              if (event.data.size > 0) {
                this.chunks.push(event.data);
              };
            };
            this.mediaRecorder.onstop = () => {
              track.stop();
              this.mediaStream_.getAudioTracks()[0].stop();
              this.mediaStream_.removeTrack(track);
              console.log(`Completed recording ${this.utterance.text}`, this.chunks);
              resolve(this);
            }
            this.mediaRecorder.start();
            this.utterance.onstart = () => {
              console.log(`Starting recording SpeechSynthesisUtterance ${this.utterance.text}`);
            }
            this.utterance.onend = () => {
              this.mediaRecorder.stop();
              console.log(`Ending recording SpeechSynthesisUtterance ${this.utterance.text}`);
            }
            this.speechSynthesis.speak(this.utterance);
          }));
      }
      blob() {
        if (!this.chunks.length) throw new Error("no data to return");
        return Promise.resolve({tts:this, data:new Blob(this.chunks, {
          type: this.mimeType
        })});
      }
      arrayBuffer(blob) {
        if (!this.chunks.length) throw new Error("no data to return");
        return new Promise(resolve => {
          const reader = new FileReader;
          reader.onload = e => resolve(({
            tts: this,
            data: reader.result
          }));
          reader.readAsArrayBuffer(blob ? new Blob(blob, {
            type: blob.type
          }) : new Blob(this.chunks, {
            type: this.mimeType
          }));
        });
      }
      audioBuffer() {
        if (!this.chunks.length) throw new Error("no data to return");
        return this.arrayBuffer()
          .then(ab => this.audioContext.decodeAudioData(ab))
          .then(buffer => ({
            tts: this,
            data: buffer
          }))
      }
      mediaSource() {
        if (!this.chunks.length) throw new Error("no data to return");
        return this.arrayBuffer()
          .then(({data:ab}) => new Promise((resolve, reject) => {
            this.mediaSource_.onsourceended = () => resolve({
              tts: this,
              data: this.mediaSource_
            });
            this.mediaSource_.onsourceopen = () => {
              if (MediaSource.isTypeSupported(this.mimeType)) {

                const sourceBuffer = this.mediaSource_.addSourceBuffer(this.mimeType);

                sourceBuffer.mode = "sequence";

                sourceBuffer.onupdateend = () =>
                  this.mediaSource_.endOfStream();

                sourceBuffer.appendBuffer(ab);
              } else {
                reject(`${this.mimeType} is not supported`)
              }
            }

            this.audioNode.src = URL.createObjectURL(this.mediaSource_);

          }));

      }
      readableStream(size = 1024, rsOptions = {}) {
        if (!this.chunks.length) throw new Error("no data to return");
        const src = this.chunks.slice(0);
        const chunk = size;
        return Promise.resolve({
          tts: this,
          data: new ReadableStream({
            start(controller) {
                console.log(src.length);
                controller.enqueue(src.splice(0, chunk))
              },
              pull(controller) {
                if (src.length = 0) controller.close();
                controller.enqueue(src.splice(0, chunk));
              }
          }, rsOptions)

        });
      }
    }
