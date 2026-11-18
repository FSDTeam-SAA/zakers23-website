export interface CountryInfo {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  minLen: number;
  maxLen: number;
  placeholder?: string;
  format?: (nationalDigits: string) => string;
}

export const COUNTRIES: CountryInfo[] = [
  {
    code: "US",
    name: "United States",
    dialCode: "+1",
    flag: "🇺🇸",
    minLen: 10,
    maxLen: 10,
    placeholder: "(305) 555-0199",
    format: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
    },
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "+1",
    flag: "🇨🇦",
    minLen: 10,
    maxLen: 10,
    placeholder: "(416) 555-0199",
    format: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
    },
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    flag: "🇬🇧",
    minLen: 10,
    maxLen: 11,
    placeholder: "7911 123456",
    format: (d) => {
      if (d.length <= 4) return d;
      if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
      return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 11)}`;
    },
  },
  {
    code: "BD",
    name: "Bangladesh",
    dialCode: "+880",
    flag: "🇧🇩",
    minLen: 10,
    maxLen: 10,
    placeholder: "01712-345678",
    format: (d) => {
      const num = d.startsWith("0") ? d.slice(1) : d;
      if (num.length <= 4) return `0${num}`;
      return `0${num.slice(0, 4)}-${num.slice(4, 10)}`;
    },
  },
  {
    code: "IN",
    name: "India",
    dialCode: "+91",
    flag: "🇮🇳",
    minLen: 10,
    maxLen: 10,
    placeholder: "98765 43210",
    format: (d) => {
      if (d.length <= 5) return d;
      return `${d.slice(0, 5)} ${d.slice(5, 10)}`;
    },
  },
  {
    code: "MX",
    name: "Mexico",
    dialCode: "+52",
    flag: "🇲🇽",
    minLen: 10,
    maxLen: 10,
    placeholder: "55 1234 5678",
    format: (d) => {
      if (d.length <= 2) return d;
      if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 10)}`;
    },
  },
  {
    code: "BR",
    name: "Brazil",
    dialCode: "+55",
    flag: "🇧🇷",
    minLen: 10,
    maxLen: 11,
    placeholder: "(11) 91234-5678",
    format: (d) => {
      if (d.length <= 2) return d;
      if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    },
  },
  {
    code: "CO",
    name: "Colombia",
    dialCode: "+57",
    flag: "🇨🇴",
    minLen: 10,
    maxLen: 10,
    placeholder: "300 123 4567",
    format: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
    },
  },
  {
    code: "AR",
    name: "Argentina",
    dialCode: "+54",
    flag: "🇦🇷",
    minLen: 10,
    maxLen: 11,
    placeholder: "11 1234-5678",
  },
  {
    code: "FR",
    name: "France",
    dialCode: "+33",
    flag: "🇫🇷",
    minLen: 9,
    maxLen: 10,
    placeholder: "06 12 34 56 78",
    format: (d) => {
      return d.match(/.{1,2}/g)?.join(" ") || d;
    },
  },
  {
    code: "DE",
    name: "Germany",
    dialCode: "+49",
    flag: "🇩🇪",
    minLen: 10,
    maxLen: 11,
    placeholder: "0151 1234567",
  },
  {
    code: "IT",
    name: "Italy",
    dialCode: "+39",
    flag: "🇮🇹",
    minLen: 9,
    maxLen: 11,
    placeholder: "312 345 6789",
  },
  {
    code: "ES",
    name: "Spain",
    dialCode: "+34",
    flag: "🇪🇸",
    minLen: 9,
    maxLen: 9,
    placeholder: "612 34 56 78",
    format: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`;
    },
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    flag: "🇦🇪",
    minLen: 9,
    maxLen: 9,
    placeholder: "50 123 4567",
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    dialCode: "+966",
    flag: "🇸🇦",
    minLen: 9,
    maxLen: 9,
    placeholder: "50 123 4567",
  },
  {
    code: "IL",
    name: "Israel",
    dialCode: "+972",
    flag: "🇮🇱",
    minLen: 9,
    maxLen: 9,
    placeholder: "50-123-4567",
  },
  {
    code: "CH",
    name: "Switzerland",
    dialCode: "+41",
    flag: "🇨🇭",
    minLen: 9,
    maxLen: 9,
    placeholder: "79 123 45 67",
  },
  {
    code: "AU",
    name: "Australia",
    dialCode: "+61",
    flag: "🇦🇺",
    minLen: 9,
    maxLen: 9,
    placeholder: "412 345 678",
  },
  {
    code: "CL",
    name: "Chile",
    dialCode: "+56",
    flag: "🇨🇱",
    minLen: 9,
    maxLen: 9,
    placeholder: "9 1234 5678",
  },
  {
    code: "PE",
    name: "Peru",
    dialCode: "+51",
    flag: "🇵🇪",
    minLen: 9,
    maxLen: 9,
    placeholder: "912 345 678",
  },
  {
    code: "VE",
    name: "Venezuela",
    dialCode: "+58",
    flag: "🇻🇪",
    minLen: 10,
    maxLen: 10,
    placeholder: "412 1234567",
  },
  {
    code: "TR",
    name: "Turkey",
    dialCode: "+90",
    flag: "🇹🇷",
    minLen: 10,
    maxLen: 10,
    placeholder: "532 123 4567",
  },
  {
    code: "MC",
    name: "Monaco",
    dialCode: "+377",
    flag: "🇲🇨",
    minLen: 8,
    maxLen: 9,
    placeholder: "6 12 34 56 78",
  },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // US (+1)

export function getCountryByCode(code: string): CountryInfo {
  return COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase()) || DEFAULT_COUNTRY;
}

export function detectUserCountry(): CountryInfo {
  if (typeof window === "undefined") return DEFAULT_COUNTRY;

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("Dhaka")) return getCountryByCode("BD");
    if (tz.includes("Kolkata") || tz.includes("Calcutta")) return getCountryByCode("IN");
    if (tz.includes("London")) return getCountryByCode("GB");
    if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("Montreal")) return getCountryByCode("CA");
    if (tz.includes("Mexico")) return getCountryByCode("MX");
    if (tz.includes("Sao_Paulo")) return getCountryByCode("BR");
    if (tz.includes("Bogota")) return getCountryByCode("CO");
    if (tz.includes("Buenos_Aires")) return getCountryByCode("AR");
    if (tz.includes("Paris")) return getCountryByCode("FR");
    if (tz.includes("Berlin")) return getCountryByCode("DE");
    if (tz.includes("Madrid")) return getCountryByCode("ES");
    if (tz.includes("Rome")) return getCountryByCode("IT");
    if (tz.includes("Dubai")) return getCountryByCode("AE");
    if (tz.includes("Sydney") || tz.includes("Melbourne")) return getCountryByCode("AU");
  } catch {
    // fallback
  }

  return DEFAULT_COUNTRY;
}

/**
 * Strips all non-digit characters from the input.
 */
export function cleanDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Checks whether a number is an obvious fake, repeating digit, or test number.
 */
export function isObviousFakeNumber(digits: string, countryCode: string): { isFake: boolean; reason?: string } {
  if (!digits || digits.length < 5) {
    return { isFake: true, reason: "Phone number is too short." };
  }

  // All same digit, e.g. 1111111111, 0000000000, 9999999999
  if (/^(\d)\1+$/.test(digits)) {
    return { isFake: true, reason: "Please enter a valid mobile phone number." };
  }

  // Obvious sequential digits, e.g. 1234567890, 0123456789, 9876543210
  if ("0123456789012345".includes(digits) || "9876543210987654".includes(digits)) {
    return { isFake: true, reason: "Please enter a valid mobile phone number." };
  }

  // US/Canada (NANP) specific fake patterns
  if (countryCode === "US" || countryCode === "CA") {
    // 555 fictional area code or repeating 555-5555
    if (digits.startsWith("555") || digits.includes("5555555") || digits === "5555555555") {
      return { isFake: true, reason: "Please enter a real phone number." };
    }

    // Invalid area codes: area code starting with 0 or 1
    if (digits.length >= 3 && (digits[0] === "0" || digits[0] === "1")) {
      return { isFake: true, reason: "Area code cannot start with 0 or 1." };
    }

    // Service codes (N11): e.g. 911, 411, 211 as area code
    if (digits.length >= 3 && digits[1] === "1" && digits[2] === "1") {
      return { isFake: true, reason: "Invalid area code." };
    }

    // Invalid central office / exchange code (starts with 0 or 1)
    if (digits.length >= 4 && (digits[3] === "0" || digits[3] === "1")) {
      return { isFake: true, reason: "Invalid phone number." };
    }
  }

  return { isFake: false };
}

/**
 * Validates a national phone number according to country rules.
 */
export function validatePhoneNumber(
  rawInput: string,
  country: CountryInfo
): { isValid: boolean; error?: string; e164: string; nationalDigits: string } {
  const digits = cleanDigits(rawInput);

  if (!digits) {
    return { isValid: false, error: "Mobile phone number is required.", e164: "", nationalDigits: "" };
  }

  // If visitor mistakenly entered "+1" or country dial code at the beginning, strip it cleanly
  const dialCodeDigits = country.dialCode.replace(/\D/g, "");
  let national = digits;
  if (national.startsWith(dialCodeDigits) && national.length > country.maxLen) {
    national = national.slice(dialCodeDigits.length);
  }

  // Strip leading national trunk zero for countries where standard E.164 omits it
  if (country.code === "BD" && national.startsWith("0") && national.length === 11) {
    national = national.slice(1);
  }
  if (country.code === "GB" && national.startsWith("0") && national.length === 11) {
    national = national.slice(1);
  }
  if (country.code === "FR" && national.startsWith("0") && national.length === 10) {
    national = national.slice(1);
  }

  // Length checks
  if (national.length < country.minLen) {
    return {
      isValid: false,
      error: `Phone number is too short (${country.name} requires ${country.minLen} digits).`,
      e164: "",
      nationalDigits: national,
    };
  }

  if (national.length > country.maxLen) {
    return {
      isValid: false,
      error: `Phone number is too long (${country.name} accepts up to ${country.maxLen} digits).`,
      e164: "",
      nationalDigits: national,
    };
  }

  // Fake number checks
  const fakeCheck = isObviousFakeNumber(national, country.code);
  if (fakeCheck.isFake) {
    return {
      isValid: false,
      error: fakeCheck.reason || "Please enter a valid mobile phone number.",
      e164: "",
      nationalDigits: national,
    };
  }

  // Assemble full E.164 phone: "+<dialCode><nationalDigits>"
  const e164 = `${country.dialCode}${national}`;

  return {
    isValid: true,
    e164,
    nationalDigits: national,
  };
}

/**
 * Detects whether an input string starts with a valid country dial code (e.g. "+1", "+44", "+880").
 * Useful when mobile browsers autofill full international contact numbers.
 */
export function detectCountryFromPhone(rawInput: string): CountryInfo | null {
  const trimmed = rawInput.trim();
  if (!trimmed.startsWith("+")) return null;
  const digits = cleanDigits(trimmed);
  if (!digits) return null;

  // Match longest dial code first to avoid prefix collisions (e.g. +1 vs +1246)
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    const codeDigits = c.dialCode.replace(/\D/g, "");
    if (digits.startsWith(codeDigits) && digits.length > codeDigits.length) {
      return c;
    }
  }
  return null;
}

/**
 * Formats a national number for display while the user types or browser autofills.
 */
export function formatAsYouType(rawInput: string, country: CountryInfo): string {
  let digits = cleanDigits(rawInput);
  if (!digits) return "";

  // If visitor typed or browser autofilled with the country dial code (e.g. "+1" or "1" for US),
  // strip the leading dial code so national digits are formatted correctly!
  const dialCodeDigits = country.dialCode.replace(/\D/g, "");
  if (digits.startsWith(dialCodeDigits) && digits.length > country.maxLen) {
    digits = digits.slice(dialCodeDigits.length);
  }

  // Strip domestic trunk zero if applicable (e.g. BD, GB, FR) when length exceeds maxLen
  if (country.code === "BD" && digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (country.code === "GB" && digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (country.code === "FR" && digits.startsWith("0") && digits.length === 10) {
    digits = digits.slice(1);
  }

  if (country.format) {
    return country.format(digits.slice(0, country.maxLen));
  }
  return digits.slice(0, country.maxLen);
}
