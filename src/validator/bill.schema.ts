const Joi = require('joi');

const schema = Joi.object().keys({
    uuid: Joi.string(),
    service: Joi.string().strip().required(),
    is_recurring: Joi.boolean(),
    amount: Joi.number().required().max(999.99999999).min(1e-8)
        .when('is_recurring', {is: true, then: Joi.number().min(2e-8)}),
    currency: Joi.string(),
    bill_type: Joi.string(),
    merchant_address: Joi.string().required(),
    recurring: Joi.any(),
    buyers: Joi.array().items(Joi.object({
        address: Joi.string(),
        amount: Joi.number()
    }))
}).label('Bill');

export default schema;