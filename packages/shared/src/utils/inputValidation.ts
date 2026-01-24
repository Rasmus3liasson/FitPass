import validator from 'validator';

/**
 * Input validation and sanitization utility
 * Protects against XSS, SQL injection, and invalid data
 */
export class InputValidator {
  /**
   * Validate and sanitize email
   */
  static validateEmail(email: string): { valid: boolean; sanitized: string; error?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, sanitized: '', error: 'Email is required' };
    }

    const trimmed = email.trim().toLowerCase();

    if (!validator.isEmail(trimmed)) {
      return { valid: false, sanitized: '', error: 'Invalid email format' };
    }

    if (trimmed.length > 255) {
      return { valid: false, sanitized: '', error: 'Email too long' };
    }

    // Additional security: block disposable emails in production
    // You can add a disposable email check here if needed

    return { valid: true, sanitized: trimmed };
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    valid: boolean;
    error?: string;
    strength?: 'weak' | 'medium' | 'strong';
  } {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }

    if (password.length > 128) {
      return { valid: false, error: 'Password too long (max 128 characters)' };
    }

    // Check strength
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const strengthCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (strengthCount < 3) {
      return {
        valid: false,
        error:
          'Password must contain at least 3 of: uppercase, lowercase, number, special character',
        strength: 'weak',
      };
    }

    return {
      valid: true,
      strength: strengthCount === 4 ? 'strong' : 'medium',
    };
  }

  /**
   * Sanitize text input (prevent XSS)
   */
  static sanitizeText(text: string, maxLength: number = 500): string {
    if (!text || typeof text !== 'string') return '';

    // Remove HTML tags and encode special characters
    let sanitized = validator.escape(text.trim());

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validate name (first name, last name)
   */
  static validateName(
    name: string,
    fieldName: string = 'Name'
  ): { valid: boolean; sanitized: string; error?: string } {
    if (!name || typeof name !== 'string') {
      return { valid: false, sanitized: '', error: `${fieldName} is required` };
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
      return { valid: false, sanitized: '', error: `${fieldName} must be at least 2 characters` };
    }

    if (trimmed.length > 50) {
      return { valid: false, sanitized: '', error: `${fieldName} too long (max 50 characters)` };
    }

    // Only allow letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-ZåäöÅÄÖéèêëÉÈÊË\s'-]+$/.test(trimmed)) {
      return { valid: false, sanitized: '', error: `${fieldName} contains invalid characters` };
    }

    return { valid: true, sanitized: trimmed };
  }

  /**
   * Validate phone number
   */
  static validatePhone(phone: string): { valid: boolean; sanitized: string; error?: string } {
    if (!phone) return { valid: true, sanitized: '' }; // Optional field

    const cleaned = phone.replace(/\D/g, ''); // Remove non-digits

    if (cleaned.length < 7 || cleaned.length > 15) {
      return { valid: false, sanitized: '', error: 'Invalid phone number' };
    }

    return { valid: true, sanitized: `+${cleaned}` };
  }

  /**
   * Validate UUID
   */
  static validateUUID(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    return validator.isUUID(id, 4);
  }

  /**
   * Validate URL
   */
  static validateURL(url: string): { valid: boolean; sanitized: string; error?: string } {
    if (!url || typeof url !== 'string') {
      return { valid: false, sanitized: '', error: 'URL is required' };
    }

    const trimmed = url.trim();

    if (
      !validator.isURL(trimmed, {
        protocols: ['http', 'https'],
        require_protocol: true,
      })
    ) {
      return { valid: false, sanitized: '', error: 'Invalid URL format' };
    }

    return { valid: true, sanitized: trimmed };
  }

  /**
   * Validate organization number (Swedish format)
   */
  static validateOrgNumber(orgNumber: string): {
    valid: boolean;
    sanitized: string;
    error?: string;
  } {
    if (!orgNumber || typeof orgNumber !== 'string') {
      return { valid: true, sanitized: '' }; // Optional
    }

    const cleaned = orgNumber.replace(/\D/g, '');

    // Swedish org numbers are 10 digits
    if (cleaned.length !== 10) {
      return { valid: false, sanitized: '', error: 'Organization number must be 10 digits' };
    }

    return { valid: true, sanitized: cleaned };
  }

  /**
   * Validate numeric input
   */
  static validateNumber(
    value: any,
    min?: number,
    max?: number
  ): { valid: boolean; value: number; error?: string } {
    const num = Number(value);

    if (isNaN(num)) {
      return { valid: false, value: 0, error: 'Must be a valid number' };
    }

    if (min !== undefined && num < min) {
      return { valid: false, value: 0, error: `Must be at least ${min}` };
    }

    if (max !== undefined && num > max) {
      return { valid: false, value: 0, error: `Must be at most ${max}` };
    }

    return { valid: true, value: num };
  }

  /**
   * Validate address
   */
  static validateAddress(address: string): { valid: boolean; sanitized: string; error?: string } {
    if (!address) return { valid: true, sanitized: '' }; // Optional

    const trimmed = address.trim();

    if (trimmed.length > 200) {
      return { valid: false, sanitized: '', error: 'Address too long (max 200 characters)' };
    }

    // Sanitize to prevent XSS
    const sanitized = validator.escape(trimmed);

    return { valid: true, sanitized };
  }
}
