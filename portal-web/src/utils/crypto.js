// Criptografia no browser — SHA-256, Base64 chunking, hash transiente
// Pilar da Retenção Zero: o PDF nunca sai do dispositivo como binário cru

// ─── SHA-256 de um File/Blob ─────────────────────────────────────────
export async function calculateSHA256(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── SHA-256 de uma string ───────────────────────────────────────────
export async function hashString(str) {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── File → Base64 (transiente, usado só no momento do envio) ───────
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove o prefixo data:application/pdf;base64,
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Chunking de array em blocos de N ────────────────────────────────
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ─── Validação de hash SHA-256 ───────────────────────────────────────
export function validateSHA256Hash(hash) {
  return typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash);
}

// ─── Geração de nonce para requests ──────────────────────────────────
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Sanitização de input (XSS prevention) ───────────────────────────
export function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

