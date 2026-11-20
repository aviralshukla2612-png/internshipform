import * as crypto from 'crypto';

describe('Meta WhatsApp Webhook HMAC-SHA256 Signature Verification Suite', () => {
  const verifyMetaSignature = (
    rawBody: string,
    signatureHeader: string,
    appSecret: string,
  ): boolean => {
    if (!signatureHeader || !appSecret) return false;
    const [algo, signature] = signatureHeader.split('=');
    if (algo !== 'sha256' || !signature) return false;

    const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  };

  const appSecret = 'super_secret_meta_app_key_12345';
  const payload = JSON.stringify({
    entry: [{ changes: [{ field: 'messages', value: { statuses: [{ id: 'wamid.123', status: 'delivered' }] } }] }],
  });

  it('should successfully verify a valid HMAC-SHA256 signature from Meta', () => {
    const validSignature = crypto.createHmac('sha256', appSecret).update(payload).digest('hex');
    const header = `sha256=${validSignature}`;

    expect(verifyMetaSignature(payload, header, appSecret)).toBe(true);
  });

  it('should reject tampered payload or forged signature', () => {
    const forgedHeader = 'sha256=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(verifyMetaSignature(payload, forgedHeader, appSecret)).toBe(false);

    // Tampered payload with original signature
    const validSignature = crypto.createHmac('sha256', appSecret).update(payload).digest('hex');
    const header = `sha256=${validSignature}`;
    const tamperedPayload = payload + ' ';
    expect(verifyMetaSignature(tamperedPayload, header, appSecret)).toBe(false);
  });

  it('should reject missing or malformed header algorithms', () => {
    expect(verifyMetaSignature(payload, '', appSecret)).toBe(false);
    expect(verifyMetaSignature(payload, 'sha1=somehash', appSecret)).toBe(false);
  });
});
