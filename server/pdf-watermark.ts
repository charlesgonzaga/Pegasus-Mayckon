/**
 * Módulo de marca d'água para relatórios PDF (pdfkit)
 * Adiciona a logo Pegasus NFe como marca d'água centralizada em cada página
 */

const WATERMARK_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/120657398/zeSfPAVustBlhKcZ.png";

let cachedWatermark: Buffer | null = null;

/**
 * Baixa e cacheia a imagem da marca d'água
 */
async function getWatermarkBuffer(): Promise<Buffer | null> {
  if (cachedWatermark) return cachedWatermark;
  try {
    const resp = await globalThis.fetch(WATERMARK_URL);
    if (!resp.ok) return null;
    cachedWatermark = Buffer.from(await resp.arrayBuffer());
    return cachedWatermark;
  } catch (e) {
    console.error("Erro ao baixar marca d'água:", e);
    return null;
  }
}

/**
 * Adiciona marca d'água em todas as páginas de um documento pdfkit
 * Deve ser chamada DEPOIS de todo o conteúdo ter sido adicionado (antes de doc.end())
 * Requer bufferPages: true no PDFDocument
 * 
 * @param doc - Instância do PDFDocument com bufferPages: true
 */
export async function addWatermarkToAllPages(doc: any): Promise<void> {
  const watermark = await getWatermarkBuffer();
  if (!watermark) return;

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const imgAspect = 1920 / 1080;
    const targetWidth = pageWidth * 0.55;
    const targetHeight = targetWidth / imgAspect;
    const x = (pageWidth - targetWidth) / 2;
    const y = (pageHeight - targetHeight) / 2;

    doc.save();
    doc.opacity(0.05);
    doc.image(watermark, x, y, {
      width: targetWidth,
      height: targetHeight,
    });
    doc.opacity(1);
    doc.restore();
  }
}

export { getWatermarkBuffer };
