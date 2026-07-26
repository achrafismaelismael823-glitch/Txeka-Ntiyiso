/**
 * Validações reutilizáveis para formulários do portal.
 */

export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const isValidInstitutionId = (id) => {
  // IDs de instituição: 2-10 caracteres alfanuméricos maiúsculos
  const re = /^[A-Z0-9]{2,10}$/;
  return re.test(String(id).toUpperCase());
};

export const isValidHash = (hash) => {
  // Hashes SHA-256 são 64 caracteres hexadecimais
  const re = /^[a-fA-F0-9]{64}$/;
  return re.test(String(hash));
};

export const isValidPassword = (password) => {
  // Mínimo 6 caracteres
  return String(password).length >= 6;
};

export const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

export const required = (value) => {
  return value !== undefined && value !== null && String(value).trim() !== '';
};

/**
 * Valida um objeto de formulário contra um schema.
 * Schema: { campo: (valor) => boolean | string }
 * Retorna objeto { valid: boolean, errors: { campo: string } }
 */
export const validateSchema = (data, schema) => {
  const errors = {};
  let valid = true;

  for (const [key, validator] of Object.entries(schema)) {
    const result = validator(data[key]);
    if (result !== true) {
      errors[key] = typeof result === 'string' ? result : 'Campo inválido';
      valid = false;
    }
  }

  return { valid, errors };
};
