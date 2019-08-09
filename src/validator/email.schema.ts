const Joi = require('joi');

const schema = Joi.object().keys({
    email: Joi.string().email().required().description('Email address'),
}).label('Email');


export default schema;
