import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DocumentType } from '@recruitment/shared';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadDir = path.resolve(process.env.STORAGE_LOCAL_DIR || './uploads');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validate file signature (magic bytes) against expected formats
   */
  validateMagicBytes(buffer: Buffer, originalMime: string): { isValid: boolean; detectedMime: string } {
    if (buffer.length < 8) {
      return { isValid: false, detectedMime: 'unknown' };
    }

    // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
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
  }

  async uploadFile(
    file: Express.Multer.File,
    documentType: DocumentType,
    candidateId?: string,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file buffer provided for upload');
    }

    // 1. Validate File Size (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File exceeds maximum allowed limit of 5 MB');
    }

    // 2. Validate Magic Bytes / File Signature
    const { isValid, detectedMime } = this.validateMagicBytes(file.buffer, file.mimetype);
    if (!isValid) {
      throw new BadRequestException(
        `Invalid file content signature. File appears to be disguised or corrupt (detected: ${detectedMime}). Only PDF, JPEG, PNG, and WEBP are permitted.`,
      );
    }

    // 3. Generate Random Private Storage UUID Key
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const storageKey = `${uuidv4()}${ext}`;
    const storagePath = path.join(this.uploadDir, storageKey);

    // Save to local private directory
    await fs.promises.writeFile(storagePath, file.buffer);

    // Get hex signature snippet for audit record
    const signatureHex = file.buffer.slice(0, 8).toString('hex').toUpperCase();

    // 4. Save metadata in DB if candidateId exists, or return upload response for draft creation
    let docRecord = null;
    if (candidateId) {
      docRecord = await this.prisma.candidateDocument.create({
        data: {
          candidateId,
          documentType,
          originalFileName: file.originalname,
          storageKey,
          mimeType: detectedMime,
          fileSizeBytes: file.size,
          fileSignatureHex: signatureHex,
          isVerified: true,
          storageProvider: 'local',
        },
      });
    }

    return {
      docId: docRecord ? docRecord.id : storageKey,
      storageKey,
      originalFileName: file.originalname,
      mimeType: detectedMime,
      fileSizeBytes: file.size,
      signatureHex,
    };
  }

  async getFileStream(storageKey: string) {
    // Sanitize to prevent path traversal
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Requested document not found in storage');
    }

    return {
      stream: fs.createReadStream(filePath),
      filePath,
    };
  }
}
