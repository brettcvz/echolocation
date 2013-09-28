Speaker = {};

Speaker.supported = Audio.supported;

Speaker.initialize = function(){
    if (!Speaker.supported) {
        console.error("This browser does not support the necessary web audio APIs");
        return false;
    }
    Speaker.output = Audio.context.destination;

    return true;
};

Speaker.playSoundBuffer = function(buffer, offset) {
    offset = offset || 0;
    var source = Audio.context.createBufferSource(); // creates a sound source
    source.buffer = buffer;                    // tell the source which sound to play
    source.connect(Speaker.output);       // connect the source to the context's destination (the speakers)
    source.noteOn(offset);                           // play the source at the given offset (default now)
};

Speaker.playTone = function(freq, duration, offset) {
    duration = duration || 1;
    offset = offset || 0;

    var oscillator = Audio.context.createOscillator();
    oscillator.frequency.value = freq;
    oscillator.connect(Speaker.output);

    offset += Audio.context.currentTime;
    oscillator.noteOn(offset);
    oscillator.noteOff(offset + duration);
};

Speaker.playAudioStream = function(stream) {
    stream.connect(Speaker.output);
};