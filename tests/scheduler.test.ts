import { describe, it, expect } from 'vitest';
import { alignToHeartbeat, getNextAvailableSlot } from '../src/scheduler/index.js';

describe('alignToHeartbeat', () => {
  it('aligns to :27 when minutes < 27', () => {
    const d = new Date('2026-03-24T10:10:00Z');
    const aligned = alignToHeartbeat(d);
    expect(aligned.getMinutes()).toBe(27);
  });

  it('aligns to :57 when minutes between 27-57', () => {
    const d = new Date('2026-03-24T10:30:00Z');
    const aligned = alignToHeartbeat(d);
    expect(aligned.getMinutes()).toBe(57);
  });

  it('returns a time after input', () => {
    const now = new Date();
    const aligned = alignToHeartbeat(now);
    expect(aligned.getTime()).toBeGreaterThan(now.getTime());
  });
});

describe('getNextAvailableSlot', () => {
  it('returns a date', () => {
    const slot = getNextAvailableSlot();
    expect(slot).toBeInstanceOf(Date);
  });

  it('returns a future or present time', () => {
    const slot = getNextAvailableSlot();
    expect(slot.getTime()).toBeGreaterThanOrEqual(Date.now() - 1000);
  });
});
