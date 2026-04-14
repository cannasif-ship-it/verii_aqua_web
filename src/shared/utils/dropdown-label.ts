function toText(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

export function formatLabelWithKey(label: unknown, key: unknown): string {
  const labelText = toText(label);
  const keyText = toText(key);

  if (!labelText) return keyText;
  if (!keyText) return labelText;
  if (labelText === keyText || labelText.includes(`(${keyText})`)) return labelText;

  return `${labelText} (${keyText})`;
}

export function formatCodeAndKeyLabel(code: unknown, key: unknown, fallbackLabel?: unknown): string {
  const codeText = toText(code);
  const keyText = toText(key);
  const fallbackText = toText(fallbackLabel);

  if (codeText && fallbackText && keyText) return `${codeText} - ${fallbackText} (${keyText})`;
  if (codeText && fallbackText) return `${codeText} - ${fallbackText}`;
  if (codeText && keyText) return `${codeText} (${keyText})`;
  if (codeText) return codeText;

  return formatLabelWithKey(fallbackText, keyText);
}
