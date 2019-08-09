import ValidatorInterface from './validator.interface';
import EmailValidateSchema from './email.schema';
import { EmailTakenError, EmailFormatError } from './errors';
import User from '@models/user.model';

const Joi = require('joi');

export class EmailValidator implements ValidatorInterface {
    async validate(data: any) {
        const { email } = data;
        const { error, value } = Joi.validate({ email }, EmailValidateSchema);
        if (error !== null) {
            throw new EmailFormatError();
        }
        const user = await User.findOne({ email });
        if (user) {
            throw new EmailTakenError();
        }
        return true;
    }
}
