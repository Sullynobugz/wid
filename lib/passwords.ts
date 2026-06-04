const ADJECTIVES = ['Mond', 'Stern', 'Berg', 'See', 'Wind', 'Wald', 'Feld', 'Bach', 'Licht', 'Tag']
const DIGITS = '0123456789'
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateParticipantCode(): string {
  let code = 'WID-'
  for (let i = 0; i < 5; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return code
}

export function generatePassword(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  let nums = ''
  for (let i = 0; i < 4; i++) nums += DIGITS[Math.floor(Math.random() * DIGITS.length)]
  return `${adj}-${nums}`
}

export function codeToEmail(code: string): string {
  return `${code.toLowerCase()}@wid.internal`
}
