describe('Interview Scheduling Conflict Detection Engine Suite', () => {
  interface Slot {
    start: Date;
    end: Date;
  }

  const hasConflict = (newSlot: Slot, existingSlots: Slot[]): boolean => {
    if (newSlot.start >= newSlot.end) {
      throw new Error('Interview end time must be later than start time');
    }
    return existingSlots.some(
      (existing) => existing.start < newSlot.end && existing.end > newSlot.start,
    );
  };

  const existingBookings: Slot[] = [
    {
      start: new Date('2026-11-25T10:00:00Z'),
      end: new Date('2026-11-25T11:00:00Z'),
    },
    {
      start: new Date('2026-11-25T14:00:00Z'),
      end: new Date('2026-11-25T15:00:00Z'),
    },
  ];

  it('should permit non-overlapping interview booking before existing slots', () => {
    const slot = {
      start: new Date('2026-11-25T08:30:00Z'),
      end: new Date('2026-11-25T09:30:00Z'),
    };
    expect(hasConflict(slot, existingBookings)).toBe(false);
  });

  it('should permit non-overlapping booking between existing slots', () => {
    const slot = {
      start: new Date('2026-11-25T11:30:00Z'),
      end: new Date('2026-11-25T12:30:00Z'),
    };
    expect(hasConflict(slot, existingBookings)).toBe(false);
  });

  it('should detect exact duplicate overlapping conflict', () => {
    const slot = {
      start: new Date('2026-11-25T10:00:00Z'),
      end: new Date('2026-11-25T11:00:00Z'),
    };
    expect(hasConflict(slot, existingBookings)).toBe(true);
  });

  it('should detect partial overlap at the beginning of an existing slot', () => {
    const slot = {
      start: new Date('2026-11-25T09:30:00Z'),
      end: new Date('2026-11-25T10:15:00Z'),
    };
    expect(hasConflict(slot, existingBookings)).toBe(true);
  });

  it('should detect partial overlap at the end of an existing slot', () => {
    const slot = {
      start: new Date('2026-11-25T10:45:00Z'),
      end: new Date('2026-11-25T11:45:00Z'),
    };
    expect(hasConflict(slot, existingBookings)).toBe(true);
  });

  it('should detect engulfing overlap', () => {
    const slot = {
      start: new Date('2026-11-25T09:00:00Z'),
      end: new Date('2026-11-25T12:00:00Z'),
    };
    expect(hasConflict(slot, existingBookings)).toBe(true);
  });

  it('should reject inverted slots where end time is earlier than start time', () => {
    const invalidSlot = {
      start: new Date('2026-11-25T11:00:00Z'),
      end: new Date('2026-11-25T10:00:00Z'),
    };
    expect(() => hasConflict(invalidSlot, existingBookings)).toThrow(
      'Interview end time must be later than start time',
    );
  });
});
