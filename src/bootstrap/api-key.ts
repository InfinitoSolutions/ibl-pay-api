const debug = require('debug')('api-key.service');

/**
 * @todo: API KEY should be manageable in Back Office tool
 */
const API_KEY = process.env.API_KEY || null;

// Validate user of given API Key
const validateKey = async (apiKey: string) => {
    let result = {
        isValid: false,
        credentials: apiKey
    };
    try {
        if (apiKey === API_KEY) {
            result.isValid = true;
        }
    } catch (e) {
        debug(e);
    }
    return result;
};

export const apiKeyAuthStrategy = {
    name: 'api-key',
    validateKey
};

export default apiKeyAuthStrategy;