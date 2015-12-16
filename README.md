# Simple-Twitter-Stream

This is a simple Twitter streaming API client for Node.js. This implementation does not use modules that contain binaries.

## Usage

```javascript
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
```

The following events are emitted:

##event: 'message'

Emitted each time an object is received in the stream. This is a catch-all event that can be used to process any data received in the stream, rather than using the more specific events documented below.
New in version 2.1.0.

```javascript
stream.on('message', function (msg) {
  //...
})
```

##event: 'tweet'

Emitted each time a status (tweet) comes into the stream.

```javascript
stream.on('tweet', function (tweet) {
  //...
})
```

##event: 'delete'

Emitted each time a status (tweet) deletion message comes into the stream.

```javascript
stream.on('delete', function (deleteMessage) {
  //...
})
```

##event: 'limit'

Emitted each time a limitation message comes into the stream.

```javascript
stream.on('limit', function (limitMessage) {
  //...
})
```

##event: 'scrub_geo'

Emitted each time a location deletion message comes into the stream.

```javascript
stream.on('scrub_geo', function (scrubGeoMessage) {
  //...
})
```

##event: 'disconnect'

Emitted when a disconnect message comes from Twitter. This occurs if you have multiple streams connected to Twitter's API. Upon receiving a disconnect message from Twitter, `Twit` will close the connection and emit this event with the message details received from twitter.

```javascript
stream.on('disconnect', function (disconnectMessage) {
  //...
})
```

##event: 'warning'

This message is appropriate for clients using high-bandwidth connections, like the firehose. If your connection is falling behind, Twitter will queue messages for you, until your queue fills up, at which point they will disconnect you.

```javascript
stream.on('warning', function (warning) {
  //...
})
```

##event: 'status_withheld'

Emitted when Twitter sends back a `status_withheld` message in the stream. This means that a tweet was withheld in certain countries.

```javascript
stream.on('status_withheld', function (withheldMsg) {
  //...
})
```

##event: 'user_withheld'

Emitted when Twitter sends back a `user_withheld` message in the stream. This means that a Twitter user was withheld in certain countries.

```javascript
stream.on('user_withheld', function (withheldMsg) {
  //...
})
```

##event: 'friends'

Emitted when Twitter sends the ["friends" preamble](https://dev.twitter.com/streaming/overview/messages-types#user_stream_messsages) when connecting to a user stream. This message contains a list of the user's friends, represented as an array of user ids.

```javascript
stream.on('friends', function (friendsMsg) {
  //...
})
```

##event: 'direct_message'

Emitted when a direct message is sent to the user. Unfortunately, Twitter has not documented this event for user streams.

```javascript
stream.on('direct_message', function (directMsg) {
  //...
})
```

##event: 'user_event'

Emitted when Twitter sends back a [User stream event](https://dev.twitter.com/streaming/overview/messages-types#Events_event).
See the Twitter docs for more information on each event's structure.

```javascript
stream.on('user_event', function (eventMsg) {
  //...
})
```

In addition, the following user stream events are provided for you to listen on:

* `blocked`
* `unblocked`
* `favorite`
* `unfavorite`
* `follow`
* `unfollow`
* `user_update`
* `list_created`
* `list_destroyed`
* `list_updated`
* `list_member_added`
* `list_member_removed`
* `list_user_subscribed`
* `list_user_unsubscribed`
* `unknown_user_event` (for an event that doesn't match any of the above)

###Example:

```javascript
stream.on('favorite', function (event) {
  //...
})
```
