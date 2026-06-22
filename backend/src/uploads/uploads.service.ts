import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

const MB = 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * MB;
const MAX_VIDEO_BYTES = 30 * MB;
const MAX_REQUEST_BYTES = MAX_VIDEO_BYTES + MB;

const IMAGE_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const VIDEO_MIME_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

type UploadedPart = {
  filename: string;
  mimeType: string;
  content: Buffer;
};

@Injectable()
export class UploadsService {
  async handleMultipartUpload(request: any) {
    const contentType = String(
      request.headers['content-type'] || '',
    );
    const boundary = this.extractBoundary(contentType);
    const body = await this.readRequestBody(request);
    const filePart = this.extractFilePart(
      body,
      boundary,
    );

    return this.saveUploadedFile(filePart);
  }

  private extractBoundary(contentType: string) {
    const match = contentType.match(
      /boundary=(?:"([^"]+)"|([^;]+))/i,
    );

    const boundary = match?.[1] || match?.[2];

    if (!boundary) {
      throw new BadRequestException(
        'Multipart boundary is missing',
      );
    }

    return boundary;
  }

  private async readRequestBody(request: any) {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (const chunk of request) {
      const buffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);

      totalBytes += buffer.length;

      if (totalBytes > MAX_REQUEST_BYTES) {
        throw new PayloadTooLargeException(
          'Upload exceeds maximum file size',
        );
      }

      chunks.push(buffer);
    }

    if (chunks.length === 0) {
      throw new BadRequestException(
        'Upload file is required',
      );
    }

    return Buffer.concat(chunks);
  }

  private extractFilePart(
    body: Buffer,
    boundary: string,
  ): UploadedPart {
    const boundaryBuffer = Buffer.from(
      `--${boundary}`,
    );
    let cursor = 0;

    while (cursor < body.length) {
      const boundaryStart = body.indexOf(
        boundaryBuffer,
        cursor,
      );

      if (boundaryStart === -1) {
        break;
      }

      let partStart =
        boundaryStart + boundaryBuffer.length;

      if (
        body[partStart] === 45 &&
        body[partStart + 1] === 45
      ) {
        break;
      }

      if (
        body[partStart] === 13 &&
        body[partStart + 1] === 10
      ) {
        partStart += 2;
      }

      const nextBoundary = body.indexOf(
        boundaryBuffer,
        partStart,
      );

      if (nextBoundary === -1) {
        break;
      }

      let part = body.subarray(
        partStart,
        nextBoundary,
      );

      if (
        part.length >= 2 &&
        part[part.length - 2] === 13 &&
        part[part.length - 1] === 10
      ) {
        part = part.subarray(0, part.length - 2);
      }

      const parsed = this.parsePart(part);

      if (parsed) {
        return parsed;
      }

      cursor = nextBoundary;
    }

    throw new BadRequestException(
      'Upload file field is required',
    );
  }

  private parsePart(part: Buffer) {
    const separator = Buffer.from('\r\n\r\n');
    const headerEnd = part.indexOf(separator);

    if (headerEnd === -1) {
      return null;
    }

    const headerText = part
      .subarray(0, headerEnd)
      .toString('utf8');
    const content = part.subarray(
      headerEnd + separator.length,
    );

    const disposition = headerText.match(
      /content-disposition:\s*form-data;([^\r\n]+)/i,
    )?.[1];

    if (!disposition) {
      return null;
    }

    const fieldName = disposition.match(
      /name="([^"]+)"/i,
    )?.[1];
    const filename = disposition.match(
      /filename="([^"]*)"/i,
    )?.[1];

    if (fieldName !== 'file' || !filename) {
      return null;
    }

    const mimeType =
      headerText.match(
        /content-type:\s*([^\r\n]+)/i,
      )?.[1] || 'application/octet-stream';

    if (content.length === 0) {
      throw new BadRequestException(
        'Uploaded file is empty',
      );
    }

    return {
      filename,
      mimeType: mimeType.trim().toLowerCase(),
      content,
    };
  }

  private saveUploadedFile(file: UploadedPart) {
    const isImage =
      IMAGE_MIME_TYPES[file.mimeType] !== undefined;
    const isVideo =
      VIDEO_MIME_TYPES[file.mimeType] !== undefined;

    if (!isImage && !isVideo) {
      throw new BadRequestException(
        'Only JPG, PNG, WEBP, MP4, WEBM, or MOV files are allowed',
      );
    }

    const maxBytes = isImage
      ? MAX_IMAGE_BYTES
      : MAX_VIDEO_BYTES;

    if (file.content.length > maxBytes) {
      throw new PayloadTooLargeException(
        isImage
          ? 'Image upload limit is 5MB'
          : 'Video upload limit is 30MB',
      );
    }

    const now = new Date();
    const monthKey = now.toISOString().slice(0, 7);
    const typeFolder = isImage ? 'images' : 'videos';
    const uploadRoot = join(process.cwd(), 'uploads');
    const destination = join(
      uploadRoot,
      typeFolder,
      monthKey,
    );

    if (!existsSync(destination)) {
      mkdirSync(destination, { recursive: true });
    }

    const extension = this.extensionFor(file);
    const storedFilename = `${Date.now()}-${randomUUID()}${extension}`;
    const absolutePath = join(
      destination,
      storedFilename,
    );

    writeFileSync(absolutePath, file.content);

    const relativePath =
      `${typeFolder}/${monthKey}/${storedFilename}`;

    return {
      url: `/api/uploads/${relativePath}`,
      directUrl: `/uploads/${relativePath}`,
      filename: storedFilename,
      originalFilename: file.filename,
      mimeType: file.mimeType,
      mediaType: isImage ? 'IMAGE' : 'VIDEO',
      size: file.content.length,
      maxSize: maxBytes,
    };
  }

  private extensionFor(file: UploadedPart) {
    const fromMime =
      IMAGE_MIME_TYPES[file.mimeType] ||
      VIDEO_MIME_TYPES[file.mimeType];
    const originalExtension = extname(
      file.filename,
    )
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '');

    if (
      originalExtension &&
      ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'].includes(
        originalExtension,
      )
    ) {
      return originalExtension === '.jpeg'
        ? '.jpg'
        : originalExtension;
    }

    return `.${fromMime}`;
  }
}
