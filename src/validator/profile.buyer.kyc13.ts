const Joi = require('joi');
import AddressSchema from './address.schema';

export default Joi.object().keys({
    birthday: Joi.date().required(),
    country_code: Joi.string().required(),
    phone_number: Joi.string().required(),
    current_address: AddressSchema.description('Current Address'),
    permanent_address: AddressSchema.description('Permanent Address'),
    document_type: Joi.string(),
    document_url: Joi.string(),
    identity_card: Joi.object({
        id_number: Joi.string().required(),
        expire_date: Joi.date().required(),
        issuance_date: Joi.date().required(),
        issuance_place: Joi.string().required(),
        front_photo: Joi.string().required(),
        back_photo: Joi.string().required(),
        selfie_photo: Joi.string().required()
    }),
    passport: Joi.object({
        passport_number: Joi.string().required(),
        expire_date: Joi.date().required(),
        issuance_date: Joi.date().required(),
        issuance_place: Joi.string().required(),
        photo: Joi.string().required(),
        selfie_photo: Joi.string().required()
    })
}).label('Profile Buyer KYC1');
