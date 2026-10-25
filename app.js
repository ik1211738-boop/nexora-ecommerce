import { PRODUCTS } from "./products.js";
import { loadCart, saveCart, validateCartData } from "./storage.js";
import { calculateCart, formatINR, DISCOUNT_THRESHOLD } from "./cart.js";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = { products: PRODUCTS, cart: loadCart(PRODUCTS), category: "All Products", search: "", sort: "featured", drawerOpen: false };
const els = {
  grid: $("#productGrid"), noResults: $("#noResults"), resultsCount: $("#resultsCount"), search: $("#searchInput"),
  sort: $("#sortSelect"), badge: $("#cartBadge"), drawer: $("#cartDrawer"), overlay: $("#overlay"),
  cartItems: $("#cartItems"), cartEmpty: $("#cartEmpty"), cartSummary: $("#cartSummary"),
  subtotal: $("#subtotalValue"), discount: $("#discountValue"), tax: $("#taxValue"), total: $("#totalValue"),
  drawerCount: $("#drawerCount"), shippingProgress: $("#shippingProgress"), shippingMessage: $("#shippingMessage"),
  toastRegion: $("#toastRegion"), checkoutDialog: $("#checkoutDialog")
};
const money = formatINR;

function initializeApp() {
  bindEvents();
  renderProducts();
  renderCart();
  if (!saveCart(state.cart)) showToast("Browser storage is unavailable; changes may not persist.", "error");
}

function bindEvents() {
  els.search.addEventListener("input", event => { state.search = event.target.value.trim().toLowerCase(); renderProducts(); });
  els.sort.addEventListener("change", event => { state.sort = event.target.value; renderProducts(); });
  $("#categoryFilters").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    $$("#categoryFilters [data-category]").forEach(chip => chip.classList.toggle("active", chip === button));
    renderProducts();
  });
  $$("[data-nav-category]").forEach(link => link.addEventListener("click", () => {
    state.category = link.dataset.navCategory;
    $$("#categoryFilters [data-category]").forEach(chip => chip.classList.toggle("active", chip.dataset.category === state.category));
    renderProducts();
    $("#mainNav")?.classList.remove("mobile-open");
  }));
  els.grid.addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(button.dataset.add);
  });
  $("#openCartBtn").addEventListener("click", openCart);
  $("#closeCartBtn").addEventListener("click", closeCart);
  els.overlay.addEventListener("click", closeCart);
  $("#continueShoppingBtn").addEventListener("click", closeCart);
  $("#cartItems").addEventListener("click", handleCartAction);
  $("#clearCartBtn").addEventListener("click", clearCart);
  $("#checkoutBtn").addEventListener("click", openCheckout);
  $("#closeCheckoutBtn").addEventListener("click", () => els.checkoutDialog.close());
  $("#finishCheckoutBtn").addEventListener("click", () => els.checkoutDialog.close());
  $("#resetFiltersBtn").addEventListener("click", resetFilters);
  $("#menuBtn").addEventListener("click", () => {
    const nav = $(".desktop-nav");
    const open = nav.classList.toggle("mobile-open");
    $("#menuBtn").setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && state.drawerOpen) closeCart(); });
  window.addEventListener("storage", event => {
    if (event.key === "nexora_cart_v1") {
      state.cart = validateCartData(safeParse(event.newValue), state.products);
      renderCart();
      showToast("Cart synced from another tab.", "success");
    }
  });
}

function safeParse(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function renderProducts() {
  let list = [...state.products];
  if (state.category !== "All Products") list = list.filter(product => product.category === state.category);
  if (state.search) list = list.filter(product => `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(state.search));
  if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  if (state.sort === "rating") list.sort((a, b) => b.rating - a.rating);
  els.grid.innerHTML = list.map((product, index) => {
    const discount = product.originalPrice > product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
    return `<article class="product-card" style="animation-delay:${Math.min(index * 45, 250)}ms">
      <div class="product-image-wrap">
        <img class="product-image" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22480%22 viewBox=%220 0 400 480%22%3E%3Crect width=%22400%22 height=%22480%22 fill=%22%2323262c%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 fill=%22%23ff7138%22 font-size=%2240%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-family=%22Arial%22%3EN.%3C/text%3E%3C/svg%3E'">
        <span class="product-tag ${discount ? "sale" : ""}">${discount ? `${discount}% OFF` : escapeHTML(product.tag)}</span>
        <button class="quick-add" data-add="${escapeHTML(product.id)}" aria-label="Add ${escapeHTML(product.name)} to cart" ${product.stock < 1 ? "disabled" : ""}>${product.stock < 1 ? "×" : "+"}</button>
      </div>
      <div class="product-info"><div class="product-meta"><span>${escapeHTML(product.category.toUpperCase())}</span><span class="rating">★ ${product.rating.toFixed(1)}</span></div>
        <h3 class="product-name">${escapeHTML(product.name)}</h3><p class="product-description">${escapeHTML(product.description)}</p>
        <div class="product-price-row"><span class="product-price">${money(product.price)}</span>${product.originalPrice > product.price ? `<span class="original-price">${money(product.originalPrice)}</span><span class="savings">SAVE ${discount}%</span>` : ""}</div>
      </div>
    </article>`;
  }).join("");
  els.noResults.hidden = list.length !== 0;
  els.grid.hidden = list.length === 0;
  els.resultsCount.textContent = `Showing ${list.length} ${list.length === 1 ? "essential" : "considered essentials"}`;
  $("#allCount").textContent = String(state.products.length).padStart(2, "0");
}

function addToCart(productId) {
  const product = state.products.find(item => item.id === productId);
  if (!product || product.stock < 1) return showToast("This item is currently out of stock.", "error");
  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    if (existing.quantity >= product.stock) return showToast(`Only ${product.stock} available.`, "error");
    existing.quantity += 1;
  } else state.cart.push({ id: productId, quantity: 1 });
  persistAndRender();
  showToast(`${product.name} added to your bag.`, "success");
}

function handleCartAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = state.cart.find(line => line.id === button.dataset.id);
  const product = state.products.find(line => line.id === button.dataset.id);
  if (!item || !product) return;
  switch (button.dataset.action) {
    case "increase":
      if (item.quantity >= product.stock) return showToast(`Only ${product.stock} available.`, "error");
      item.quantity += 1; break;
    case "decrease":
      item.quantity -= 1;
      if (item.quantity < 1) state.cart = state.cart.filter(line => line.id !== item.id);
      break;
    case "remove":
      state.cart = state.cart.filter(line => line.id !== item.id);
      showToast("Item removed from your bag.");
      break;
  }
  persistAndRender();
}

function clearCart() {
  if (!state.cart.length) return showToast("Your bag is already empty.");
  if (!window.confirm("Clear all items from your shopping bag?")) return;
  state.cart = [];
  persistAndRender();
  showToast("Your bag has been cleared.");
}

function renderCart() {
  state.cart = validateCartData(state.cart, state.products);
  const summary = calculateCart(state.cart, state.products);
  els.badge.textContent = summary.units > 99 ? "99+" : String(summary.units);
  els.drawerCount.textContent = `(${summary.units})`;
  els.cartItems.innerHTML = summary.lines.map(({ product, quantity, lineSubtotal }) => `
    <article class="cart-item">
      <img src="${escapeHTML(product.image)}" alt="" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%2323262c%22/%3E%3C/svg%3E'">
      <div><h3>${escapeHTML(product.name)}</h3><p class="item-category">${escapeHTML(product.category)} · ${money(product.price)}</p><strong class="item-price">${money(lineSubtotal)}</strong>
        <div class="quantity-control"><button data-action="decrease" data-id="${escapeHTML(product.id)}" aria-label="Decrease ${escapeHTML(product.name)} quantity">−</button><span>${quantity}</span><button data-action="increase" data-id="${escapeHTML(product.id)}" aria-label="Increase ${escapeHTML(product.name)} quantity" ${quantity >= product.stock ? "disabled" : ""}>+</button></div>
      </div><button class="remove-item" data-action="remove" data-id="${escapeHTML(product.id)}" aria-label="Remove ${escapeHTML(product.name)}">×</button>
    </article>`).join("");
  const empty = summary.units === 0;
  els.cartEmpty.hidden = !empty;
  els.cartItems.hidden = empty;
  els.cartSummary.hidden = empty;
  els.subtotal.textContent = money(summary.subtotal);
  els.discount.textContent = `−${money(summary.discount)}`;
  els.tax.textContent = money(summary.tax);
  els.total.textContent = money(summary.total);
  const progress = Math.min(100, summary.subtotal / 1499 * 100);
  els.shippingProgress.style.width = `${progress}%`;
  els.shippingMessage.textContent = summary.subtotal >= 1499 ? "You’ve unlocked complimentary delivery." : `Add ${money(1499 - summary.subtotal)} more for complimentary delivery.`;
}

function persistAndRender() {
  const saved = saveCart(state.cart);
  renderCart();
  if (!saved) showToast("Storage unavailable: your cart may not survive a reload.", "error");
}

function openCart() {
  state.drawerOpen = true;
  els.overlay.hidden = false;
  requestAnimationFrame(() => els.overlay.classList.add("visible"));
  els.drawer.classList.add("open");
  els.drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
  $("#closeCartBtn").focus();
}
function closeCart() {
  state.drawerOpen = false;
  els.overlay.classList.remove("visible");
  els.drawer.classList.remove("open");
  els.drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
  window.setTimeout(() => { if (!state.drawerOpen) els.overlay.hidden = true; }, 260);
  $("#openCartBtn").focus();
}
function openCheckout() {
  if (!state.cart.length) return showToast("Add something to your bag first.");
  const summary = calculateCart(state.cart, state.products);
  $("#checkoutMessage").textContent = `Your demo order includes ${summary.units} item${summary.units === 1 ? "" : "s"}, with an estimated total of ${money(summary.total)}.`;
  els.checkoutDialog.showModal();
}
function resetFilters() {
  state.category = "All Products"; state.search = ""; state.sort = "featured";
  els.search.value = ""; els.sort.value = "featured";
  $$("#categoryFilters [data-category]").forEach(chip => chip.classList.toggle("active", chip.dataset.category === state.category));
  renderProducts();
}
function showToast(message, type = "") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`; toast.textContent = message;
  els.toastRegion.appendChild(toast);
  window.setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateY(8px)"; window.setTimeout(() => toast.remove(), 250); }, 2800);
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

initializeApp();
