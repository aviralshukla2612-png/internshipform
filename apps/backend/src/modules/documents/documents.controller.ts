import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/rbac.decorator';
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

  @Get('download/:storageKey')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('documents:download')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Authorized secure download of candidate document' })
  async download(
    @Param('storageKey') storageKey: string,
    @Res() res: Response,
  ) {
    const { stream, filePath } = await this.documentsService.getFileStream(storageKey);
    res.setHeader('Content-Disposition', `attachment; filename="${storageKey}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    stream.pipe(res);
  }
}
