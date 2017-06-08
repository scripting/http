
const davehttp = require ("davehttp"); 
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
			}
		theRequest.httpReturn (503, "text/plain", "That's something we can't do for you. Sorry!! ;-(");
		});
	}

startup ();
