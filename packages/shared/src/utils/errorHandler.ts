/**
 * Secure error handler to prevent information disclosure
 * Maps technical errors to user-friendly Swedish messages
 */
export class SecureErrorHandler {
  // Generic fallback message
  private static readonly GENERIC_ERROR = 'Ett oväntat fel uppstod. Försök igen senare.';

  /**
   * Sanitize error for user display
   * Removes technical details, stack traces, database info
   */
  static sanitize(error: unknown): string {
    if (!error) {
      return this.GENERIC_ERROR;
    }

    // Handle string errors
    if (typeof error === 'string') {
      return this.mapErrorMessage(error);
    }

    // Handle Error objects
    if (error instanceof Error) {
      return this.mapErrorMessage(error.message);
    }

    // Handle objects with message property
    if (typeof error === 'object' && 'message' in error) {
      const message = (error as { message: unknown }).message;
      if (typeof message === 'string') {
        return this.mapErrorMessage(message);
      }
    }

    return this.GENERIC_ERROR;
  }

  /**
   * Map technical error messages to user-friendly Swedish messages
   */
  private static mapErrorMessage(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Authentication errors
    if (lowerMessage.includes('invalid login credentials') || 
        lowerMessage.includes('invalid credentials')) {
      return 'Fel e-postadress eller lösenord.';
    }

    if (lowerMessage.includes('email not confirmed') || 
        lowerMessage.includes('email confirmation')) {
      return 'E-postadressen är inte verifierad. Kontrollera din inkorg.';
    }

    if (lowerMessage.includes('user already registered') || 
        lowerMessage.includes('user already exists') ||
        lowerMessage.includes('email already in use')) {
      return 'Ett konto med denna e-postadress finns redan.';
    }

    if (lowerMessage.includes('weak password') || 
        lowerMessage.includes('password too short')) {
      return 'Lösenordet är för svagt. Använd minst 8 tecken.';
    }

    if (lowerMessage.includes('invalid token') || 
        lowerMessage.includes('token expired') ||
        lowerMessage.includes('jwt expired')) {
      return 'Din session har gått ut. Vänligen logga in igen.';
    }

    // Network errors
    if (lowerMessage.includes('network') || 
        lowerMessage.includes('fetch failed') ||
        lowerMessage.includes('failed to fetch')) {
      return 'Ingen internetanslutning. Kontrollera din uppkoppling.';
    }

    if (lowerMessage.includes('timeout') || 
        lowerMessage.includes('timed out')) {
      return 'Anslutningen tog för lång tid. Försök igen.';
    }

    // Payment errors
    if (lowerMessage.includes('card declined') || 
        lowerMessage.includes('insufficient funds')) {
      return 'Betalningen nekades. Kontrollera dina kortuppgifter.';
    }

    if (lowerMessage.includes('payment failed') || 
        lowerMessage.includes('charge failed')) {
      return 'Betalningen kunde inte genomföras. Försök igen.';
    }

    // Database/server errors (hide all technical details)
    if (lowerMessage.includes('database') || 
        lowerMessage.includes('sql') ||
        lowerMessage.includes('postgres') ||
        lowerMessage.includes('supabase') ||
        lowerMessage.includes('internal server') ||
        lowerMessage.includes('500')) {
      return 'Tjänsten är tillfälligt otillgänglig. Försök igen om en stund.';
    }

    // Rate limiting
    if (lowerMessage.includes('too many requests') || 
        lowerMessage.includes('rate limit')) {
      return 'För många försök. Vänta en stund innan du försöker igen.';
    }

    // Validation errors - pass through if they're already user-friendly
    if (lowerMessage.includes('invalid email') || 
        lowerMessage.includes('ogiltig e-post')) {
      return 'Ogiltig e-postadress.';
    }

    if (lowerMessage.includes('invalid phone') || 
        lowerMessage.includes('ogiltigt telefonnummer')) {
      return 'Ogiltigt telefonnummer.';
    }

    // Permission errors
    if (lowerMessage.includes('permission denied') || 
        lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('forbidden') ||
        lowerMessage.includes('403')) {
      return 'Du har inte behörighet att utföra denna åtgärd.';
    }

    if (lowerMessage.includes('not found') || 
        lowerMessage.includes('404')) {
      return 'Det du söker kunde inte hittas.';
    }

    // If message is short and doesn't contain technical info, it might be safe
    if (message.length < 100 && 
        !this.containsTechnicalInfo(lowerMessage)) {
      return message;
    }

    // Default to generic error for anything else
    return this.GENERIC_ERROR;
  }

  /**
   * Check if message contains technical information
   */
  private static containsTechnicalInfo(message: string): boolean {
    const technicalKeywords = [
      'stack', 'trace', 'function', 'undefined',
      'null', 'object', 'array', 'json',
      'http', 'https', 'localhost', 'port',
      'column', 'line', 'file', 'path',
      'exception', 'error:', 'at ', 'in ',
      'code:', 'status:', 'errno', 'syscall',
    ];

    return technicalKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Log error securely (for debugging, not shown to user)
   * In production, send to error tracking service
   */
  static logError(error: unknown, context?: string): void {
    if (__DEV__) {
      console.error('[SecureErrorHandler]', context || 'Error:', error);
    }
    
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { tags: { context } });
  }

  /**
   * Handle async errors with consistent error sanitization
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<{ data?: T; error?: string }> {
    try {
      const data = await operation();
      return { data };
    } catch (error) {
      this.logError(error, context);
      return { error: this.sanitize(error) };
    }
  }
}
