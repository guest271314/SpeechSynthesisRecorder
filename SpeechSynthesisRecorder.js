    // SpeechSynthesisRecorder.js guest271314 <guest271314@gmail.com> 6-17-2017
    // Version 0.0.1
    // Motivation: Get audio output from `window.speechSynthesis.speak()` call
    // as `ArrayBuffer`, `AudioBuffer`, `Blob`, `MediaSource`, `MediaStream`, `ReadableStream`, or other object or data types
    // See https://lists.w3.org/Archives/Public/public-speech-api/2017Jun/0000.html

    // Configuration: Analog Stereo Duplex
    // Input Devices: Monitor of Built-in Audio Analog Stereo, Built-in Audio Analog Stereo
    // Playback: Chromium: Playback, speech-dspatcher: playback
    // Recording: Chrome input: RecordStream from Monitor of Built-in Audio Analog Stereo
    // Issues: Recording: Firefox throws `Uncaught (in promise) NavigatorUserMediaError {name: "TrackStartError", message: "", constraintName: ""}`
    // Issues: `navigator.getUserMedia({audio:true}) throws error Uncaught (in promise) NavigatorUserMediaError {name: "TrackStartError", message: "", constraintName: ""}` and closes when RecordStream from Monitor of Built-in Audio Analog Stereo is set, at *nix OS
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=1373364
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
        this.mediaRecorder = new MediaRecorder(this.mediaStream_, recorderOptions || {
          // does not set value at chromium 58
          /* audioBitsPerSecond: 128000, */ 
          mimeType: "audio/webm; codecs=opus"
        });
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
      async start(text = "") {
        if (text) this.text = text;
        if (this.text === "") throw new Error("no words to synthesize");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        const media = await new Promise(resolve => {
          const track = stream.getAudioTracks()[0];
          this.mediaStream_.addTrack(track);
          // return the current `MediaStream` when available
          if (this.dataType === "mediaStream") {
             const clone = this.mediaStream_;
             resolve({tts:this, data:this.mediaStream_})          
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
        });
        return media
      }
      async blob() {
        if (!this.chunks.length) throw new Error("no data to return");
        const blob = await Promise.resolve(new Blob(this.chunks, {
          type: this.mimeType
        }));
        return blob
      }
      async arrayBuffer(blob) {
        if (!this.chunks.length) throw new Error("no data to return");
        const arrayBuffer = await new Promise(resolve => {
          const reader = new FileReader;
          reader.onload = e => resolve(reader.result);
          reader.readAsArrayBuffer(blob ? new Blob(blob, {type: blob.type}) : new Blob(this.chunks, {
            type: this.mimeType
          }));
        });
        return arrayBuffer
      }
      async audioBuffer() {
        if (!this.chunks.length) throw new Error("no data to return");
        const ab = await this.arrayBuffer();
        const buffer = await this.audioContext.decodeAudioData(ab);
        return buffer
      }     
      async mediaSource() {
        if (!this.chunks.length) throw new Error("no data to return");
        const ab = await this.arrayBuffer();
        const mediaSource = await new Promise((resolve, reject) => {
          this.mediaSource_.onsourceended = () => resolve(this.mediaSource_);
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

        });

        return mediaSource
      }
      async readableStream(size = 1024, rsOptions = {}) {
        if (!this.chunks.length) throw new Error("no data to return");
        const src = this.chunks.slice(0);
        const chunk = size;
        const rs = await new ReadableStream({
          start(controller) {
              console.log(src.length);
              controller.enqueue(src.splice(0, chunk))
            },
            pull(controller) {
              if (src.length = 0) controller.close();
              controller.enqueue(src.splice(0, chunk));
            }
        }, rsOptions);
        return rs
      }
    }

