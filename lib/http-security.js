// Inline scripts/styles are required by the current interface and printable reports.
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; media-src 'self' blob:; frame-src 'self' blob:; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export function requestByteLimit(value) {
  const limit = value === undefined ? 64 * 1024 * 1024 : Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1024 || limit > 256 * 1024 * 1024) {
    throw new Error('MAX_REQUEST_BYTES deve ser um inteiro entre 1024 e 268435456 bytes.');
  }
  return limit;
}

export async function readRequestBody(request, limit) {
  if (Number(request.headers['content-length']) > limit) {
    throw Object.assign(new Error('Requisição muito grande.'), { status: 413 });
  }
  const chunks = [];
  let size = 0;
  // Keep the socket alive long enough to send 413 when a streamed body exceeds the limit.
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Requisição muito grande.'), { status: 413 });
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks, size) : undefined;
}
