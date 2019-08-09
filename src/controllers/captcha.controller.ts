'use strict';
const utils = require('@utils');

import CaptchaService from '@services/captcha';
import {CaptchaSerializer} from '@serializer/serializer';

export const create = async (request: any, h: any) => {
    try {
        const data = await CaptchaService.createAndSave();
        return await h.response({ data: await new CaptchaSerializer().serialize(data) });
    } catch (err) {
        throw utils.error.badRequest(err);
    }
};

export default {
    create
};