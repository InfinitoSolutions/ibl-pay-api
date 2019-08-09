'use strict';

import utils from '@utils/index';
import {WebHookManager} from '@services/web-hooks';

export const handle = async (request: any, h: any) => {
    try {
        const payload = request.payload;
        request.log(['web-hook', 'info'], { payload });
        await WebHookManager.store(request);

        return h.response({ data: { status: true } }).code(200);
    } catch (err) {
        request.log(['web-hook', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const handle_kyc = async (request: any, h: any) => {
    try {
        const payload = request.payload;
        request.log(['web-hook', 'info'], { payload });
        await WebHookManager.store({ payload: {event: 'kyc_sm', data: request.payload}});

        return h.response({ data: { status: true } }).code(200);
    } catch (err) {
        request.log(['web-hook', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const handleSecurity = async (request: any, h: any) => {
    try {
        const payload = request.payload;
        request.log(['web-hook', 'info'], { payload });
        await WebHookManager.store({ payload: { event: 'security', data: request.payload } });

        return h.response({ data: { status: true } }).code(200);
    } catch (err) {
        request.log(['web-hook', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export default {
    handle,
    handle_kyc,
    handleSecurity
};
