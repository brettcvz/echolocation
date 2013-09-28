Microphone = {};

window.navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;

Microphone.supported = !!navigator.getUserMedia && Audio.supported;
Microphone.defaultThreshold = 0.3;

Microphone.initialize = function(){
    if (!Microphone.supported) {
        console.error("This browser does not support the necessary user media APIs");
        return false;
    }

    try {
        navigator.getUserMedia({audio: true}, function(localMediaStream) {
            Microphone.mediaStream = localMediaStream;
            Microphone.audioStream = Audio.context.createMediaStreamSource(Microphone.mediaStream);
        }, function(e){
            console.error("Failed to get the audio stream. Error: ", e);
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

Microphone.calculatePitch = function(duration, callback) {
    Microphone.calculatePitches(duration, Microphone.defaultThreshold, function(pitches) {
        var bestP;
        var best = 0;
        for (var p in pitches) {
            if (pitches[p] > best) {
                best = pitches[p];
                bestP = p;
            }
        }

        callback(bestP, best);
    });
};

//Duration in seconds, calculates over the interval
Microphone.calculatePitches = function(duration, threshold, callback) {
    //Setup
    var analyser = Audio.context.createAnalyser();
    analyser.smoothingTimeConstant = 0.1;
    analyser.fftSize = 2048;
    analyser.minDecibels = -100;
    analyser.maxDecibels = 0;

    var freqs = new Uint8Array(analyser.frequencyBinCount);
    //var times = new Uint8Array(analyser.frequencyBinCount);

    Microphone.audioStream.connect(analyser);

    //Sum over the duration specified, then determine the winners
    var sampleRate = 10; //ms
    var sums = new Uint32Array(analyser.frequencyBinCount); //bigger so we don't overflow
    var runs = 0;
    var sampleInterval = window.setInterval(function(){
      //fetch the data
      analyser.getByteFrequencyData(freqs);

      //collect it
      for (var i = 0; i < analyser.frequencyBinCount; i++) {
        sums[i] = (sums[i] || 0) + freqs[i];
      }
      runs++;
    }, sampleRate);

    var nyquist = Audio.context.sampleRate / 2;
    //Now that we're done, process
    var pitches = {};
    window.setTimeout(function(){
        window.clearInterval(sampleInterval);
        for (var i = 0; i < analyser.frequencyBinCount; i++) {
            var percent = sums[i] / (256 * runs);

            if (percent > threshold) {
                var frequency = i/freqs.length * nyquist;
                pitches[frequency] = percent;
            }
        }
        callback(pitches);
    }, duration * 1000);
};