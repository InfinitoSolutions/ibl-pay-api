const Joi = require('joi');
import AddressSchema from './address.schema';

export default Joi.object({
    document_type: Joi.string().required(),
    document_url: Joi.string().required(),
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
    }),
    business_license: Joi.object({
        license_number: Joi.string().required(),
        issuance_place: Joi.string().required(),
        issuance_date: Joi.date().required(),
        expire_date: Joi.date().required(),
        license_url: Joi.string().required(),
    })
}).label('Profile Merchant KYC3 Request');
