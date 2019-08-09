import * as hapi from 'hapi';

const register = async (server: hapi.Server, options: any) => {
    const defaultOptions = { collectionName: 'logs', batchSize: 1 };
    options = Object.assign({}, defaultOptions, options);
    const mongoUri = options.mongoUri || process.env.MONGO_URL;

    const goodMongoStoreOptions = {
        ops: false,
        reporters: {
            mongoStore: [{
                module: require('hapi-good-mongostore'),
                args: [mongoUri, options]
            }]
        }
    };

    await server.register({
        plugin: require('good'),
        options: goodMongoStoreOptions,
    });

};

const name = 'c2c-logging';
const version = '0.0.1';
export default { register, name, version };