/**
 * As-you-type national phone formatting for the popup phone fields.
 *   US / CA (+1):  (555) 555-5555
 *   IN (+91):      98765 43210
 * Only the digits matter to the server; this is purely for display.
 */
export type PhoneCountry = "US" | "CA" | "IN";

/** Strips a pasted country code / leading 0 and keeps at most 10 national digits. */
export const nationalDigits = (value: string, country: PhoneCountry): string => {
  let d = value.replace(/\D/g, "");
  if ((country === "US" || country === "CA") && d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (country === "IN") {
    if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
    else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  }
  return d.slice(0, 10);
};

export const formatPhoneInput = (value: string, country: PhoneCountry): string => {
  const d = nationalDigits(value, country);
  if (!d) return "";
  if (country === "IN") return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

export const phonePlaceholder = (country: PhoneCountry) => (country === "IN" ? "98765 43210" : "(555) 555-5555");
