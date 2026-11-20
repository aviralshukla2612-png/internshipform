import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import * as path from 'path';
import { DocumentsService } from './documents.service';
import { DocumentType } from '@recruitment/shared';

@ApiTags('Document Storage & Verification')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file with magic bytes header inspection' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: DocumentType,
    @Body('candidateId') candidateId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const type = documentType || DocumentType.OTHER_CERTIFICATE;
    return this.documentsService.uploadFile(file, type, candidateId);
  }

  @Get('view/:storageKey')
  @ApiOperation({ summary: 'View candidate document or photo inline' })
  async view(
    @Param('storageKey') storageKey: string,
    @Res() res: Response,
  ) {
    const { stream, filePath } = await this.documentsService.getFileStream(storageKey);
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    stream.pipe(res);
  }

  @Get('download/:storageKey')
  @ApiOperation({ summary: 'Download candidate document' })
  async download(
    @Param('storageKey') storageKey: string,
    @Res() res: Response,
  ) {
    const { stream, filePath } = await this.documentsService.getFileStream(storageKey);
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';

    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(storageKey)}"`);
    res.setHeader('Content-Type', contentType);
    stream.pipe(res);
  }
}
