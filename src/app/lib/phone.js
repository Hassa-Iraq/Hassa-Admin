const DIAL_CODE_TO_FLAG = [
  ['+971', '🇦🇪'],
  ['+966', '🇸🇦'],
  ['+964', '🇮🇶'],
  ['+880', '🇧🇩'],
  ['+855', '🇰🇭'],
  ['+856', '🇱🇦'],
  ['+977', '🇳🇵'],
  ['+972', '🇮🇱'],
  ['+968', '🇴🇲'],
  ['+973', '🇧🇭'],
  ['+974', '🇶🇦'],
  ['+975', '🇧🇹'],
  ['+976', '🇲🇳'],
  ['+992', '🇹🇯'],
  ['+993', '🇹🇲'],
  ['+994', '🇦🇿'],
  ['+995', '🇬🇪'],
  ['+996', '🇰🇬'],
  ['+998', '🇺🇿'],
  ['+886', '🇹🇼'],
  ['+852', '🇭🇰'],
  ['+853', '🇲🇴'],
  ['+965', '🇰🇼'],
  ['+962', '🇯🇴'],
  ['+961', '🇱🇧'],
  ['+963', '🇸🇾'],
  ['+960', '🇲🇻'],
  ['+886', '🇹🇼'],
  ['+886', '🇹🇼'],
  ['+92', '🇵🇰'],
  ['+91', '🇮🇳'],
  ['+90', '🇹🇷'],
  ['+86', '🇨🇳'],
  ['+81', '🇯🇵'],
  ['+82', '🇰🇷'],
  ['+65', '🇸🇬'],
  ['+60', '🇲🇾'],
  ['+62', '🇮🇩'],
  ['+63', '🇵🇭'],
  ['+66', '🇹🇭'],
  ['+84', '🇻🇳'],
  ['+94', '🇱🇰'],
  ['+95', '🇲🇲'],
  ['+98', '🇮🇷'],
  ['+44', '🇬🇧'],
  ['+33', '🇫🇷'],
  ['+34', '🇪🇸'],
  ['+39', '🇮🇹'],
  ['+49', '🇩🇪'],
  ['+7', '🇷🇺'],
  ['+1', '🇺🇸'],
];

const uniqueDialCodeToFlag = Array.from(
  new Map(DIAL_CODE_TO_FLAG.map(([code, flag]) => [code, flag])).entries()
).sort((a, b) => b[0].length - a[0].length);

const normalizeDialCode = (countryCode = '') => {
  const raw = String(countryCode || '').trim();
  if (!raw) return '';
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? `+${digits}` : '';
};

const extractDialCodeFromPhone = (phone = '') => {
  const raw = String(phone || '').trim();
  if (!raw.startsWith('+')) return '';
  for (const [code] of uniqueDialCodeToFlag) {
    if (raw.startsWith(code)) return code;
  }
  const generic = raw.match(/^\+\d{1,4}/);
  return generic ? generic[0] : '';
};

const resolveFlag = (dialCode = '') => {
  if (!dialCode) return '🌐';
  const matched = uniqueDialCodeToFlag.find(([code]) => dialCode.startsWith(code));
  return matched?.[1] || '🌐';
};

export const formatPhoneWithFlag = (phone = '', countryCode = '') => {
  const rawPhone = String(phone || '').trim();
  if (!rawPhone) return '-';
  const normalizedCode = normalizeDialCode(countryCode);
  const resolvedCode = extractDialCodeFromPhone(rawPhone) || normalizedCode;
  const flag = resolveFlag(resolvedCode);
  return `${flag} ${rawPhone}`;
};
