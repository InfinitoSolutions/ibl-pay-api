const Joi = require('joi');
import AddressSchema from './address.schema';

export default Joi.object().keys({
    business_representative: Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        birthday: Joi.date().required(),
        country: Joi.string().required(),
        country_code: Joi.string().required(),
        phone_number: Joi.string().required()
    }).description('Information of Business Presentative'),
    current_address: AddressSchema.description('Current Address'),
    residence_address: AddressSchema.description('Permanent Address'),
    business_info: Joi.object({
        legal_person: Joi.string().required(),
        industry: Joi.string().required(),
        incorporation_date: Joi.date().required(),
        company_number: Joi.string().required(),
        is_listed: Joi.boolean().required(),
        exchange_listed: Joi.string()
            .when('is_listed', { is: true, then: Joi.required(), otherwise: Joi.optional() })
    }).description('Information of Business'),
    business_address: AddressSchema.description('Registered Business Address'),
    mailing_address: AddressSchema.description('Mailing Address'),
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
    }),
    business_license: Joi.object({
        license_number: Joi.string().required(),
        issuance_place: Joi.string().required(),
        issuance_date: Joi.date().required(),
        expire_date: Joi.date().required(),
        license_url: Joi.string().required(),
    })
}).label('Profile Merchant KYC1');
