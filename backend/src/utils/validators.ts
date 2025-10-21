import Joi from 'joi';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate strong password
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
export function isStrongPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Register user validation schema
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({ 'any.required': 'Email is required' }),
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({ 'any.required': 'Username is required' }),
  displayName: Joi.string()
    .max(255)
    .required()
    .messages({ 'any.required': 'Display name is required' }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),
});

/**
 * Login validation schema
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .required(),
});

/**
 * Create message validation schema
 */
export const createMessageSchema = Joi.object({
  conversationId: Joi.string()
    .uuid()
    .required(),
  content: Joi.string()
    .max(10000)
    .required(),
  mediaUrls: Joi.array()
    .items(Joi.string().uri())
    .optional(),
});

/**
 * Create conversation validation schema
 */
export const createConversationSchema = Joi.object({
  participantIds: Joi.array()
    .items(Joi.string())
    .required(),
  participantNames: Joi.array()
    .items(Joi.string())
    .required(),
  channels: Joi.array()
    .items(
      Joi.string().valid(
        'whatsapp',
        'sms',
        'email',
        'instagram_dm',
        'linkedin_dm',
        'telegram',
        'slack'
      )
    )
    .required(),
});

/**
 * Generic validation function
 */
export async function validate(data: any, schema: Joi.Schema): Promise<{ value: any; error: any }> {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
}
