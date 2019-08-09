import ValidatorInterface from '@validator/validator.interface';
import { CaptchaValidator } from '@validator/captcha';
import { EmailValidator } from '@validator/email';
import { CryptoAddressValidator } from '@validator/crypto-address';
import { NeoAddressValidator } from '@validator/neo.address';

export default class RegisterUserRequestValidator implements ValidatorInterface {
    rules: ValidatorInterface[];

    constructor() {
        this.rules = [
            new CaptchaValidator(),
            new EmailValidator(),
            new CryptoAddressValidator(),
            // new NeoAddressValidator()
        ];
    }

    add(rule: ValidatorInterface) {
        this.rules.push(rule);
        return this;
    }

    clear() {
        this.rules = [];
        return this;
    }

    async validate(data: any): Promise<boolean> {
        if (this.rules.length === 0) {
            return true;
        }
        for (let i = 0; i <= this.rules.length - 1; i++) {
            await this.rules[i].validate(data);
        }
        return true;
    }
}
