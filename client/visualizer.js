/*
 * Copyright 2013 Boris Smus. All Rights Reserved.

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.

 * Modified by Brett van Zuiden
 */


var WIDTH = 640;
var HEIGHT = 360;

// Interesting parameters to tweak!
var SMOOTHING = 0.1;
var FFT_SIZE = 2048;

var freqs;
var times;
var shown = false;

Visualizer = {};
Visualizer.initialize = function() {
  Visualizer.analyser = Audio.context.createAnalyser();

  Visualizer.analyser.minDecibels = -100;
  Visualizer.analyser.maxDecibels = 0;
  freqs = new Uint8Array(Visualizer.analyser.frequencyBinCount);
  times = new Uint8Array(Visualizer.analyser.frequencyBinCount);
}

// Toggle playback
Visualizer.show = function() {
  // Connect graph
  Microphone.audioStream.connect(Visualizer.analyser);

  // Start visualizer.
  Visualizer.draw();
  shown = true;
};

var canvas;
Template.visualizer.rendered = function(){
  console.log("Rendered");
  canvas = this.find('#visualizer');
};

Visualizer.draw = function(){
  requestAnimFrame(Visualizer.drawLoop);
  //also draw the main pitches
  Visualizer.drawPitches();
};

var pitchCycle = 0.1;
var pitchThreshold = Microphone.defaultThreshold;
var pitchesToDraw = {};
Visualizer.drawPitches = function() {
    Microphone.calculatePitches(pitchCycle, pitchThreshold, function(pitches) {
        pitchesToDraw = pitches;

        //loop
        Visualizer.drawPitches();
    });
};

Visualizer.drawLoop = function() {
  Visualizer.analyser.smoothingTimeConstant = SMOOTHING;
  Visualizer.analyser.fftSize = FFT_SIZE;

  // Get the frequency data from the currently playing music
  Visualizer.analyser.getByteFrequencyData(freqs);
  Visualizer.analyser.getByteTimeDomainData(times);

  var width = Math.floor(1/freqs.length, 10);

  canvas.style.display = "block";
  var drawContext = canvas.getContext('2d');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  // Draw the frequency domain chart.
  for (var i = 0; i < Visualizer.analyser.frequencyBinCount; i++) {
    var value = freqs[i];
    var percent = value / 256;
    var height = HEIGHT * percent;
    var offset = HEIGHT - height - 1;
    var barWidth = WIDTH/Visualizer.analyser.frequencyBinCount;
    var hue = i/Visualizer.analyser.frequencyBinCount * 360;
    drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
    drawContext.fillRect(i * barWidth, offset, barWidth, height);
  }

  // Draw the time domain chart.
  for (var i = 0; i < Visualizer.analyser.frequencyBinCount; i++) {
    var value = times[i];
    var percent = value / 256;
    var height = HEIGHT * percent;
    var offset = HEIGHT - height - 1;
    var barWidth = WIDTH/Visualizer.analyser.frequencyBinCount;
    drawContext.fillStyle = 'white';
    drawContext.fillRect(i * barWidth, offset, 1, 2);
  }

  var bestFreq;
  var best = 0;
  var nyquist = Audio.context.sampleRate / 2;
  var pitches = pitchesToDraw;
  var pitchWidth = 30;
  for (var freq in pitches) {
      if (pitches[freq] > best) {
          best = pitches[freq];
          bestFreq = freq;
      }
      var height = HEIGHT * pitches[freq];
      var offset = HEIGHT - height - 1;
      var i = freq/nyquist * freqs.length;
      drawContext.fillStyle = 'blue';
      drawContext.fillRect(i * barWidth - pitchWidth/2, offset, pitchWidth, 2);
      drawContext.fillStyle = 'red';
      drawContext.fillRect(i * barWidth, offset, barWidth, 2);
  }
  drawContext.fillStyle = 'green';
  var height = HEIGHT * best;
  var offset = HEIGHT - height - 3;
  var i = bestFreq/nyquist * freqs.length;
  drawContext.fillRect(i * barWidth - pitchWidth/2, offset, pitchWidth, 6);
  drawContext.fillStyle = 'red';
  drawContext.fillRect(i * barWidth, offset, barWidth, 6);

  if (shown) {
      requestAnimFrame(Visualizer.drawLoop);
  }
}

Visualizer.getFrequencyValue = function(freq) {
  var nyquist = Audio.context.sampleRate/2;
  var index = Math.round(freq/nyquist * freqs.length);
  return freqs[index];
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
return  window.requestAnimationFrame       || 
  window.webkitRequestAnimationFrame || 
  window.mozRequestAnimationFrame    || 
  window.oRequestAnimationFrame      || 
  window.msRequestAnimationFrame     || 
  function( callback ){
  window.setTimeout(callback, 1000 / 60);
};
})();
