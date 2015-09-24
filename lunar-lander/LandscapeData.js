
function Landscape(){

	var points = this.points = [],
		lines = this.lines = [],
		stars = this.stars = [],
		availableZones = [],
		zoneCombis = [],
		currentCombi = 0,
		zoneInfos = [],
		landscale = 1.5,
		rightedge,
		flickerProgress = 0;

	setupData();


	rightedge = this.tileWidth = points[points.length - 1].x * landscale ;

	for (var i = 0; i<points.length; i++){
		var p = points[i];
		p.x *= landscale;
		p.y *= landscale;
		p.y -= 50;

	}

	for(var i = 1;i < points.length; i++){
		var p1 = points[i-1];
		var p2 = points[i];
		lines.push(new LandscapeLine(p1, p2));
	}


	// make stars...



	for(var i = 0;i < lines.length;i++)	{
		if(Math.random() < 0.1) {
			var line  = lines[i];

			var star = { x:line.p1.x, y: Math.random() *600 };

			if((star.y < line.p1.y) && (star.y < line.p2.y)) {
				stars.push(star);
			}
		}
	}


	//	var pointcount = points.length;

		//var dirtyRectangles = [];



	var render = this.render = function(c, view) {

		var offset = 0;

		while(view.left-offset>rightedge) {
			offset+=rightedge;
		}

		while(view.left-offset<0) {
			offset-=rightedge;
		}

		var startOffset = offset;

		var i = 0;

		while(lines[i].p2.x+offset<view.left) {
			i++;
			if(i>lines.length) {
				i=0;
				offset+=rightedge;
			}
		}

		c.beginPath();

		var line = lines[i];
		var offsetY = 0;
		if(Math.random()<0.3) {
			offset+=(0.2/view.scale);
			offsetY = (0.2/view.scale);
		}
		c.moveTo(line.p1.x + offset, line.p1.y + offsetY);

		var zoneInfoIndex = 0;

		while((line = lines[i]).p1.x+offset<view.right) {

			var point = line.p2;
			c.lineTo(point.x+offset, point.y);

			if((counter%20>10) && (line.multiplier!=1)){
				var infoBox;

				if(!zoneInfos[zoneInfoIndex]) {
					infoBox = zoneInfos[zoneInfoIndex] = new InfoBox(1,50);
					document.body.appendChild(infoBox.domElement);
				} else {
					infoBox = zoneInfos[zoneInfoIndex];
					infoBox.show();
				}
				infoBox.setText(line.multiplier+'x');
				infoBox.setX(((((line.p2.x-line.p1.x)/2)+line.p1.x+offset)*view.scale)+view.x);
				infoBox.setY(((line.p2.y+2) *view.scale)+view.y);
				zoneInfoIndex++;

			}

			i++;
			if(i>=lines.length) {
				i=0;
				offset+=rightedge;
			}


		}

		var flickerAmount = Math.sin(counter*0.8)*0.5 + 0.5;

		if(flickerAmount>0.5) {
			c.lineWidth = 2/view.scale;
			var channel = Math.round((flickerAmount-0.5)*(100));
			c.strokeStyle = "rgb("+channel+","+channel+","+channel+")";
			c.stroke();
		}
		c.strokeStyle = 'white';


		c.lineWidth = 1/view.scale * (flickerAmount*0.2+0.8);
		c.lineJoin = 'bevel';
		c.stroke();


		for(var i=zoneInfoIndex; i<zoneInfos.length; i++) {
			zoneInfos[i].hide();
		}


		// draw stars :


		i = 0;
		offset = startOffset;

		while(stars[i].x+offset<view.left) {
			i++;
			if(i>=stars.length) {
				i=0;
				offset+=rightedge;
			}
		}

		c.beginPath();

		while((star = stars[i]).x+offset<view.right) {

			var starx = star.x+offset;
			var stary = star.y;
			while(view.bottom<stary) stary-=600;

			c.rect(starx, stary, (1/view.scale),(1/view.scale));
			if(stary-600>view.top) {
				stary-=600;
				c.rect(starx, stary, (1/view.scale),(1/view.scale));

			}

			i++;
			if(i>=stars.length) {
				i=0;
				offset+=rightedge;
			}


		}

		c.stroke();


		//code to check landable...
		// c.beginPath();
		// for(var i=0; i<lines.length; i++) {
		// 	var line = lines[i];
		// 	if(line.checked) {
		// 		c.moveTo(line.p1.x, line.p1.y);
		// 		c.lineTo(line.p2.x, line.p2.y);
		//
		// 		if(line.p2.x+rightedge < view.right) {
		// 				c.moveTo(line.p1.x+rightedge, line.p1.y);
		// 				c.lineTo(line.p2.x+rightedge, line.p2.y);
		//
		// 		}
		// 	}
		// }
		// c.strokeStyle = 'red';
		// c.stroke();

	};

	this.setZones = function () {

		for (var i=0; i<lines.length; i++)
		{
			lines[i].multiplier = 1;
		}

		var combi = zoneCombis[currentCombi];

		for (var i = 0; i<combi.length; i++)
		{
			var zonenumber = combi[i];
			var zone = availableZones[zonenumber];
			line = lines[zone.lineNum];

			// var zoneLabel : TextDisplay = zoneLabels[i];
			// 		zoneLabel.x = line.p1.x + ((line.p2.x - line.p1.x) / 2);
			// 		zoneLabel.y = line.p1.y;
			// 		zoneLabel.text = zone.multiplier + "X";
			line.multiplier = zone.multiplier;

		}

		currentCombi++;
		if(currentCombi >= zoneCombis.length) currentCombi = 0;
	};




	function setupData() {
		points.push(new Vector2(0.5, 355.55));
		points.push(new Vector2(5.45, 355.55));
		points.push(new Vector2(6.45, 359.4));
		points.push(new Vector2(11.15, 359.4));
		points.push(new Vector2(12.1, 363.65));
		points.push(new Vector2(14.6, 363.65));
		points.push(new Vector2(15.95, 375.75));
		points.push(new Vector2(19.25, 388));
		points.push(new Vector2(19.25, 391.9));
		points.push(new Vector2(21.65, 400));
		points.push(new Vector2(28.85, 404.25));
		points.push(new Vector2(30.7, 412.4));
		points.push(new Vector2(33.05, 416.7));
		points.push(new Vector2(37.9, 420.5));
		points.push(new Vector2(42.7, 420.5));
		points.push(new Vector2(47.4, 416.65));
		points.push(new Vector2(51.75, 409.5));
		points.push(new Vector2(56.55, 404.25));
		points.push(new Vector2(61.3, 400));
		points.push(new Vector2(63.65, 396.15));
		points.push(new Vector2(68, 391.9));
		points.push(new Vector2(70.3, 388));
		points.push(new Vector2(75.1, 386.1));
		points.push(new Vector2(79.85, 379.95));
		points.push(new Vector2(84.7, 378.95));
		points.push(new Vector2(89.05, 375.65));
		points.push(new Vector2(93.75, 375.65));
		points.push(new Vector2(98.5, 376.55));
		points.push(new Vector2(103.2, 379.95));
		points.push(new Vector2(104.3, 383.8));
		points.push(new Vector2(107.55, 388));
		points.push(new Vector2(108.95, 391.9));
		points.push(new Vector2(112.4, 396.15));
		points.push(new Vector2(113.3, 400));
		points.push(new Vector2(117.1, 404.25));
		points.push(new Vector2(121.95, 404.25));
		points.push(new Vector2(125.3, 396.3));
		points.push(new Vector2(128.6, 394.2));
		points.push(new Vector2(132.45, 396.15));
		points.push(new Vector2(135.75, 399.9));
		points.push(new Vector2(138.15, 408.15));
		points.push(new Vector2(144.7, 412.4));
		points.push(new Vector2(146.3, 424.8));
		points.push(new Vector2(149.55, 436.65));
		points.push(new Vector2(149.55, 441.05));
		points.push(new Vector2(154.35, 444.85));
		points.push(new Vector2(163.45, 444.85));
		points.push(new Vector2(168.15, 441.05));
		points.push(new Vector2(172.95, 436.75));
		points.push(new Vector2(175.45, 432.9));
		points.push(new Vector2(179.7, 428.6));
		points.push(new Vector2(181.95, 424.8));
		points.push(new Vector2(186.7, 422.5));
		points.push(new Vector2(189.15, 412.4));
		points.push(new Vector2(191.55, 404.35));
		points.push(new Vector2(196.35, 402.4));
		points.push(new Vector2(200.7, 398.1));
		points.push(new Vector2(205.45, 391.9));
		points.push(new Vector2(210.15, 383.8));
		points.push(new Vector2(212.55, 375.75));
		points.push(new Vector2(216.85, 371.8));
		points.push(new Vector2(219.3, 367.55));
		points.push(new Vector2(220.65, 363.65));
		points.push(new Vector2(224, 359.4));
		points.push(new Vector2(228.8, 359.4));
		points.push(new Vector2(233.55, 355.55));
		points.push(new Vector2(237.85, 348.45));
		points.push(new Vector2(242.65, 343.2));
		points.push(new Vector2(245, 335.15));
		points.push(new Vector2(247.35, 322.8));
		points.push(new Vector2(247.3, 314.5));
		points.push(new Vector2(248.35, 306.55));
		points.push(new Vector2(252.2, 296.5));
		points.push(new Vector2(256.55, 294.55));
		points.push(new Vector2(257.95, 290.4));
		points.push(new Vector2(261.25, 285.95));
		points.push(new Vector2(265.95, 285.95));
		points.push(new Vector2(267, 290.25));
		points.push(new Vector2(271.75, 290.25));
		points.push(new Vector2(273.25, 294.55));
		points.push(new Vector2(275.2, 294.55));
		points.push(new Vector2(278.95, 296.5));
		points.push(new Vector2(282.25, 300.3));
		points.push(new Vector2(284.7, 308.45));
		points.push(new Vector2(291.85, 312.65));
		points.push(new Vector2(298.55, 330.8));
		points.push(new Vector2(303.25, 331.8));
		points.push(new Vector2(308, 335.05));
		points.push(new Vector2(309, 338.9));
		points.push(new Vector2(312.35, 343.2));
		points.push(new Vector2(313.8, 347.05));
		points.push(new Vector2(317.05, 351.4));
		points.push(new Vector2(321.9, 351.4));
		points.push(new Vector2(322.85, 363.8));
		points.push(new Vector2(326.6, 375.75));
		points.push(new Vector2(326.6, 379.95));
		points.push(new Vector2(330.9, 379.95));
		points.push(new Vector2(332.4, 383.8));
		points.push(new Vector2(335.8, 388));
		points.push(new Vector2(338.1, 396.15));
		points.push(new Vector2(340.45, 400.1));
		points.push(new Vector2(345.3, 404.25));
		points.push(new Vector2(346.25, 416.65));
		points.push(new Vector2(349.6, 428.7));
		points.push(new Vector2(349.6, 432.85));
		points.push(new Vector2(350.95, 436.75));
		points.push(new Vector2(354.3, 441.05));
		points.push(new Vector2(359, 441.05));
		points.push(new Vector2(361.4, 449.1));
		points.push(new Vector2(363.95, 453));
		points.push(new Vector2(368.2, 457.2));
		points.push(new Vector2(372.9, 461));
		points.push(new Vector2(410.2, 461));
		points.push(new Vector2(412.55, 449.1));
		points.push(new Vector2(417.4, 441.05));
		points.push(new Vector2(419.7, 432.9));
		points.push(new Vector2(422.05, 432.9));
		points.push(new Vector2(425.45, 424.8));
		points.push(new Vector2(428.8, 422.35));
		points.push(new Vector2(433.45, 416.65));
		points.push(new Vector2(438.25, 415.15));
		points.push(new Vector2(442.6, 412.4));
		points.push(new Vector2(447.4, 412.4));
		points.push(new Vector2(448.8, 416.65));
		points.push(new Vector2(454.55, 430.55));
		points.push(new Vector2(455.5, 434.8));
		points.push(new Vector2(459.25, 438.6));
		points.push(new Vector2(462.6, 440.9));
		points.push(new Vector2(466, 444.85));
		points.push(new Vector2(468.35, 452.9));
		points.push(new Vector2(475.55, 457.3));
		points.push(new Vector2(484.7, 457.3));
		points.push(new Vector2(494.7, 458.2));
		points.push(new Vector2(503.75, 461.1));
		points.push(new Vector2(522.2, 461.1));
		points.push(new Vector2(524.75, 453));
		points.push(new Vector2(527.1, 441.05));
		points.push(new Vector2(527.1, 432.9));
		points.push(new Vector2(531.9, 432.9));
		points.push(new Vector2(534.15, 424.8));
		points.push(new Vector2(538.6, 420.5));
		points.push(new Vector2(540.9, 416.65));
		points.push(new Vector2(542.35, 412.5));
		points.push(new Vector2(545.7, 408));
		points.push(new Vector2(550.45, 408));
		points.push(new Vector2(552.85, 398.1));
		points.push(new Vector2(554.75, 389.95));
		points.push(new Vector2(559.55, 388));
		points.push(new Vector2(564.35, 391.9));
		points.push(new Vector2(573.35, 391.9));
		points.push(new Vector2(578.1, 388));
		points.push(new Vector2(579.55, 379.95));
		points.push(new Vector2(582.9, 369.4));
		points.push(new Vector2(587.75, 367.55));
		points.push(new Vector2(588.65, 363.8));
		points.push(new Vector2(592.05, 359.5));
		points.push(new Vector2(596.85, 355.55));






		availableZones.push(new LandingZone(0, 4));
		availableZones.push(new LandingZone(13, 3));
		availableZones.push(new LandingZone(25, 4));
		availableZones.push(new LandingZone(34, 4));
		availableZones.push(new LandingZone(63, 5));
		availableZones.push(new LandingZone(75, 4));
		availableZones.push(new LandingZone(106, 5));
		availableZones.push(new LandingZone(111, 2));
		availableZones.push(new LandingZone(121, 5));
		availableZones.push(new LandingZone(133, 2));
		availableZones.push(new LandingZone(148, 3));


		zoneCombis.push([2,3,7,9]);
		zoneCombis.push([7,8,9,10]);
		zoneCombis.push([2,3,7,9]);
		zoneCombis.push([1,4,7,9]);
		zoneCombis.push([0,5,7,9]);
		zoneCombis.push([6,7,8,9]);
		zoneCombis.push([1,4,7,9]);





	}


};

function LandscapeLine(p1, p2) {
	this.p1 = p1;
	this.p2 = p2;
	this.landable = (p1.y==p2.y);
	this.multiplier = 1;

}

function LandingZone(linenum, multi) {

	this.lineNum = linenum;
	this.multiplier = multi;
}
