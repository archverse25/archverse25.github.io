// Зарын файлыг (PDF, PNG, JPG) зураг болгон шахаж бэлдэнэ.
// Firestore-ийн нэг баримт 1 МБ хүртэл тул хуудас бүрийг ~900 КБ-аас бага болгоно.

const MAX_CHARS = 900000;
const MAX_PAGES = 10;

function encode(source, w, h) {
  let maxW = 1600;
  let q = 0.86;
  for (let attempt = 0; attempt < 12; attempt++) {
    const scale = Math.min(1, maxW / w);
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(source, 0, 0, cw, ch);
    const data = canvas.toDataURL('image/jpeg', q);
    if (data.length <= MAX_CHARS) return { data, w: cw, h: ch };
    if (q > 0.62) q -= 0.08;
    else maxW = Math.round(maxW * 0.82);
  }
  throw new Error('Файл хэт том байна.');
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Зургийг уншиж чадсангүй.'));
    };
    img.src = url;
  });
}

async function pdfToPages(file, onProgress) {
  const pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const n = Math.min(pdf.numPages, MAX_PAGES);
  const pages = [];
  for (let i = 1; i <= n; i++) {
    onProgress && onProgress(i, n);
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(3, 1600 / base.width) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    pages.push(encode(canvas, canvas.width, canvas.height));
  }
  return pages;
}

export async function fileToPages(file, onProgress) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (isPdf) return pdfToPages(file, onProgress);
  if (/^image\//.test(file.type) || /\.(png|jpe?g)$/i.test(file.name)) {
    const img = await loadImage(file);
    return [encode(img, img.naturalWidth, img.naturalHeight)];
  }
  throw new Error('PDF эсвэл PNG файл сонгоно уу.');
}
