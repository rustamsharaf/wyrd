const Joi = require('joi');

const registerValidator = (data) => {
  const schema = Joi.object({
    nickname: Joi.string().min(4).max(16).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    country: Joi.string().required(),
  });
  return schema.validate(data);
};

const loginValidator = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return schema.validate(data);
};

module.exports = { registerValidator, loginValidator };