const Joi = require('joi');

export default Joi.object().keys({
    username: Joi.string().email().required().description('Email address'),
    password: Joi.string().required(),
    role: Joi.string().max(1).required().valid('B', 'M').description('User role'),
    captcha_id: Joi.string(),
    captcha_text: Joi.string()
}).label('Login');
