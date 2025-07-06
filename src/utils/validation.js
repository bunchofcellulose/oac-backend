const Joi = require('joi');

const registrationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  
  studentEmail: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Student email is required',
      'any.required': 'Student email is required'
    }),
  
  parentEmail: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid parent/guardian email address',
      'string.empty': 'Parent/guardian email is required',
      'any.required': 'Parent/guardian email is required'
    }),
  
  school: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'School name is required',
      'string.min': 'School name must be at least 2 characters long',
      'string.max': 'School name cannot exceed 200 characters',
      'any.required': 'School name is required'
    }),
  
  grade: Joi.number()
    .integer()
    .min(9)
    .max(12)
    .required()
    .messages({
      'number.base': 'Grade must be a number',
      'number.integer': 'Grade must be a whole number',
      'number.min': 'Grade must be between 9 and 12',
      'number.max': 'Grade must be between 9 and 12',
      'any.required': 'Grade is required'
    }),
  
  age: Joi.number()
    .integer()
    .min(13)
    .max(19)
    .required()
    .messages({
      'number.base': 'Age must be a number',
      'number.integer': 'Age must be a whole number',
      'number.min': 'Age must be between 13 and 19',
      'number.max': 'Age must be between 13 and 19',
      'any.required': 'Age is required'
    }),
  
  country: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Country is required',
      'string.min': 'Country name must be at least 2 characters long',
      'string.max': 'Country name cannot exceed 100 characters',
      'any.required': 'Country is required'
    }),
  
  experience: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Experience description cannot exceed 1000 characters'
    }),
  
  motivation: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Motivation description cannot exceed 1000 characters'
    })
});

const validateRegistration = (data) => {
  const { error, value } = registrationSchema.validate(data, {
    abortEarly: false, // Show all validation errors
    stripUnknown: true // Remove unknown fields
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors: errors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
};

module.exports = {
  registrationSchema,
  validateRegistration
};
