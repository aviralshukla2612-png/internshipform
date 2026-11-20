import { Gender } from '@recruitment/shared';

describe('Mandatory Gender Field Validation Suite', () => {
  const validateGender = (genderInput: any): boolean => {
    if (!genderInput) return false;
    const permittedGenders = Object.values(Gender);
    return permittedGenders.includes(genderInput);
  };

  it('should accept all valid mandatory gender options', () => {
    expect(validateGender(Gender.MALE)).toBe(true);
    expect(validateGender(Gender.FEMALE)).toBe(true);
    expect(validateGender(Gender.OTHER)).toBe(true);
    expect(validateGender(Gender.PREFER_NOT_TO_DISCLOSE)).toBe(true);
  });

  it('should reject empty, undefined, or null gender', () => {
    expect(validateGender('')).toBe(false);
    expect(validateGender(null)).toBe(false);
    expect(validateGender(undefined)).toBe(false);
  });

  it('should reject unlisted custom gender string values', () => {
    expect(validateGender('UNKNOWN')).toBe(false);
    expect(validateGender('M')).toBe(false);
    expect(validateGender('F')).toBe(false);
    expect(validateGender('inferred_from_name')).toBe(false);
  });
});
