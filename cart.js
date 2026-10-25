export const TAX_RATE = 0.05;
export const DISCOUNT_RATE = 0.10;
export const DISCOUNT_THRESHOLD = 2000;

export function calculateCart(cart, products) {
  const productMap = new Map(products.map(product => [product.id, product]));
  const lines = cart.map(item => {
    const product = productMap.get(item.id);
    if (!product) return null;
    const quantity = Math.max(0, Math.min(Number.isInteger(item.quantity) ? item.quantity : 0, product.stock));
    const unitPrice = Number.isFinite(product.price) && product.price >= 0 ? product.price : 0;
    return { product, quantity, unitPrice, lineSubtotal: roundMoney(unitPrice * quantity) };
  }).filter(line => line && line.quantity > 0);
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineSubtotal, 0));
  const discount = subtotal >= DISCOUNT_THRESHOLD ? roundMoney(subtotal * DISCOUNT_RATE) : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = roundMoney(taxableAmount * TAX_RATE);
  const total = roundMoney(taxableAmount + tax);
  const units = lines.reduce((sum, line) => sum + line.quantity, 0);
  return { lines, subtotal, discount, tax, total, units };
}

export function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}
