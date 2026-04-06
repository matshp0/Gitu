export function createPrefixRegex(prefix: string, flags: string = ""): RegExp {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedPrefix}`, flags);
}
