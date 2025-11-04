/**
 * Attachment Value Object
 * 
 * Architectural Intent:
 * - Represents a file attachment in a message
 * - Immutable value object following DDD principles
 * - Encapsulates attachment validation and metadata
 * - Provides methods for attachment manipulation while maintaining integrity
 * 
 * Key Design Decisions:
 * 1. Immutable to prevent attachment corruption
 * 2. Encapsulates file validation rules
 * 3. Supports various media types
 */
export interface AttachmentProps {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio';
  url: string;
  thumbnailUrl?: string;
  name: string;
  size: number; // in bytes
  mimeType: string;
  uploadDate: Date;
}

export class Attachment {
  public readonly id: string;
  public readonly type: 'image' | 'video' | 'document' | 'audio';
  public readonly url: string;
  public readonly thumbnailUrl?: string;
  public readonly name: string;
  public readonly size: number; // in bytes
  public readonly mimeType: string;
  public readonly uploadDate: Date;

  constructor(props: AttachmentProps) {
    this.id = props.id;
    this.type = this.validateType(props.type);
    this.url = this.validateUrl(props.url);
    this.thumbnailUrl = props.thumbnailUrl;
    this.name = this.validateName(props.name);
    this.size = this.validateSize(props.size);
    this.mimeType = props.mimeType;
    this.uploadDate = props.uploadDate;
  }

  private validateType(type: string): 'image' | 'video' | 'document' | 'audio' {
    const validTypes = ['image', 'video', 'document', 'audio'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid attachment type: ${type}`);
    }
    return type as 'image' | 'video' | 'document' | 'audio';
  }

  private validateUrl(url: string): string {
    try {
      new URL(url);
      return url;
    } catch {
      throw new Error(`Invalid attachment URL: ${url}`);
    }
  }

  private validateName(name: string): string {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('Attachment name cannot be empty');
    }
    if (name.length > 255) {
      throw new Error('Attachment name exceeds maximum length of 255 characters');
    }
    return name;
  }

  private validateSize(size: number): number {
    if (typeof size !== 'number' || size < 0) {
      throw new Error('Attachment size must be a non-negative number');
    }
    if (size > 100 * 1024 * 1024) { // 100MB limit
      throw new Error('Attachment size exceeds maximum of 100MB');
    }
    return size;
  }

  /**
   * Check if attachment is an image
   */
  public isImage(): boolean {
    return this.type === 'image';
  }

  /**
   * Check if attachment is a video
   */
  public isVideo(): boolean {
    return this.type === 'video';
  }

  /**
   * Check if attachment is a document
   */
  public isDocument(): boolean {
    return this.type === 'document';
  }

  /**
   * Check if attachment is an audio file
   */
  public isAudio(): boolean {
    return this.type === 'audio';
  }

  /**
   * Get formatted size in human readable format
   */
  public getFormattedSize(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}