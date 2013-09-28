window.AudioContext = window.AudioContext || window.webkitAudioContext;

Audio = {};
Audio.supported = !!AudioContext;

Audio.context = new AudioContext();