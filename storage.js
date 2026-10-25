export const CART_STORAGE_KEY = "nexora_cart_v1";
const LEGACY_KEY = "nexora_cart";
const isPlainObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

export function serializeState(value) {
  try { return JSON.stringify(value); }
  catch (error) { console.error("NEXORA: Could not serialize state.", error); return null; }
}

export function deserializeState(rawValue, fallback = []) {
  if (typeof rawValue !== "string" || rawValue.length === 0) return fallback;
  try {
    const parsed = JSON.parse(rawValue);
    return parsed;
  } catch (error) {
    console.warn("NEXORA: Stored cart was invalid JSON; using an empty cart.", error);
    return fallback;
  }
}

export function validateCartData(value, products) {
  if (!Array.isArray(value)) return [];
  const productMap = new Map(products.map(product => [product.id, product]));
  const validated = [];
  for (const item of value) {
    if (!isPlainObject(item) || typeof item.id !== "string") continue;
    const product = productMap.get(item.id);
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || product.stock < 1) continue;
    const quantity = Math.min(item.quantity, product.stock);
    if (quantity > 0) validated.push({ id: product.id, quantity });
  }
  return validated;
}

export function loadCart(products) {
  try {
    let raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw === null) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy !== null) raw = legacy;
    }
    const parsed = deserializeState(raw, []);
    const valid = validateCartData(parsed, products);
    if (raw !== null && !Array.isArray(parsed)) console.warn("NEXORA: Unexpected cart format; using an empty cart.");
    return valid;
  } catch (error) {
    console.warn("NEXORA: Browser storage is unavailable. Cart will work for this session.", error);
    return [];
  }
}

export function saveCart(cart) {
  const serialized = serializeState(cart);
  if (serialized === null) return false;
  try { localStorage.setItem(CART_STORAGE_KEY, serialized); return true; }
  catch (error) { console.warn("NEXORA: Could not save cart to browser storage.", error); return false; }
}
