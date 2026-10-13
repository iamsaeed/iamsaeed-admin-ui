/**
 * Phone numbers as a country plus national digits, and the single international string a backend
 * stores. Pure functions over libphonenumber-js, so a screen can turn what `PhoneInput` holds into
 * the stored value (and back) without touching the component.
 */
import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, upper case. */
  iso: string
  name: string
  /** Calling code without the plus: "91". */
  dialCode: string
}

/** `Intl.DisplayNames` is missing from older TS libs, so it is reached through a narrow cast. */
const regionNames: { of(code: string): string | undefined } | null = (() => {
  try {
    const ctor = (Intl as unknown as {
      DisplayNames?: new (locales: string[], options: { type: string }) => { of(code: string): string | undefined }
    }).DisplayNames
    return ctor ? new ctor(['en'], { type: 'region' }) : null
  } catch {
    return null
  }
})()

/** Every country libphonenumber knows, sorted by name. */
export const PHONE_COUNTRIES: PhoneCountry[] = getCountries()
  .map((iso: CountryCode) => ({ iso, name: regionNames?.of(iso) ?? iso, dialCode: getCountryCallingCode(iso) }))
  .sort((a, b) => a.name.localeCompare(b.name))

const BY_ISO = new Map(PHONE_COUNTRIES.map((country) => [country.iso, country]))

export function phoneCountry(iso: string): PhoneCountry | undefined {
  return BY_ISO.get(iso.toUpperCase())
}

/**
 * What the person typed, as the component should hold it. A full international number ("+91 …")
 * names its own country, so the country is returned and the calling code is dropped from the
 * digits (the badge already shows it). Anything else is kept as typed.
 */
export function readTypedPhone(raw: string, currentIso: string): { iso: string; national: string } {
  const text = raw.trim()
  if (text.startsWith('+')) {
    const typed = new AsYouType()
    typed.input(text)
    const detected = typed.country
    if (detected && BY_ISO.has(detected)) {
      const dial = getCountryCallingCode(detected)
      const digits = text.replace(/\D/g, '')
      if (digits.startsWith(dial)) return { iso: detected, national: digits.slice(dial.length) }
    }
  }
  return { iso: currentIso, national: raw }
}

/**
 * Country + national digits → "+919161459446", or '' when there are no digits. A leading trunk
 * zero ("09161459446") is dropped for the country, as a dialler would.
 */
export function toE164(iso: string, national: string): string {
  const digits = national.replace(/\D/g, '')
  if (digits === '') return ''
  const country = phoneCountry(iso)
  if (!country) return ''
  const parsed = parsePhoneNumberFromString(digits, iso.toUpperCase() as CountryCode)
  if (parsed) return parsed.number
  return `+${country.dialCode}${digits.replace(/^0+/, '')}`
}

/**
 * A stored value → country + national digits. "+919161459446" gives IN and 9161459446. A value with
 * no plus is read as a national number of `fallbackIso`. An unreadable value comes back whole as
 * the national part, so editing never silently loses what was stored.
 */
export function fromE164(value: string | null | undefined, fallbackIso: string): { iso: string; national: string } {
  const text = (value ?? '').trim()
  if (text === '') return { iso: fallbackIso, national: '' }
  const parsed = parsePhoneNumberFromString(text, text.startsWith('+') ? undefined : (fallbackIso.toUpperCase() as CountryCode))
  if (parsed && parsed.country && BY_ISO.has(parsed.country)) return { iso: parsed.country, national: parsed.nationalNumber }
  if (parsed) {
    const dial = parsed.countryCallingCode
    const iso = PHONE_COUNTRIES.find((country) => country.dialCode === dial)?.iso
    if (iso) return { iso, national: parsed.nationalNumber }
  }
  return { iso: fallbackIso, national: text }
}
