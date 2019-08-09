const Joi = require('joi');

export default Joi.object().keys({
    password: Joi.string().min(6).max(20).required(),
    email: Joi.string().email().required(),
    role: Joi.string().max(1).required().allow(['B', 'M']).description('User role'),
    captcha_id: Joi.string(),
    captcha_text: Joi.string(),
    country: Joi.string().required().description('Country ISO code (e.g: US)'),
    neo_wallet: Joi.string().description('NEO address'),

    first_name: Joi.string()
        .when('role', { is: 'B', then: Joi.required(), otherwise: Joi.optional() })
        .description('First name (required if role = \'B\''),
    last_name: Joi.string()
        .when('role', { is: 'B', then: Joi.required(), otherwise: Joi.optional() })
        .description('Last name (required if role = \'B\')'),
    entity_name: Joi.string()
        .when('role', { is: 'M', then: Joi.required(), otherwise: Joi.optional() })
        .description('Entity name (required if role = \'M\')'),
    display_name: Joi.string().required().description('User display name'),
    crypto_currencies: Joi.array().items(Joi.object({
        currency: Joi.string().required(),
        address: Joi.string().required()
    })).description('List of crypto currencies')
}).label('Registration');
