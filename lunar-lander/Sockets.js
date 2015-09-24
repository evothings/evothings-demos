var ws,
	wsID,
	wsConnected = false,
	players = {},
	connectionRetryTimeout = 1000;


	function initWebSocket() {

		if(WEB_SOCKET_URL!="") {
			ws = new WebSocket("ws://"+WEB_SOCKET_URL);
			console.log('Attempting connection '+WEB_SOCKET_URL);
			ws.onopen = function(e) {

				console.log('Connected to '+WEB_SOCKET_URL);
				wsConnected = true;



			};

			// not sure we need this for the normal client...
			ws.onmessage = function(e) {
				//console.log(e.data);

				var msg = JSON.parse(e.data);

				if(msg.type=='connect') {
					wsID = msg.id;
					sendLocation();

				} /*else if(msg.type=='join') {
					// add new player object
				} else if(msg.type=='update') {
					// update player object
					if(!players[msg.id]) {
						players[msg.id] = new Lander();
						players[msg.id].scale = lander.scale;
					}
					var player = players[msg.id];
					player.pos.x = msg.x/100;
					player.pos.y = msg.y/100;
					player.rotation = msg.a;
					player.thrusting = (msg.t == 1);

				} else if(msg.type=='leave') {
					// delete player object
					if(players[msg.id]) delete players[msg.id];

				}*/



			};
			ws.onclose = function(e) {
				wsConnected = false;
				console.log("disconnected from "+WEB_SOCKET_URL);
				if(connectionRetryTimeout) {
					setTimeout(initWebSocket,connectionRetryTimeout);
				}
			};
		}


	}

	function sendObject(obj) {
		sendSocket(JSON.stringify(obj));

	}

	function sendSocket(msg) {
		if(wsConnected ) {
			ws.send(msg);
		//	console.log(msg);
		}

	}
	function sendLocation() {
		var sendit = false;

		var update = {id:wsID, type:'location'};

		if(typeof IP_ADDRESS!='undefined') {
			update.ip = IP_ADDRESS;
			sendit = true;
		}
		if(typeof loc!='undefined') {
			update.lat = loc.lat;
			update.lon = loc.long;
			update.city = loc.city;
			update.country = loc.country;
			sendit = true;
		}

		if(sendit) sendObject(update);

	}
