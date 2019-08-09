'use strict';

const Config = require('config');
const redisClient = require('redis').createClient;
const url = require('url');
const debug = require('debug')('emitter.service');

/**
 * The wrapper of io-emitter to have ability to send socket from anywhere.
 *
 * @example
 * const emitter = require('./emitter');
 * emitter.to('room').emit('event', 'data')
 */
class SocketEmitter {
    options: any;
    io: any;
    constructor(options: any = {}) {
        this.options = options || {};
        this.io = null;
        this.init();
    }

    init() {
        try {
            const redisUri = this.options.REDIS_URI || process.env.REDIS_URI;
            const SOCKET_PUB_SUB_CHANNEL = Config.get('server.socket.pubSubChannel');

            if (!redisUri) {
                debug('Missing ENV variable named: REDIS_URI');
                return;
            }
            let redis = null;
            let rtg = url.parse(redisUri);
            if (rtg.auth) {
                redis = redisClient(rtg.port, rtg.hostname, { auth_pass: rtg.auth.split(":")[1] });
            } else {
                redis = redisClient(rtg.port, rtg.hostname);
            }

            this.io = require('socket.io-emitter')(redis, {
                key: SOCKET_PUB_SUB_CHANNEL
            });
        } catch (e) {
            debug('Failed to initialize a Emitter: ', e);
            throw e;
        }
    }

    emit() {
        if (!this.io) {
            return;
        }

        return this.io.emit(arguments);
    }

    to(room: string) {
        if (!this.io) {
            return;
        }
        return this.io.to(room);
    }

    in(room: string) {
        if (!this.io) {
            return;
        }
        return this.io.in(room);
    }

    of(nsp: string) {
        if (!this.io) {
            return;
        }
        return this.io.of(nsp);
    }
}


export const emitter = new SocketEmitter();
export default emitter;