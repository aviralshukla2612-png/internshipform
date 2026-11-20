describe('Document Magic Bytes & File Signature Validation Suite', () => {
  const validateFileSignature = (buffer: Buffer): { isValid: boolean; detectedMime: string } => {
    if (buffer.length < 8) return { isValid: false, detectedMime: 'unknown' };

    // PDF magic bytes: %PDF
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return { isValid: true, detectedMime: 'application/pdf' };
    }

    // JPEG magic bytes: 0xFF 0xD8 0xFF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { isValid: true, detectedMime: 'image/jpeg' };
    }

    // PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return { isValid: true, detectedMime: 'image/png' };
    }

    // WEBP magic bytes: RIFF....WEBP
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return { isValid: true, detectedMime: 'image/webp' };
    }

    return { isValid: false, detectedMime: 'unsupported' };
  };

  it('should recognize genuine PDF headers', () => {
    const pdfBuffer = Buffer.from('%PDF-1.7 actual pdf content here');
    const result = validateFileSignature(pdfBuffer);
    expect(result.isValid).toBe(true);
    expect(result.detectedMime).toBe('application/pdf');
  });

  it('should recognize genuine JPEG headers', () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const result = validateFileSignature(jpegBuffer);
    expect(result.isValid).toBe(true);
    expect(result.detectedMime).toBe('image/jpeg');
  });

  it('should recognize genuine PNG headers', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const result = validateFileSignature(pngBuffer);
    expect(result.isValid).toBe(true);
    expect(result.detectedMime).toBe('image/png');
  });

  it('should aggressively reject disguised executable files (.exe renamed to .pdf)', () => {
    // MZ header of Windows PE Executable: 0x4D 0x5A
    const fakePdfBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04]);
    const result = validateFileSignature(fakePdfBuffer);
    expect(result.isValid).toBe(false);
    expect(result.detectedMime).toBe('unsupported');
  });

  it('should reject disguised HTML/script files renamed to .png', () => {
    const fakePng = Buffer.from('<script>alert("xss")</script>');
    const result = validateFileSignature(fakePng);
    expect(result.isValid).toBe(false);
  });
});
