'use strict';

var util = require('util'),
	https = require('https'),
	crypto = require('crypto'),
	sha1 = require('./sha1'),
	EventEmitter = require('events').EventEmitter,
	Parser = require('./parser');

// ===========================
// Prototype declaration
// ===========================

var TwitterStream = function TwitterStream (path, oauth, apiParams) {
	EventEmitter.call(this);

	if (['statuses/filter', 'statuses/sample', 'statuses/firehose', 'user', 'site'].indexOf(path) === -1) {
		throw Error('Invalid path specified.');
	}
	
	this.path = path;
	this.method = (this.path === 'statuses/filter') ? 'POST' : 'GET';
	
	this.params = {
		oauth_consumer_key: oauth.consumerKey,
		oauth_nonce: crypto.randomBytes(16).toString('hex'),
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: Math.floor(Date.now() / 1000),
		oauth_token: oauth.accessToken,
		oauth_version: '1.0'
	};
	
	this.consumerSecret = oauth.consumerSecret;
	this.accessTokenSecret = oauth.accessTokenSecret;
	
	for (var key in apiParams) {
		if (apiParams.hasOwnProperty(key)) {
			this.params[key] = encodeURIComponent(apiParams[key]);
		}
	}
	
	this.parser = new Parser();
	
	this.parser.on('element', (function (msg) {
    	this.emit('message', msg);

		if (msg.delete) 				this.emit('delete', msg);
		else if (msg.disconnect) 		this.emit('disconnect', msg);
		else if (msg.limit) 			this.emit('limit', msg);
		else if (msg.scrub_geo) 		this.emit('scrub_geo', msg);
		else if (msg.warning) 			this.emit('warning', msg);
		else if (msg.status_withheld) 	this.emit('status_withheld', msg);
		else if (msg.user_withheld) 	this.emit('user_withheld', msg);
		else if (msg.friends) 			this.emit('friends', msg);
		else if (msg.direct_message) 	this.emit('direct_message', msg);
		else if (msg.event) {
			this.emit('user_event', msg);
			
			if (msg.event === 'blocked') 						this.emit('blocked', msg);
			else if (msg.event === 'unblocked') 				this.emit('unblocked', msg);
			else if (msg.event === 'favorite') 					this.emit('favorite', msg);
			else if (msg.event === 'unfavorite') 				this.emit('unfavorite', msg);
			else if (msg.event === 'follow')					this.emit('follow', msg);
			else if (msg.event === 'unfollow')					this.emit('unfollow', msg);
			else if (msg.event === 'user_update')				this.emit('user_update', msg);
			else if (msg.event === 'list_created') 				this.emit('list_created', msg);
			else if (msg.event === 'list_destroyed') 			this.emit('list_destroyed', msg);
			else if (msg.event === 'list_updated') 				this.emit('list_updated', msg);
			else if (msg.event === 'list_member_added') 		this.emit('list_member_added', msg);
			else if (msg.event === 'list_member_removed') 		this.emit('list_member_removed', msg);
			else if (msg.event === 'list_user_subscribed') 		this.emit('list_user_subscribed', msg);
			else if (msg.event === 'list_user_unsubscribed')	this.emit('list_user_unsubscribed', msg);
			else                                     			this.emit('unknown_user_event', msg);
		}
		else 							this.emit('tweet', msg);
	}).bind(this));

	this.parser.on('error', (function (err) {
		this.emit('parser-error', err)
	}).bind(this));	
	
	this.createRequest();
};

util.inherits(TwitterStream, EventEmitter);

TwitterStream.abortErrors = [400, 401, 403, 404, 406, 410, 422];

// ===========================
// Instance functions
// ===========================

TwitterStream.prototype.generateSignatureBase = function () {
	var keys = [];
	
	for (var key in this.params) {
		if (this.params.hasOwnProperty(key)) {
			keys.push(key);
		}
	}
	
	keys.sort();
	
	var url = 'https://stream.twitter.com/1.1/' + this.path + '.json';
	
	var oauthParams = '';
	
	for (var i = 0; i < keys.length; i++) {
		oauthParams += keys[i];
		oauthParams += '=';
		oauthParams += this.params[keys[i]];
		oauthParams += (i === keys.length - 1) ? '' : '&';
	}
	
	var signatureBase = this.method + '&' + encodeURIComponent(url) + '&' + encodeURIComponent(oauthParams);
	
	return signatureBase;
};

TwitterStream.prototype.generateSignature = function () {
	var signatureBase = this.generateSignatureBase(),
		secretKey = this.consumerSecret + '&' + this.accessTokenSecret;
		
	console.log(signatureBase);
		
	return sha1.HMACSHA1(secretKey, signatureBase);
};

TwitterStream.prototype.createRequest = function () {
	var options = {
		hostname: 'stream.twitter.com',
		port: 443,
		path: '/1.1/' + this.path + '.json',
		method: this.method,
		headers: {}
	};
	
	var reqData = '';
	
	for (var key in this.params) {
		if (this.params.hasOwnProperty(key) && key.indexOf('oauth_') === -1) {
			reqData += '&';
			reqData += key;
			reqData += '=';
			reqData += this.params[key]; 
		}
	}	
	
	if (this.method === 'GET' && reqData.length !== 0) {
		options.path += '?';
		options.path += reqData.substring(1);
	} else if (this.method === 'POST') {
		reqData = reqData.substring(1);
		options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		options.headers['Content-Length'] = reqData.length;
	}
	
	options.headers.Authorization = 'OAuth ' +
		'oauth_consumer_key="' + this.params.oauth_consumer_key + '", ' +
		'oauth_nonce="' + this.params.oauth_nonce + '", ' +
		'oauth_signature="' + encodeURIComponent(this.generateSignature()) + '", ' +
		'oauth_signature_method="' + this.params.oauth_signature_method + '", ' +
		'oauth_timestamp="' + this.params.oauth_timestamp + '", ' +
		'oauth_token="' + this.params.oauth_token + '", ' +
		'oauth_version="' + this.params.oauth_version + '"';
		
	console.log(reqData);
	
	var req = https.request(options, (function (res) {
		console.log(res.statusCode);
		if (TwitterStream.abortErrors.indexOf(res.statusCode) !== -1) {
			return;
		}
		
		res.on('data', (function (data) {
			this.parser.parse(data);
		}).bind(this));
	}).bind(this));
	
	if (this.method === 'POST') {
		req.write(reqData);
	}
	
	req.end();
	
	req.on('error', function (e) {
		console.log(e);
	});
};

module.exports = TwitterStream;
