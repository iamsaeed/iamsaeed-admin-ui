/**
 * `@iamsaeed/admin-ui/phone` - the phone-number input.
 *
 * A separate entry on purpose, like `/editor`: it carries libphonenumber-js's number metadata, and
 * an app with no phone field should not ship it. Import it only where it is used:
 *
 *     import { PhoneInput, toE164, fromE164 } from '@iamsaeed/admin-ui/phone'
 *     import '@iamsaeed/admin-ui/phone.css'   // once: the country flags
 *
 * Its own styles are in the main stylesheet (`@iamsaeed/admin-ui/styles`), which you already import.
 */
export { default as PhoneInput } from './components/ui/PhoneInput.vue'
export { PHONE_COUNTRIES, phoneCountry, readTypedPhone, toE164, fromE164, type PhoneCountry } from './utils/phone'
