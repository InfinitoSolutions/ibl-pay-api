import { RedisClient } from '../bootstrap/redis';

export const redis = function() {
    const redisClient = new RedisClient({prefix: 'c2c_'});

    return {
        getClient: () => {
            if (!redisClient.isConnected()) {
                redisClient.connect();
            }
            return redisClient.client;
        }
    };
}();

