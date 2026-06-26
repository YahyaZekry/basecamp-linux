import { describe, it, expect } from 'vitest';
import compareVersions from '../app/compareVersions.js';

describe('compareVersions', () => {
  it('returns -1 when first version is higher', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(-1);
    expect(compareVersions('1.1.0', '1.0.0')).toBe(-1);
    expect(compareVersions('1.0.1', '1.0.0')).toBe(-1);
    expect(compareVersions('2.0.0', '1.9.9')).toBe(-1);
  });

  it('returns 0 when versions are equal', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('0.0.0', '0.0.0')).toBe(0);
    expect(compareVersions('99.99.99', '99.99.99')).toBe(0);
  });

  it('returns 1 when second version is higher', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.1.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.0.1')).toBe(1);
    expect(compareVersions('1.9.9', '2.0.0')).toBe(1);
  });

  it('handles multi-digit version parts', () => {
    expect(compareVersions('10.0.0', '9.0.0')).toBe(-1);
    expect(compareVersions('10.11.0', '10.9.0')).toBe(-1);
    expect(compareVersions('0.0.10', '0.0.9')).toBe(-1);
  });

  it('handles missing parts (falsy)', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.1', '1.0')).toBe(-1);
    expect(compareVersions('1.0', '1.0.1')).toBe(1);
  });
});
