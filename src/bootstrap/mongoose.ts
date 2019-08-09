import mongoose from 'mongoose';

const debug = require('debug')('bootstrap.mongoose');

export const connect = async (mongoUri: any) => {
    try {
        mongoUri = mongoUri || process.env.MONGO_URL;
        let options = { useNewUrlParser: true, useFindAndModify: false };
        await mongoose.connect(mongoUri, options);
        mongoose.connection.once('open', () => {
            debug('Connected mongodb successfully');
        });
        mongoose.connection.once('error', (err: Error) => {
            debug('Connected mongodb failed: ', err);
        });
    } catch (e) {
        debug('Connect Error: ', e);
    }
};