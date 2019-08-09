'use strict';

const redis = require('redis');
const bluebird = require('bluebird');
const url = require('url');
const debug = require('debug')('socket.redis');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient;

export class RedisClient {
    client: any;
    connected: boolean = false;
    options: any = {};

    constructor(options: any = {}) {
        this.client = null;
        this.connected = false;
        this.options = options || {};
        this.connect();
    }

    connect() {
        const redisUri = this.options.REDIS_URI || process.env.REDIS_URI;
        if (!redisUri) {
            debug('ERROR: missing REDIS_URI');
            return null;
        }

        if (this.isConnected()) {
            return this.client;
        }

        let client = null;
        let rtg = url.parse(redisUri);
        let options = this.options;
        if (rtg.auth) {
            options.auth_pass = rtg.auth.split(":")[1];
            client = redisClient(rtg.port, rtg.hostname, options);
        } else {
            client = redisClient(rtg.port, rtg.hostname, options);
        }

        this.client = client;
        this.connected = true;
        return client;
    }


    isConnected() {
        return (this.connected && this.client !== null);
    }

    quit() {
        if (this.isConnected()) {
            this.client.quit();
        }
        this.connected = false;
        this.client = null;
    }
}

export const client = new RedisClient();
