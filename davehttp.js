exports.start = startup; 

const fs = require ("fs");
const request = require ("request");
const http = require ("http"); 
const https = require ("https");
const urlpack = require ("url");
const strftime = require ("strftime");
const dns = require ("dns");
const utils = require ("daveutils"); 

var stats = {
	ctStarts: 0, 
	whenLastStart: new Date (0),
	ctHits: 0, ctHitsToday: 0,
	whenLastHit: new Date (0),
	ctWriteStats: 0,
	whenLastWriteStats: new Date (0),
	hitsByDomain: {},
	hitsByDomainToday: {},
	hitsByUrlToday: {}
	};
var flStatsDirty = false;

function startup (config, callback) {
	console.log ("davehttp.startup: launching on port == " + config.port);
	function handleRequest (httpRequest, httpResponse) {
		function doHttpReturn (code, type, s) { //10/7/16 by DW
			httpResponse.writeHead (code, {"Content-Type": type});
			httpResponse.end (s);    
			}
		
		var parsedUrl = urlpack.parse (httpRequest.url, true);
		
		var myRequest = {
			method: httpRequest.method,
			lowermethod: httpRequest.method.toLowerCase (),
			path: parsedUrl.pathname,
			lowerpath: parsedUrl.pathname.toLowerCase (),
			params: {},
			host: httpRequest.headers.host,
			lowerhost: httpRequest.headers.host.toLowerCase (),
			port: 80,
			referrer: undefined,
			flLocalRequest: false,
			flNoCache: utils.getBoolean (parsedUrl.query.nocache),
			client: httpRequest.connection.remoteAddress,
			now: new Date (),
			sysRequest: httpRequest,
			sysResponse: httpResponse,
			httpReturn: doHttpReturn
			};
		
		if (utils.stringContains (myRequest.host, ":")) { //set host and port
			myRequest.port = utils.stringNthField (myRequest.host, ":", 2);
			myRequest.host = utils.stringNthField (myRequest.host, ":", 1);
			}
		myRequest.lowerhost = myRequest.host.toLowerCase ();
		myRequest.flLocalRequest = utils.beginsWith (myRequest.lowerhost, "localhost");
		
		myRequest.referrer = httpRequest.headers.referer;
		if (myRequest.referrer === undefined) {
			myRequest.referrer = "";
			}
		
		for (var x in parsedUrl.query) {
			myRequest.params [x] = parsedUrl.query [x];
			}
		
		dns.reverse (httpRequest.connection.remoteAddress, function (err, domains) {
			if (!err) {
				if (domains.length > 0) {
					myRequest.client = domains [0];
					}
				}
			if (myRequest.client === undefined) { 
				myRequest.client = "";
				}
			if (config.flLogToConsole) {
				console.log (myRequest.now.toLocaleTimeString () + " " + myRequest.method + " " + myRequest.host + ":" + myRequest.port + " " + myRequest.lowerpath + " " + myRequest.referrer + " " + myRequest.client);
				}
			//stats
				//hits today
					if (!utils.sameDay (myRequest.now, stats.whenLastHit)) { //day rollover
						stats.ctHitsToday = 0;
						stats.hitsByDomainToday = {};
						stats.hitsByUrlToday = {};
						}
				stats.ctHits++;
				stats.whenLastHit = myRequest.now;
				stats.ctHitsToday++;
				flStatsDirty = true;
			if (callback !== undefined) {
				try {
					callback (myRequest);
					}
				catch (tryError) {
					console.log ("handleRequest: tryError.message == " + tryError.message);
					doHttpReturn (503, "text/plain", tryError.message);
					}
				}
			});
		}
	http.createServer (handleRequest).listen (config.port);
	};



