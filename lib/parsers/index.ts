import { parsePdf } from './pdf';
import { parseDocx } from './docx';

export async function parseFile(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return parsePdf(buffer);
    case 'docx':
    case 'doc':
      return parseDocx(buffer);
    case 'txt':
      return buffer.toString('utf-8').trim();
    default:
      throw new Error(`Unsupported file type: .${extension}`);
  }
}

export function getFileType(fileName: string): 'pdf' | 'docx' | 'txt' {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    case 'txt':
      return 'txt';
    default:
      throw new Error(`Unsupported file type: .${extension}`);
  }
}
