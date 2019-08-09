'use strict';

import utils from '@utils/index';
import * as Errors from '@validator/errors';
import * as authService from '@services/auth';
import {TokenSerializer} from '@serializer/user.serializer';

export const login = async (request: any, h: any) => {
    try {
        const payload = request.payload;
        request.log(['auth.login', 'info'], {
            username: payload.username,
            captcha_id: payload.captcha_id,
            captcha_text: payload.captcha_text,
            role: payload.role
        });
        let data = await authService.login(payload);
        if (data === null) {
            const error = new Errors.LoginFailedNotExist();
            throw utils.error.unauthorized(error);
        }
        if (data === false) {
            const error = new Errors.LoginFailedOther();
            throw utils.error.unauthorized(error);
        }
        if (typeof data === 'string') {
            if (data === 'PRE_ACTIVE') {
                const error = new Errors.LoginFailedPreactive();
                throw utils.error.unauthorized(error);
            }
            if (data === 'INACTIVE') {
                const error = new Errors.LoginFailedInactive();
                throw utils.error.unauthorized(error);
            }
            if (data === 'INCORRECT') {
                const error = new Errors.LoginFailedError();
                throw utils.error.unauthorized(error);
            }
        }
        if (typeof data === 'object') {
            if (data.error && data.error === 'BLOCK_LOGIN') {
                const error = new Errors.BlockedLoginError(data.time, data.numberLogin);
                throw utils.error.unauthorized(error);
            }
            return h.response({ 'data': await new TokenSerializer().serialize(data) }).code(200);
        }
    } catch (err) {
        request.log(['auth.login', 'error'], err.message);
        throw utils.error.unauthorized(err);
    }
};

export default {
    login
};