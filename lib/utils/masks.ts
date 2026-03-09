export const maskPhone = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').substring(0, 11);
  let masked = digits;
  if (digits.length > 2) {
    masked = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  }
  if (digits.length > 3) {
    masked = `(${digits.substring(0, 2)}) ${digits.substring(2, 3)} ${digits.substring(3)}`;
  }
  if (digits.length > 7) {
    masked = `(${digits.substring(0, 2)}) ${digits.substring(2, 3)} ${digits.substring(3, 7)}.${digits.substring(7)}`;
  }
  return masked;
};

export const maskCPF = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').substring(0, 11);
  let masked = digits;
  if (digits.length > 3) {
    masked = `${digits.substring(0, 3)}.${digits.substring(3)}`;
  }
  if (digits.length > 6) {
    masked = `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6)}`;
  }
  if (digits.length > 9) {
    masked = `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}`;
  }
  return masked;
};
