if (Meteor.isClient) {
  Meteor.startup(function(){
    if (!Speaker.supported || !Microphone.supported) {
        alert("This browser does not support the necessary HTML5 APIs, please upgrade to a newer version of chrome or safari");
    }

    Speaker.initialize();
    Microphone.initialize();
    Visualizer.initialize();
  });

  Template.controls.greeting = function () {
    return "Welcome to echolocation.";
  };

  Template.controls.events({
    'click #play' : function () {
      Speaker.playTone(440, 1);
    },
    'click #listen' : function() {
      /*
      Microphone.calculatePitches(.5, 0.3, function(pitches) {
        console.log(pitches);
      });
      */
      Microphone.calculatePitch(1, function(pitch) {
        console.log(pitch);
      });
    },
    'click #visualize' : function() {
      Visualizer.show();
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
