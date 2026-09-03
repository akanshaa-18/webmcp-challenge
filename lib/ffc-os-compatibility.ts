const FFC_BASE = 'https://prod-rel-ffc-ccm.oobesaas.adobe.com/adobe-ffc-external/core';
const FFC_HEADERS = { 'x-api-key': 'CCHomeWeb1', 'x-adobe-app-id': 'CCHomeWeb1' };

export const PRODUCT_TO_SAP: Record<string, string> = {
  'photoshop':     'PHSP',
  'illustrator':   'ILST',
  'premiere-pro':  'PPRO',
  'after-effects': 'AEFT',
  'indesign':      'IDSN',
  'lightroom':     'LRCC',
  'acrobat':       'APRO',
};

const PLATFORM_PARAMS: Record<string, string> = {
  macos:   'osx10,osx10-64,macarm64,macuniversal',
  windows: 'win32,win64,winarm64',
};

export async function fetchOsRanges(
  sapCode: string,
  platform: 'macos' | 'windows',
): Promise<string[]> {
  const url = `${FFC_BASE}/v1/filter/products/latest?channel=ccm,services,mobileApps&platform=${PLATFORM_PARAMS[platform]}`;
  const res = await fetch(url, { headers: FFC_HEADERS });
  if (!res.ok) throw new Error(`FFC error ${res.status}`);
  const data = await res.json();

  const channels: any[] = data?.response?.channels?.channel ?? [];
  const ccm = channels.find((ch: any) => ch.name === 'ccm');
  const products: any[] = ccm?.products?.product ?? [];
  const product = products.find((p: any) => p.id === sapCode);
  if (!product) return [];

  const ranges: string[] = [];
  for (const plat of product?.platforms?.platform ?? []) {
    const r: string[] = plat?.systemCompatibility?.operatingSystem?.range ?? [];
    ranges.push(...r);
  }
  return [...new Set(ranges)];
}

export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export function isCompatible(osVersion: string, ranges: string[]): boolean {
  if (ranges.length === 0) return false;
  for (const range of ranges) {
    const [lo, hi] = range.split('-').map((s) => s.trim());
    const lower = lo || '0';
    const aboveLower = compareVersions(osVersion, lower) >= 0;
    const belowUpper = !hi || compareVersions(osVersion, hi) <= 0;
    if (aboveLower && belowUpper) return true;
  }
  return false;
}
