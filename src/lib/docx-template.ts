import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export interface DocxAnalysisResult {
  valid: boolean;
  error?: string;
  placeholders: string[];
}

/**
 * Memvalidasi berkas .docx dan mengekstrak semua placeholder unik berformat {{NAMA_PLACEHOLDER}}
 */
export function analyzeDocxTemplate(buffer: Buffer): DocxAnalysisResult {
  try {
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'Berkas template kosong.', placeholders: [] };
    }

    // 1. Validasi integritas ZIP & DOCX
    let zip: PizZip;
    try {
      zip = new PizZip(buffer);
    } catch (e: any) {
      return {
        valid: false,
        error: 'Berkas DOCX rusak (corrupt) atau bukan format Microsoft Word (.docx) yang valid.',
        placeholders: [],
      };
    }

    // 2. Periksa apakah arsip memiliki struktur dokumen Word standar
    const documentXml = zip.file('word/document.xml');
    if (!documentXml) {
      return {
        valid: false,
        error: 'Format berkas tidak sesuai. Berkas tidak memiliki struktur word/document.xml.',
        placeholders: [],
      };
    }

    // 3. Muat ke Docxtemplater dengan delimiter kustom {{ }}
    const doc = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true,
    });

    // 4. Ambil tags / placeholder menggunakan metode bawaan Docxtemplater getTags()
    const tagsObj: any = typeof (doc as any).getTags === 'function' ? (doc as any).getTags() : {};
    const tagSet = new Set<string>();

    if (tagsObj?.document?.tags) {
      Object.keys(tagsObj.document.tags).forEach((tag) => {
        if (tag && tag.trim()) tagSet.add(tag.trim());
      });
    }

    if (Array.isArray(tagsObj?.headers)) {
      tagsObj.headers.forEach((h: any) => {
        if (h?.tags) {
          Object.keys(h.tags).forEach((tag) => {
            if (tag && tag.trim()) tagSet.add(tag.trim());
          });
        }
      });
    }

    if (Array.isArray(tagsObj?.footers)) {
      tagsObj.footers.forEach((f: any) => {
        if (f?.tags) {
          Object.keys(f.tags).forEach((tag) => {
            if (tag && tag.trim()) tagSet.add(tag.trim());
          });
        }
      });
    }

    // 5. Fallback Regex Parsing pada XML konten untuk mengantisipasi placeholder yang terlewat
    try {
      const xmlContent = documentXml.asText();
      // Bersihkan XML tag internal di antara delimiter jika ada split runs sederhana
      const matches = xmlContent.match(/\{\{([A-Za-z0-9_-]+)\}\}/g);
      if (matches) {
        matches.forEach((m) => {
          const cleanTag = m.replace(/[\{\}]/g, '').trim();
          if (cleanTag) tagSet.add(cleanTag);
        });
      }
    } catch {
      // Abaikan jika fallback regex gagal, tagSet dari doc.getTags() tetap digunakan
    }

    const placeholders = Array.from(tagSet);

    if (placeholders.length === 0) {
      return {
        valid: false,
        error: 'Template tidak memiliki placeholder yang dapat diisi otomatis. Pastikan menggunakan format {{NAMA_PLACEHOLDER}}.',
        placeholders: [],
      };
    }

    return {
      valid: true,
      placeholders,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Gagal memproses berkas template DOCX.',
      placeholders: [],
    };
  }
}

/**
 * Mengisi nilai placeholder pada template DOCX dan mengembalikan Buffer hasil yang mempertahankan seluruh format/layout
 */
export function generateDocxDocument(
  templateBuffer: Buffer,
  data: Record<string, string>
): { success: boolean; buffer?: Buffer; error?: string } {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true,
    });

    // Sanitasi data: konversi semua nilai menjadi string bersih
    const cleanData: Record<string, string> = {};
    for (const [key, val] of Object.entries(data)) {
      cleanData[key.trim()] = val !== undefined && val !== null ? String(val) : '';
    }

    // Render template
    doc.render(cleanData);

    const outputBuffer = doc.toBuffer();
    return { success: true, buffer: outputBuffer };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gagal menghasilkan dokumen SK dari template.',
    };
  }
}
