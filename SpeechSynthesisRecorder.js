// SpeechSynthesisRecorder.js guest271314 6-17-2017
// Motivation: Get audio output from `window.speechSynthesis.speak()` call
// as `ArrayBuffer`, `AudioBuffer`, `Blob`, `MediaSource`, `MediaStream`, `ReadableStream`, or other object or data types
// See https://lists.w3.org/Archives/Public/public-speech-api/2017Jun/0000.html
// https://github.com/guest271314/SpeechSynthesisRecorder

// Configuration: Analog Stereo Duplex
// Input Devices: Monitor of Built-in Audio Analog Stereo, Built-in Audio Analog Stereo

/* global MediaRecorder SpeechSynthesisUtterance MediaStream MediaSource AudioContext navigator Blob ReadableStream URL Audio FileReader */
class SpeechSynthesisRecorder {
  constructor({
    text = '', utteranceOptions = {}, recorderOptions = {}, dataType = ''
  }) {
    if (text === '') throw new Error('no words to synthesize')
    this.dataType = dataType
    this.text = text
    this.mimeType = MediaRecorder.isTypeSupported('audio/webm; codecs=opus') ? 'audio/webm; codecs=opus' : 'audio/ogg; codecs=opus'
    this.utterance = new SpeechSynthesisUtterance(this.text)
    this.speechSynthesis = window.speechSynthesis
    this.mediaStream_ = new MediaStream()
    this.mediaSource_ = new MediaSource()
    this.mediaRecorder = new MediaRecorder(this.mediaStream_, {
      mimeType: this.mimeType,
      bitsPerSecond: 256 * 8 * 1024
    })
    this.audioContext = new AudioContext()
    this.audioNode = new Audio()
    this.chunks = []
    if (utteranceOptions) {
      if (utteranceOptions.voice) {
        this.speechSynthesis.onvoiceschanged = e => {
          const voice = this.speechSynthesis.getVoices().find(({
            name: _name
          }) => _name === utteranceOptions.voice)
          this.utterance.voice = voice
          console.log(voice, this.utterance)
        }
        this.speechSynthesis.getVoices()
      }
      let {
        lang, rate, pitch, volume
      } = utteranceOptions;
      console.log(rate)
      Object.assign(this.utterance, {
        lang, rate, pitch, volume
      })
    }
    console.log(this.utterance)
    this.audioNode.controls = 'controls'
    document.body.appendChild(this.audioNode)
  }
  start(text = '') {
    if (text) this.text = text
    if (this.text === '') throw new Error('no words to synthesize')
    return navigator.mediaDevices.getUserMedia({
        audio: true
      })
      // set `getUserMedia()` constraints to "auidooutput", where avaialable
      // see https://bugzilla.mozilla.org/show_bug.cgi?id=934425, https://stackoverflow.com/q/33761770
      .then(stream => navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const audiooutput = devices.find(device => device.kind == "audiooutput");
          stream.getTracks().forEach(track => track.stop())
          if (audiooutput) {
            const constraints = {
              deviceId: {
                exact: audiooutput.deviceId
              }
            };
            return navigator.mediaDevices.getUserMedia({
              audio: constraints
            });
          }
          return navigator.mediaDevices.getUserMedia({
            audio: true
          });
        }))
      .then(stream => new Promise(resolve => {
        const track = stream.getAudioTracks()[0]
        this.mediaStream_.addTrack(track)
          // return the current `MediaStream`
        if (this.dataType && this.dataType === 'mediaStream') {
          resolve({
            tts: this,
            data: this.mediaStream_
          })
        };
        this.mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            this.chunks.push(event.data)
          };
        }
        this.mediaRecorder.onstop = () => {
          track.stop()
          this.mediaStream_.getAudioTracks()[0].stop()
          this.mediaStream_.removeTrack(track)
          console.log(`Completed recording ${this.utterance.text}`, this.chunks)
          resolve(this)
        }
        this.mediaRecorder.start()
        this.utterance.onstart = () => {
          console.log(`Starting recording SpeechSynthesisUtterance ${this.utterance.text}`)
        }
        this.utterance.onend = () => {
          this.mediaRecorder.stop()
          console.log(`Ending recording SpeechSynthesisUtterance ${this.utterance.text}`)
        }
        this.speechSynthesis.speak(this.utterance)
      }))
  }
  blob() {
    if (!this.chunks.length) throw new Error('no data to return')
    return Promise.resolve({
      tts: this,
      data: this.chunks.length === 1 ? this.chunks[0] : new Blob(this.chunks, {
        type: this.mimeType
      })
    })
  }
  arrayBuffer(blob) {
    if (!this.chunks.length) throw new Error('no data to return')
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => resolve(({
        tts: this,
        data: reader.result
      }))
      reader.readAsArrayBuffer(blob ? new Blob(blob, {
        type: blob.type
      }) : this.chunks.length === 1 ? this.chunks[0] : new Blob(this.chunks, {
        type: this.mimeType
      }))
    })
  }
  audioBuffer() {
    if (!this.chunks.length) throw new Error('no data to return')
    return this.arrayBuffer()
      .then(({
        tts, data
      }) => this.audioContext.decodeAudioData(data))
      .then(buffer => ({
        tts: this,
        data: buffer
      }))
  }
  mediaSource() {
    if (!this.chunks.length) throw new Error('no data to return')
    return this.arrayBuffer()
      .then(({
        data: ab
      }) => new Promise((resolve, reject) => {
        this.mediaSource_.onsourceended = () => resolve({
          tts: this,
          data: this.mediaSource_
        })
        this.mediaSource_.onsourceopen = () => {
          if (MediaSource.isTypeSupported(this.mimeType)) {
            const sourceBuffer = this.mediaSource_.addSourceBuffer(this.mimeType)
            sourceBuffer.mode = 'sequence'
            sourceBuffer.onupdateend = () =>
              this.mediaSource_.endOfStream()
            sourceBuffer.appendBuffer(ab)
          } else {
            reject(new Error(`${this.mimeType} is not supported`))
          }
        }
        this.audioNode.src = URL.createObjectURL(this.mediaSource_)
      }))
  }
  readableStream({
    size = 1024, controllerOptions = {}, rsOptions = {}
  }) {
    if (!this.chunks.length) throw new Error('no data to return')
    const src = this.chunks.slice(0)
    const chunk = size
    return Promise.resolve({
      tts: this,
      data: new ReadableStream(controllerOptions || {
        start(controller) {
            console.log(src.length)
            controller.enqueue(src.splice(0, chunk))
          },
          pull(controller) {
            if (src.length === 0) controller.close()
            controller.enqueue(src.splice(0, chunk))
          }
      }, rsOptions)
    })
  }
}
if (typeof module !== 'undefined') module.exports = SpeechSynthesisRecorder
if (typeof window !== 'undefined') window.SpeechSynthesisRecorder = SpeechSynthesisRecorder
