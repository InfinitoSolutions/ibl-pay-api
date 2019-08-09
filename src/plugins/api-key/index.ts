'use strict';

import * as hapi from 'hapi';

const Boom = require('boom');
const Hoek = require('hoek');

const pluginDefaults = {
    schemeName: 'api-key'
};

const schemeDefaults = {
    validateKey: null,
    queryKey: 'apikey',
    headerKey: 'x-api-key'
};

const authSchema = (server: hapi.Server, options: any = {}) => {
    options = Hoek.applyToDefaults(schemeDefaults, options);

    const authenticate = async (request: any, h: any) => {
        // check in both the query params and the X-API-KEY header for an api key:
        const headers = request.headers;
        const apiKey = headers[options.headerKey] ? headers[options.headerKey] : request.query[options.queryKey];

        const validateKey = options.validateKey;
        try {
            // get the credentials for this key:
            const { isValid, credentials } = await validateKey(apiKey);
            // if they are valid then continue processing:
            if (isValid && credentials !== undefined) {
                return h.authenticated({ credentials });
            }
            // otherwise always return a 401:
        } catch (err) {
            // does not have to do anything
        }
        throw Boom.unauthorized('Invalid API Key.');
    };

    return {
        authenticate
    };
};

const register = async (server: hapi.Server, pluginOptions: any) => {
    pluginOptions = Hoek.applyToDefaults(pluginDefaults, pluginOptions);
    server.auth.scheme(pluginOptions.schemeName, authSchema);

    if (pluginOptions.strategy) {
        server.auth.strategy(pluginOptions.strategy.name,
            pluginOptions.schemeName,
            pluginOptions.strategy);
    }
};

const name = 'c2c-api-key';
const version = '0.0.1';
export default { register, name, version };
