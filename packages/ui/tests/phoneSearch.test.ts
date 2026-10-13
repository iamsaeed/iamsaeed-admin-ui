import { describe, expect, it } from 'vitest'
import { PHONE_COUNTRIES, searchCountries } from '../src/utils/phone'

/**
 * The country picker's search. It used to be a plain filter over an alphabetical list, so typing
 * "India" showed British Indian Ocean Territory (+246) above India (+91). These pin the ranking.
 */

const names = (query: string): string[] => searchCountries(query).map((country) => country.name)

describe('searchCountries', () => {
  it('returns every country, in order, for an empty search', () => {
    expect(searchCountries('')).toBe(PHONE_COUNTRIES)
    expect(searchCountries('   ')).toBe(PHONE_COUNTRIES)
  })

  it('puts India first for "India", with the Indian Ocean territory after it', () => {
    const result = names('India')
    expect(result[0]).toBe('India')
    expect(result).toContain('British Indian Ocean Territory')
    expect(result.indexOf('British Indian Ocean Territory')).toBeGreaterThan(0)
  })

  it('ranks an exact ISO code first: "us" is the United States', () => {
    expect(searchCountries('us')[0]?.iso).toBe('US')
    expect(searchCountries('IN')[0]?.iso).toBe('IN')
  })

  it('ranks names that start with the search before names that only contain it', () => {
    expect(names('indo')[0]).toBe('Indonesia')

    // "indi" starts "India" and only starts a later word of "British Indian Ocean Territory".
    const result = names('indi')
    expect(result[0]).toBe('India')
    expect(result.indexOf('India')).toBeLessThan(result.indexOf('British Indian Ocean Territory'))
    expect(result.indexOf('British Indian Ocean Territory')).toBeGreaterThan(-1)
  })

  it('finds a country by a later word in its name', () => {
    expect(names('ocean')).toContain('British Indian Ocean Territory')
    expect(names('king')[0]).toBe('United Kingdom')
  })

  it('ranks a word that starts the search before a name that merely contains it', () => {
    const result = names('land')
    // "land" starts a word in Åland/Finland? It must put whole-word starts ahead of substrings.
    const firstSubstringOnly = result.findIndex((name) => !name.toLowerCase().split(/[^a-z]+/).some((word) => word.startsWith('land')))
    const lastWordStart = result.map((name) => name.toLowerCase().split(/[^a-z]+/).some((word) => word.startsWith('land'))).lastIndexOf(true)
    if (firstSubstringOnly !== -1 && lastWordStart !== -1) expect(lastWordStart).toBeLessThan(firstSubstringOnly)
  })

  it('ignores case and accents', () => {
    expect(names('COTE')[0]).toMatch(/^C.te d.Ivoire$/)
    expect(names('curacao')[0]).toMatch(/^Cura/)
  })

  it('ranks a calling code: "+91" and "91" put India first', () => {
    expect(searchCountries('+91')[0]?.name).toBe('India')
    expect(searchCountries('91')[0]?.name).toBe('India')
  })

  it('puts the country people mean first for a shared calling code', () => {
    expect(searchCountries('+44')[0]?.name).toBe('United Kingdom')
    const list = names('44')
    expect(list.slice(0, 4)).toContain('Jersey')
    expect(searchCountries('+1')[0]?.name).toBe('United States')
    expect(searchCountries('+7')[0]?.name).toBe('Russia')
  })

  it('lists codes that merely start with the digits after the exact ones', () => {
    const result = searchCountries('+9')
    expect(result.length).toBeGreaterThan(5)
    expect(result.every((country) => country.dialCode.startsWith('9'))).toBe(true)
  })

  it('keeps alphabetical order inside a rank, and returns nothing for a nonsense search', () => {
    const list = names('+1')
    const rest = list.slice(1)
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)))
    expect(searchCountries('zzzzzz')).toEqual([])
  })
})
