const TYPO_FIXES = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
};

// Common throwaway providers. Extend this list as you see abuse.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'dispostable.com',
]);

export function checkEmailDomain(email) {
  const [localPart = '', domain = ''] = email.trim().toLowerCase().split('@');
  if (!localPart || !domain) return { ok: false, message: 'Enter a valid email.' };
  if (TYPO_FIXES[domain])
    return { ok: false, message: `Did you mean ${localPart}@${TYPO_FIXES[domain]}?` };
  if (DISPOSABLE_DOMAINS.has(domain))
    return { ok: false, message: 'Please use a permanent email address, not a temporary one.' };
  return { ok: true };
}