'use strict';

const Config = require('config');
const svgCaptcha = require('svg-captcha');
const bcrypt = require('bcrypt');
const SALT_ROUND = 10;
const ENABLED_CAPTCHA_KEY = 'captchaEnabled';
const CAPTCHA_ENABLED = ((typeof process.env.CAPTCHA_ENABLED) === "undefined") ? Config.get(ENABLED_CAPTCHA_KEY) : (process.env.CAPTCHA_ENABLED === "true" ? true : false);

import Captcha from '@models/captcha.model';


const hash = async (text: string) => {
    try {
        let salt = await bcrypt.genSalt(SALT_ROUND);
        return await bcrypt.hash(text, salt);
    } catch (e) {
        throw e;
    }
};

const compare = async (plainText: string, hash: string) => {
    try {
        return await bcrypt.compare(plainText, hash);
    } catch (e) {
        throw e;
    }
};

export const invalidate = async (id: string) => {
    const isEnableCaptcha = (CAPTCHA_ENABLED !== false);
    if (!isEnableCaptcha) {
        return true;
    }
    return await Captcha.findOneAndUpdate({ _id: id }, { active: false });
};

const create = async () => {
    return await svgCaptcha.create({ size: 5, ignoreChars: '', noise: 1 });
};

export const createAndSave = async () => {
    const c = await create();
    let params = {
        text: await hash(c.text)
    };
    const model = await new Captcha(params).save();
    return {
        captcha_id: model.id,
        captcha_svg: c.data
    };
};

export const validate = async (captchaId: string, captchaText: string) => {
    const isEnableCaptcha = (CAPTCHA_ENABLED !== false);
    if (!isEnableCaptcha) {
        return true;
    }
    const c = await Captcha.findOne({ _id: captchaId, active: true });
    if (c == null) {
        return false;
    }
    // Disable captcha after used
    await invalidate(captchaId);
    const isValid = await compare(captchaText, c.text);
    if (!isValid) {
        return false;
    }
    return true;
};

export default {
    validate,
    createAndSave,
    invalidate
};