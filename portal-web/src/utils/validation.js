export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidSHA256 = (hash) => {
  return /^[a-fA-F0-9]{64}$/.test(hash);
};

export const isValidInstitutionId = (id) => {
  return /^[A-Za-z0-9_-]{2,100}$/.test(id);
};

export const validateEmitForm = (file, docType, institutionId) => {
  const errors = [];
  if (!file) errors.push('Selecione um arquivo PDF');
  else if (file.type !== 'application/pdf') errors.push('Apenas arquivos PDF são permitidos');
  if (!docType?.trim()) errors.push('Tipo de documento é obrigatório');
  if (!institutionId?.trim()) errors.push('ID da instituição é obrigatório');
  return errors;
};

export const validateLoginForm = (institutionId, password) => {
  const errors = [];
  if (!institutionId?.trim()) errors.push('ID da instituição é obrigatório');
  if (!password?.trim()) errors.push('Senha é obrigatória');
  return errors;
};

