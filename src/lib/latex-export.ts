import katex from 'katex';

let cachedFontCSS: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Collects all @font-face and .katex CSS rules from loaded stylesheets,
 * embeds woff2 font files as base64 data URIs.
 * Cached after first call.
 */
async function getEmbeddedKatexCSS(): Promise<string> {
  if (cachedFontCSS) return cachedFontCSS;

  const fontFaceRules: string[] = [];
  const katexRules: string[] = [];

  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSFontFaceRule) {
          fontFaceRules.push(rule.cssText);
        } else if (rule.cssText.includes('.katex')) {
          katexRules.push(rule.cssText);
        }
      }
    } catch {
      // Cross-origin stylesheet, skip
    }
  }

  // Embed woff2 fonts as base64 data URIs
  const embeddedFontRules = await Promise.all(
    fontFaceRules.map(async (ruleText) => {
      const urlMatch = ruleText.match(/url\(["']?([^"')]+\.woff2)["']?\)/);
      if (!urlMatch) return ruleText;

      try {
        const response = await fetch(urlMatch[1]);
        const buffer = await response.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        return ruleText.replace(
          /src:\s*[^;]+/,
          `src: url(data:font/woff2;base64,${base64}) format('woff2')`
        );
      } catch {
        return ruleText;
      }
    })
  );

  cachedFontCSS = [...embeddedFontRules, ...katexRules].join('\n');
  return cachedFontCSS;
}

/** Check if a string contains LaTeX ($...$) */
export function hasLatex(text: string): boolean {
  return /\$[^$]+\$/.test(text);
}

/** Convert $...$ segments to KaTeX HTML, escape plain text */
function nameToHtml(name: string): string {
  return name
    .split(/(\$[^$]+\$)/)
    .map((part) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        return katex.renderToString(math, { throwOnError: false });
      }
      return part
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    })
    .join('');
}

/**
 * Render a measurement name (with optional LaTeX) to an HTMLImageElement.
 * Uses SVG foreignObject with embedded KaTeX fonts.
 */
export async function renderNameLabelImage(
  name: string,
  fontSize: number,
  color: string = '#71717a',
): Promise<{ img: HTMLImageElement; width: number; height: number }> {
  const html = nameToHtml(name);
  const embeddedCSS = await getEmbeddedKatexCSS();

  // Measure using a temp DOM element (fonts are loaded in the page)
  const temp = document.createElement('div');
  temp.style.cssText = `
    position:absolute;left:-9999px;top:-9999px;
    font-size:${fontSize}px;
    font-family:'Inter','Segoe UI',system-ui,sans-serif;
    font-weight:600;white-space:nowrap;
    padding:2px 6px;line-height:1.4;display:inline-block;
  `;
  temp.innerHTML = html;
  document.body.appendChild(temp);
  await document.fonts.ready;

  const rect = temp.getBoundingClientRect();
  const w = Math.ceil(rect.width) + 2;
  const h = Math.ceil(rect.height) + 2;
  document.body.removeChild(temp);

  // Build SVG with foreignObject at 2x for quality
  const scale = 2;
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}">
  <style>${embeddedCSS}
  .katex { color: inherit; }
  </style>
  <foreignObject width="${w}" height="${h}" transform="scale(${scale})">
    <div xmlns="http://www.w3.org/1999/xhtml" style="
      font-size:${fontSize}px;
      font-family:'Inter','Segoe UI',system-ui,sans-serif;
      font-weight:600;color:${color};
      white-space:nowrap;padding:2px 6px;line-height:1.4;
      background:rgba(9,9,11,0.9);
      border:1px solid ${color};border-radius:4px;
      display:inline-block;
    ">${html}</div>
  </foreignObject>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.src = url;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to render LaTeX label'));
  });
  URL.revokeObjectURL(url);

  return { img, width: w, height: h };
}
