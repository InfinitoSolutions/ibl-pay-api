import Joi from 'joi';

const schema = Joi.object().keys({
    address: Joi.string().required().description('NEO address'),
}).label('address');

export default schema;
