// Client-side PII and crisis detection utilities

// Regex patterns for PII detection
const PHONE_REGEX = /\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}|\b\d{7,}\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
const ADDRESS_REGEX = /\d+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Boulevard|Blvd|Drive|Dr|Court|Ct|Way)\b/gi;
const CREDIT_CARD_REGEX = /\b\d{13,19}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

// Crisis keywords
const CRISIS_KEYWORDS = [
  'kill myself',
  'end my life',
  'commit suicide',
  'want to die',
  'planning to die',
  'no reason to live',
  'better off dead',
  'suicide plan',
  'take my life',
];

const SELF_HARM_KEYWORDS = [
  'cut myself',
  'hurt myself',
  'self harm',
  'self-harm',
  'harming myself',
];

export interface PIIDetectionResult {
  hasPII: boolean;
  types: string[];
  message: string;
}

export interface CrisisDetectionResult {
  isCrisis: boolean;
  level: 'high' | 'medium' | 'low' | 'none';
  keywords: string[];
}

export function detectPII(text: string): PIIDetectionResult {
  const types: string[] = [];
  
  if (PHONE_REGEX.test(text)) types.push('phone number');
  if (EMAIL_REGEX.test(text)) types.push('email address');
  if (ADDRESS_REGEX.test(text)) types.push('street address');
  if (CREDIT_CARD_REGEX.test(text)) types.push('credit card');
  if (SSN_REGEX.test(text)) types.push('social security number');
  
  // Check for any name patterns including first names only
  const lowerText = text.toLowerCase();
  const namePatterns = [
    /my name is\s+([A-Z][a-z]+)/i,                  // "my name is John"
    /i am\s+([A-Z][a-z]+)(?:\s|$|[,.])/i,          // "I am John" with capital letter
    /i'm\s+([A-Z][a-z]+)(?:\s|$|[,.])/i,           // "I'm John"
    /call me\s+([A-Z][a-z]+)/i,                     // "call me John"
    /myself\s+([A-Z][a-z]+)/i,                      // "myself Sam"
    /this is\s+([A-Z][a-z]+)(?:\s|$|[,.])/i,       // "this is John"
  ];
  
  for (const pattern of namePatterns) {
    if (pattern.test(text)) {
      types.push('name');
      break;
    }
  }
  
  if (lowerText.includes('i live at') || lowerText.includes('my address')) {
    if (!types.includes('street address')) types.push('address information');
  }
  
  const hasPII = types.length > 0;
  const message = hasPII
    ? `This message appears to contain: ${types.join(', ')}. Sharing personal information can put you at risk. Please edit to protect your privacy.`
    : '';
  
  return { hasPII, types, message };
}

export function detectCrisis(text: string): CrisisDetectionResult {
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];
  
  // Check for high-severity crisis keywords
  for (const keyword of CRISIS_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }
  
  // Check for medium-severity self-harm keywords
  for (const keyword of SELF_HARM_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }
  
  let level: 'high' | 'medium' | 'low' | 'none' = 'none';
  
  if (foundKeywords.some(k => CRISIS_KEYWORDS.includes(k))) {
    level = 'high';
  } else if (foundKeywords.some(k => SELF_HARM_KEYWORDS.includes(k))) {
    level = 'medium';
  } else if (lowerText.includes('depressed') || lowerText.includes('hopeless') || lowerText.includes('can\'t go on')) {
    level = 'low';
    foundKeywords.push('distress indicators');
  }
  
  return {
    isCrisis: level !== 'none',
    level,
    keywords: foundKeywords,
  };
}

export function sanitizeMessage(text: string): string {
  // Replace detected PII with [REDACTED]
  let sanitized = text;
  sanitized = sanitized.replace(PHONE_REGEX, '[PHONE REDACTED]');
  sanitized = sanitized.replace(EMAIL_REGEX, '[EMAIL REDACTED]');
  sanitized = sanitized.replace(SSN_REGEX, '[SSN REDACTED]');
  sanitized = sanitized.replace(CREDIT_CARD_REGEX, '[CARD REDACTED]');
  
  return sanitized;
}
