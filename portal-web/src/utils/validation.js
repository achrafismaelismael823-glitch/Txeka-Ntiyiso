export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidInstitutionId = (id) => /^[A-Z0-9]{2,10}$/i.test(id);

export const isValidHash = (hash) => /^[a-f0-9]{64}$/i.test(hash);

export const required = (value, field = 'Campo') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${field} é obrigatório`;
  }
  return null;
};
