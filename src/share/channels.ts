export function buildHashUrl(base64Url: string, currentUrl?: string): string {
  if (currentUrl) {
    const url = new URL(currentUrl);
    url.hash = `lz=${base64Url}`;
    return url.toString();
  }
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.hash = `lz=${base64Url}`;
    return url.toString();
  }
  return `https://www.alucalculator.com/gears/#lz=${base64Url}`;
}

export function extractHashPayload(hashOrUrl: string): string | null {
  if (!hashOrUrl) return null;
  const hashIdx = hashOrUrl.indexOf('#lz=');
  if (hashIdx !== -1) {
    return hashOrUrl.substring(hashIdx + 4).split('&')[0];
  }
  if (hashOrUrl.startsWith('lz=')) {
    return hashOrUrl.substring(3).split('&')[0];
  }
  return null;
}

export function downloadJsonFile(filename: string, jsonString: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.alucalc.json') ? filename : `${filename}.alucalc.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function readPackageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else if (reader.result instanceof ArrayBuffer) {
        const decoded = new TextDecoder('utf-8').decode(reader.result);
        resolve(decoded);
      } else {
        reject(new Error('Dosya okunamadı.'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
