

var audioLibParams = {
	explosion :["noise",1.0000,0.6610,0.0000,0.0300,2.1960,2.0000,20.0000, 440.0000,2000.0000,0.0000,0.0000,0.0000,7.9763,0.0003,0.0000,0.0000,0.1000,0.0000,0.0000,0.0000,-0.0100,0.0260,0.3210,1.0000,1.0000,0.0000,0.0000],
	thruster : ["noise",0.0000,1.0000,0.0000,10.0000,0.0000,0.0000,20.0000, 281.0000,2400.0000,0.0000,0.0000,0.0000,7.9763,0.0003,0.0000,0.0000,0.0000,0.2515,0.0000,0.2544,0.0000,0.0000,0.2730,0.0000,0.3790,0.0000,0.0000],
	beep :    ["square",0.0000, 0.030,0.0000,0.3000,0.0000,0.0000,20.0000,1210.0000,  20.0000,0.0000,0.0000,0.0000,7.9763,0.0003,0.0000,0.0000,0.1000,0.0000,0.0000,0.4632,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]

 };

var samples = jsfxlib.createWaves(audioLibParams);
  //samples.test.play();
  //samples.explosion.play();
//samples.thruster.loop = true;
//samples.thruster.play();

samples.beep.volume = 0.3;
var thrustSound = samples.thruster;
var thrustInterval = 0;
var thrustPlaying = false;
var thrustVolume = 0;
var thrustTargetVolume = 0 ;

//playThruster();

function setThrustVolume(vol) {
	thrustTargetVolume = vol;
	if((vol>0) && (!thrustPlaying)) {
		playThruster();
	}


}

function playThruster() {
	if(thrustInterval) clearInterval(thrustInterval);
	if(thrustPlaying) {
		thrustSound.pause();

	}

	thrustSound.play();
	thrustSound.currentTime =0;
	thrustInterval = setInterval(updateThruster, 10);
	thrustPlaying = true;
}

function updateThruster(e) {
	if(touchable) return;
	if(thrustSound.currentTime>8.5) thrustSound.currentTime=0.1;
	if(thrustVolume!=thrustTargetVolume){
		thrustVolume+=((thrustTargetVolume-thrustVolume)*0.1);
		if(Math.abs(thrustVolume-thrustTargetVolume)<0.01)
			thrustVolume = thrustTargetVolume;

		thrustSound.volume = thrustVolume;
	}
	if(thrustVolume<=0) stopThruster();

}
function stopThruster() {
	if(touchable) return;

	if(!thrustPlaying) return;

	//thrustSound.currentTime = 2.5;
	clearInterval(thrustInterval);
	thrustPlaying = false;


}



