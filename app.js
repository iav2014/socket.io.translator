/**
 * chat server example
 * socket.io implements
 * @goal / routing index.html file
 * @param request & response
 * @return response
 * (c) Nacho Ariza refactor november 2017
 * @private
 */
var argv = require('optimist')
	.usage('Usage: $0 --port ')
	.demand(['port'])
	.argv;
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var async = require('async');
var path = require('path');

var devices = []; // list of socket handlers
/**
 * app.get area
 * @goal / routing index.html file
 * @param request & response
 * @return response
 * (c) Nacho Ariza november 2017
 * @private
 */
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'index.html'));
});
/**
 * socket.io events area
 * @goal capture socket events
 * (c) Nacho Ariza november 2017
 * @private
 */
io.sockets.on('close', function (socket) {
	console.log('on close detected');
});
io.sockets.on('connection', function (socket) {
	console.log("on connection");
	socket.on('chat message', function (msg) {
		console.log(msg);
		switch (msg.evt) {
			case 0: // subscription
				var l = devices.length;
				for (var i = 0; i < l; i++) {
					if (msg.nick === devices[i].nick) {
						devices[i].socket.emit('subscription confirm', {
							nick: msg.nick,
							language: msg.language,
							data: 'rosseta: you already stay here'
						});
						console.log('subscription already confirmed');
						break;
					}
				}
				if (i === l) {
					io.emit('subscription confirm', {
						nick: msg.nick,
						language: msg.language,
						data: 'rosseta chat subscription successful!'
					});
					devices.push({socket: socket, nick: msg.nick, language: msg.language});
					console.log('new subscription confirm ');
				}
				break;
			case 1: // user message
				async.forEach(devices, function (item, end) {
						if (item.nick !== msg.nick) {
							translate(msg.data, msg.language, item.language, function (err, result) {
								if (err) {
									console.error(err);
								} else {
									console.log(result);
									var obj = '[' + msg.nick + '] [' + msg.language + ']:' + result[0][0][0];
									item.socket.emit("chat message", obj);
									console.log('msg chat sent')
								}
								
							});
						}
						end();
					},
					function (err) {
						if (err) console.error(err);
						else console.log('async iterating done');
					}
				);
				break;
		}
	});
});
/**
 * server
 * @goal listen on port
 * @param port & callback
 * @return none
 * (c) Nacho Ariza november 2017
 * @private
 */
http.listen(argv.port, function () {
	console.log('listening on *:3000');
	console.log('http://localhost:*3000')
});

/**
 * translate
 * @goal translate message using google translate
 * @param msg,(from)source language,(to) target language  & callback
 * @return callback array response
 * (c) Nacho Ariza november 2017
 * @private
 */
function translate(msg, from, to, callback) {
	var _gtUrl = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=it&tl=';
	var request = require('request');
	request(_gtUrl + to + '&sl=' + from + '&dt=t&q=' + msg
		, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var _arrayResponse = JSON.parse(body);
				try {
					var _arrayResponse = JSON.parse(body);
					console.log(_arrayResponse[0][0][0]);
					console.log(_arrayResponse[0][0][1]);
				} catch (err) {
					_arrayResponse = err;
					console.log(err);
				}
				callback(null, _arrayResponse);
			} else {
				callback(response.statusCode);
			}
		})
}


