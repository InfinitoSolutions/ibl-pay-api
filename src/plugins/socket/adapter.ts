'use strict';

const Config = require('config');
const adapter = require('socket.io-redis');
import {RedisClient} from '../../bootstrap/redis';

export const initAdapter = () => {
	const debug = require('debug')('socket.adapter');

	const SOCKET_PUB_SUB_CHANNEL = Config.get('server.socket.pubSubChannel');

	if (!SOCKET_PUB_SUB_CHANNEL) {
		debug('ERROR: missing SOCKET_PUB_SUB_CHANNEL');
		return null;
	}

	const pub = new RedisClient();

	// return_buffers should be false (@see https://github.com/socketio/socket.io-emitter/issues/63)
	const sub = new RedisClient({
		return_buffers: false
	});

	let options = {
		pubClient: pub.client,
		subClient: sub.client,
		key: SOCKET_PUB_SUB_CHANNEL
	};
	return adapter(options);
};