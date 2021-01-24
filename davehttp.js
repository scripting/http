var myProductName = "davehttp", myVersion = "0.4.33";  

/*  The MIT License (MIT)
	Copyright (c) 2014-2017 Dave Winer
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	*/

exports.start = startup; 
const fs = require ("fs");
const request = require ("request");
const http = require ("http"); 
const https = require ("https");
const urlpack = require ("url");
const strftime = require ("strftime");
const dns = require ("dns");
const utils = require ("daveutils"); 

const urlDefaultFavicon = "http://scripting.com/favicon.ico"; //11/24/18 by DW

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

function dnsGetDomainName (ipAddress, callback) { //9/28/19 by DW
	if (ipAddress === undefined) {
		var err = {
			message: "Can't get the domain name for the address because it is undefined."
			}
		callback (err);
		}
	else {
		try {
			dns.reverse (ipAddress, function (err, domains) {
				if (err) {
					callback (err);
					}
				else {
					callback (undefined, domains [0]);
					}
				});
			}
		catch (err) {
			callback (err);
			}
		}
	} 

function startup (config, callback) {
	console.log ("davehttp.startup: launching on port == " + config.port + ", v" + myVersion + ".");
	
	if (config.flPostEnabled === undefined) { //1/3/18 by DW
		config.flPostEnabled = false;
		}
	if (config.blockedAddresses === undefined) { //4/17/18 by DW
		config.blockedAddresses = new Array ();
		}
	
	console.log ("\ndavehttp.startup: config == " + utils.jsonStringify (config));
	
	function handleRequest (httpRequest, httpResponse) {
		function doHttpReturn (code, type, s, headers) { //10/7/16 by DW
			if (headers === undefined) {
				headers = new Object ();
				}
			headers ["Content-Type"] = type;
			if (utils.getBoolean (config.flAllowAccessFromAnywhere)) {
				headers ["Access-Control-Allow-Origin"] = "*";
				}
			httpResponse.writeHead (code, headers);
			if (Buffer.isBuffer (s)) { //9/28/18 by DW
				httpResponse.end (s); //9/17/18 by DW
				}
			else {
				httpResponse.end (s.toString ());    
				}
			}
		function returnRedirect (url, code) {
			var headers = {
				location: url
				};
			if (code === undefined) {
				code = 302;
				}
			doHttpReturn (code, "text/plain", code + " REDIRECT", headers);
			}
			
		function isBlockedAddress (theAddress) {
			for (var i = 0; i < config.blockedAddresses.length; i++) { 
				if (theAddress == config.blockedAddresses [i]) {
					return (true);
					}
				}
			return (false);
			}
		
		var remoteAddress = httpRequest.connection.remoteAddress;
		var parsedUrl = urlpack.parse (httpRequest.url, true);
		
		if (isBlockedAddress (remoteAddress)) {
			doHttpReturn (403, "text/plain", "Forbidden.");
			return;
			}
		
		var myRequest = {
			method: httpRequest.method,
			lowermethod: httpRequest.method.toLowerCase (),
			path: parsedUrl.pathname,
			lowerpath: parsedUrl.pathname.toLowerCase (),
			params: {},
			host: httpRequest.headers.host,
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
		
		if (myRequest.host !== undefined) { //4/17/18 by DW
			myRequest.lowerhost = myRequest.host.toLowerCase ();
			}
		else {
			myRequest.host = ""; //9/18/19 by DW
			myRequest.lowerhost = "";
			}
		
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
		
		if (typeof (remoteAddress) != "string") { //9/26/19 AM by DW -- debugging
			console.log ("handleRequest: typeof (remoteAddress) == " + typeof (remoteAddress));
			}
		
		dnsGetDomainName (remoteAddress, function (err, domain) {
			if (!err) {
				myRequest.client = domain;
				}
			if (myRequest.client === undefined) { 
				myRequest.client = "";
				}
			if (isBlockedAddress (myRequest.client)) { //9/25/19 by DW
				doHttpReturn (403, "text/plain", "Forbidden.");
				return;
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
			
			function callBackToApp (theRequest) {
				if (callback !== undefined) {
					try {
						callback (theRequest);
						}
					catch (err) {
						console.log (myProductName + " v" + myVersion + ": err.message == " + err.message); 
						console.trace (); //10/23/20 by DW
						doHttpReturn (500, "text/plain", err.message);
						}
					}
				}
			if (config.flPostEnabled && (myRequest.lowermethod == "post")) {
				let body = "";
				httpRequest.on ("data", function (data) {
					body += data;
					});
				httpRequest.on ("end", function () {
					myRequest.postBody = body;
					callBackToApp (myRequest);
					});
				}
			else {
				var flNotHandledHere = true; //11/24/18 by DW
				switch (myRequest.lowerpath) {
					case "/favicon.ico":
						var urlFavIcon = urlDefaultFavicon;
						if (config.urlFavicon !== undefined) {
							urlFavIcon = config.urlFavicon;
							}
						returnRedirect (urlFavIcon);
						flNotHandledHere = false;
						break;
					}
				if (flNotHandledHere) {
					callBackToApp (myRequest);
					}
				}
			});
		}
	try { //6/21/20 by DW
		http.createServer (handleRequest).listen (config.port);
		}
	catch (err) {
		console.log (myProductName + " v" + myVersion + ": err.message == " + err.message); 
		console.trace (); //10/23/20 by DW
		}
	};
