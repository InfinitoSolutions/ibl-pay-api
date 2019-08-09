const Joi = require('joi');

const schema = Joi.object().keys({
    amount: Joi.number().required().min(0.00000001).max(21000000),
    address: Joi.string().required()
});

export default schema;
