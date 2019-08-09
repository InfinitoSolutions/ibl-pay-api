'use strict';
const utils = require('@utils');

import countries from '@services/country';

export const list = async (request: any, h: any) => {
    try {
        return h.response({
            'data': countries
        }).code(200);
    } catch (err) {
        throw utils.error.badRequest(err);
    }
};

export default {
    list
};