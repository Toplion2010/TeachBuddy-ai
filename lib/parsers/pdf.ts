import { PDFParse } from 'pdf-parse';

export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdf = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdf.getText();
  await pdf.destroy();
  return result.text.trim();
}
