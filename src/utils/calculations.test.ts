import { describe, it, expect } from 'vitest';
import { calculateEarnings, calculateEarningsMultiple, RATE_DAY, RATE_NIGHT } from './calculations';

describe('calculateEarnings', () => {
  const testDate = '2023-10-27';

  it('calculates pure day shift correctly', () => {
    // 14:00 to 18:00 (4 hours)
    const result = calculateEarnings(testDate, '14:00', '18:00');
    expect(result.dayHours).toBeCloseTo(4);
    expect(result.nightHours).toBe(0);
    expect(result.total).toBe(4 * RATE_DAY);
    expect(result.rateType).toBe('day');
  });

  it('calculates pure night shift correctly (late night)', () => {
    // 02:00 to 05:00 (3 hours)
    const result = calculateEarnings(testDate, '02:00', '05:00');
    expect(result.dayHours).toBe(0);
    expect(result.nightHours).toBeCloseTo(3);
    expect(result.total).toBe(3 * RATE_NIGHT);
    expect(result.rateType).toBe('night');
  });

  it('calculates pure night shift correctly (early night)', () => {
    // 23:00 to 01:00 (2 hours, crosses midnight)
    const result = calculateEarnings(testDate, '23:00', '01:00');
    expect(result.dayHours).toBe(0);
    expect(result.nightHours).toBeCloseTo(2);
    expect(result.total).toBe(2 * RATE_NIGHT);
    expect(result.rateType).toBe('night');
  });

  it('calculates mixed shift correctly (evening to night)', () => {
    // 20:00 to 23:00
    // 20-22 (2h day)
    // 22-23 (1h night)
    const result = calculateEarnings(testDate, '20:00', '23:00');
    expect(result.dayHours).toBeCloseTo(2);
    expect(result.nightHours).toBeCloseTo(1);
    expect(result.total).toBe((2 * RATE_DAY) + (1 * RATE_NIGHT));
    expect(result.rateType).toBe('mixed');
  });

  it('calculates mixed shift correctly (morning night to day)', () => {
    // 06:00 to 09:00
    // 06-07 (1h night)
    // 07-09 (2h day)
    const result = calculateEarnings(testDate, '06:00', '09:00');
    expect(result.dayHours).toBeCloseTo(2);
    expect(result.nightHours).toBeCloseTo(1);
    expect(result.total).toBe((2 * RATE_DAY) + (1 * RATE_NIGHT));
    expect(result.rateType).toBe('mixed');
  });

  it('throws error on invalid input', () => {
    expect(() => calculateEarnings('', '10:00', '12:00')).toThrow();
    expect(() => calculateEarnings(testDate, '', '12:00')).toThrow();
  });
});

describe('calculateEarningsMultiple', () => {
  const testDate = '2023-10-27';

  it('sums up multiple slots correctly', () => {
    const slots = [
      { startTime: '10:00', endTime: '12:00' }, // 2h day
      { startTime: '14:00', endTime: '16:00' }  // 2h day
    ];
    const result = calculateEarningsMultiple(testDate, slots);
    expect(result.dayHours).toBeCloseTo(4);
    expect(result.nightHours).toBe(0);
    expect(result.total).toBe(4 * RATE_DAY);
  });

  it('handles mixed slots correctly', () => {
    const slots = [
      { startTime: '10:00', endTime: '12:00' }, // 2h day
      { startTime: '23:00', endTime: '00:00' }  // 1h night
    ];
    const result = calculateEarningsMultiple(testDate, slots);
    expect(result.dayHours).toBeCloseTo(2);
    expect(result.nightHours).toBeCloseTo(1);
    expect(result.total).toBe((2 * RATE_DAY) + (1 * RATE_NIGHT));
    expect(result.rateType).toBe('mixed');
  });
});

