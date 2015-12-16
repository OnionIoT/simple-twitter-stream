'use strict';

var TwitterStream = require('./twitter');

var ts = new TwitterStream('statuses/filter', {
	consumerKey: '...',
	consumerSecret: '...',
	accessToken: '...',
	accessTokenSecret: '...'
}, {
	track: '@OnionIoT'
});

ts.on('tweet', function (msg) {
	console.log(msg);
});
