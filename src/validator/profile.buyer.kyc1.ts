const Joi = require('joi');
import AddressSchema from './address.schema';

export default Joi.object().keys({
    birthday: Joi.date().required(),
    country_code: Joi.string().required(),
    phone_number: Joi.string().required(),
    current_address: AddressSchema.description('Current Address'),
    permanent_address: AddressSchema.description('Permanent Address')
}).label('Profile Buyer KYC1');
