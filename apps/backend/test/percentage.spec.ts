describe('Percentage Calculation Suite', () => {
  const calculatePercentage = (obtained?: number, total?: number): number | null => {
    if (obtained === undefined || total === undefined || total <= 0) return null;
    if (obtained > total || obtained < 0) {
      throw new Error('Obtained marks cannot exceed total marks or be negative');
    }
    return Number(((obtained / total) * 100).toFixed(2));
  };

  it('should calculate accurate percentage for standard marks', () => {
    expect(calculatePercentage(850, 1000)).toBe(85.0);
    expect(calculatePercentage(456, 500)).toBe(91.2);
    expect(calculatePercentage(333, 600)).toBe(55.5);
  });

  it('should round correctly to two decimal places', () => {
    expect(calculatePercentage(1, 3)).toBe(33.33);
    expect(calculatePercentage(2, 3)).toBe(66.67);
  });

  it('should throw error when obtained marks exceed total marks', () => {
    expect(() => calculatePercentage(1050, 1000)).toThrow(
      'Obtained marks cannot exceed total marks or be negative',
    );
  });

  it('should throw error for negative obtained marks', () => {
    expect(() => calculatePercentage(-10, 100)).toThrow(
      'Obtained marks cannot exceed total marks or be negative',
    );
  });

  it('should return null if total marks is zero or missing', () => {
    expect(calculatePercentage(50, 0)).toBeNull();
    expect(calculatePercentage(undefined, 100)).toBeNull();
  });
});
