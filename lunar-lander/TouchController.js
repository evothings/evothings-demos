function TouchController() {

	var touchController = this;
	document.body.addEventListener( 'touchstart', onTouchStart, false );
	document.body.addEventListener( 'touchmove', onTouchMove, false );
	document.body.addEventListener( 'touchend', onTouchEnd, false );


	var leftTouch = this.leftTouch = new TouchData();
	var	rightTouch =this.rightTouch = new TouchData();
	this.active = false; // used to know if there have been any touch events


	function onTouchStart(e) {

		e.preventDefault();
		touchController.active = true;

		for(var i = 0; i<e.changedTouches.length; i++){
			var touch =e.changedTouches[i];

			if((!leftTouch.touching) && (touch.clientX<window.innerWidth/2)) {
				// set up left touch
				leftTouch.startTouch(touch.clientX, touch.clientY, touch.identifier);
			} else if((!rightTouch.touching) && (touch.clientX>window.innerWidth/2)){
				// set up right touch
				rightTouch.startTouch(touch.clientX, touch.clientY, touch.identifier);
			}

		}

	}

	function onTouchMove(e) {
		e.preventDefault();
	//	console.log("TOUCH MOVE");
		for(var i = 0; i<e.changedTouches.length; i++){
			var touch =e.changedTouches[i];
			if(leftTouch.ID == touch.identifier) {
				// update leftTouch
				leftTouch.updateTouch(touch.clientX, touch.clientY);

				//	console.log("update left touch", touch.clientX, touch.clientY);

			} else if(rightTouch.ID == touch.identifier) {
				rightTouch.updateTouch(touch.clientX, touch.clientY);
			}

		}
	}

	function onTouchEnd(e) {
		e.preventDefault();

		//console.log("TOUCH END");
		for(var i = 0; i<e.changedTouches.length; i++){
			var touch =e.changedTouches[i];
			//console.log(touch.identifier, leftTouch.ID);
			if(leftTouch.ID == touch.identifier) {
				// end leftTouch
				//console.log("LEFT TOUCH END");
				leftTouch.endTouch();

			} else if(rightTouch.ID == touch.identifier) {
				// end right touch
				rightTouch.endTouch()
			}

		}

	}

	this.render = function(c) {

		//console.log(leftTouch);
		if(leftTouch.touching) {
			c.beginPath();
			c.strokeStyle = "red";
			c.lineWidth = "6";
			c.arc(leftTouch.getX(), leftTouch.getY(), 40, 0, Math.PI*2, true);
			c.stroke();
		}
		if(rightTouch.touching) {
			c.beginPath();
			c.strokeStyle = "blue";
			c.lineWidth = "6";
			c.arc(rightTouch.getX(), rightTouch.getY(), 40, 0, Math.PI*2, true);
			c.stroke();
		}



	}

}

function TouchData() {

	this.ID = -1;
	this.touching = false;
	this.touchStartPos = new Vector2();
	this.touchVector = new Vector2();
	this.touchPos = new Vector2();

}

TouchData.prototype = {
	startTouch : function(x,y,ID) {
		this.ID = ID;
		this.touching = true;
		this.touchStartPos.reset(x,y);
		this.touchVector.reset(0,0);
		this.touchPos.reset(x,y);
	},
	updateTouch : function(x,y) {
		this.touchPos.reset(x,y);
		this.touchVector.reset(x,y);
		this.touchVector.minusEq(this.touchStartPos);
	},
	endTouch : function() {
		this.touching = false;
		this.ID = -1;
	},
	getX : function() {
		return this.touchPos.x;
	},
	getY : function() {
		return this.touchPos.y;
	},
	getXOffset : function() {
		return this.touchPos.x - this.touchStartPos.x;
	},
	getYOffset : function() {
		return this.touchPos.y - this.touchStartPos.y;
	}
};
