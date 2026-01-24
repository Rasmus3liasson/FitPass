export const sanitizeLogData = (data: any): any => {
  if (typeof data === 'string') {
    // Remove potential card numbers, CVCs, or sensitive patterns
    return data
      .replace(/\b\d{13,19}\b/g, '****CARD_NUMBER_REDACTED****')
      .replace(/\b\d{3,4}\b/g, (match) => {
        return match.length <= 4 ? '***' : match;
      });
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };

    // List of sensitive fields to redact
    const sensitiveFields = [
      'card_number',
      'number',
      'cvc',
      'cvv',
      'cvv2',
      'exp_month',
      'exp_year',
      'client_secret',
      'secret',
      'password',
      'token',
      'key',
    ];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeLogData(sanitized[key]);
      }
    });

    return sanitized;
  }

  return data;
};

export const createSampleTestCard = (cardNumber: string = '4242424242424242') => {
  const testTokenMap: { [key: string]: string } = {
    '4242424242424242': 'tok_visa',
    '4000000000000002': 'tok_visa_debit',
    '5555555555554444': 'tok_mastercard',
    '4000002500003155': 'tok_visa', // 3D Secure
    '4000000000009995': 'tok_visa', // Insufficient funds
  };

  return testTokenMap[cardNumber] || 'tok_visa';
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString();
};

export const calculateDaysUntilRenewal = (endTimestamp: number): number => {
  return Math.ceil((endTimestamp * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
