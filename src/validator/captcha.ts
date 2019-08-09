import ValidatorInterface from '@validator/validator.interface';
import { CaptchaInvalidError } from '@validator/errors';

const captchaService = require('@services/captcha');

export class CaptchaValidator implements ValidatorInterface {

    async validate(data: any) {
        const { captcha_id, captcha_text } = data;
        const isValidCaptcha = await captchaService.validate(captcha_id, captcha_text);
        if (!isValidCaptcha) {
            throw new CaptchaInvalidError();
        }
        return true;
    }
}
