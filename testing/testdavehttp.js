const davehttp = require ("../davehttp.js"); 
const utils = require ("daveutils"); 

var config = {
	port: 1401,
	flLogToConsole: true
	}

function startup () {
	davehttp.start (config, function (theRequest) {
		switch (theRequest.lowerpath) {
			case "/add":
				theRequest.httpReturn (200, "text/plain", theRequest.params.a + theRequest.params.b);
				return;
			case "/err":
				var x = undefined;
				return (x.badreference);
			}
		theRequest.httpReturn (500, "text/plain", "That's something we can't do for you. Sorry!! ;-(");
		});
	}

startup ();
