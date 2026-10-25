# NEXORA — Persistent Product Catalog & Active E-Commerce Cart Console

A premium dark storefront built for the **GetIntern.in 8-Week Practical Web Development Internship — Week 4**. The project demonstrates JavaScript object state, JSON serialization, persistent browser storage, and reactive cart calculations.

## Features
- Responsive product catalog with eight sample products
- Search, category filters, and sorting by price or rating
- Add to cart, quantity controls, remove items, and clear-cart confirmation
- Persistent cart using `localStorage` and `JSON.stringify()` / `JSON.parse()`
- Input validation for saved cart state, stock limits, and malformed JSON
- Live subtotal, 10% demo discount for eligible carts above ₹2,000, 5% demo tax, and final total
- Cross-tab cart synchronization where browser storage events are available
- Accessible controls, keyboard focus states, reduced-motion support, and broken-image fallbacks
- Simulated checkout only; no actual payments or personal payment data

## Technology
Semantic HTML5, CSS3, Vanilla JavaScript ES modules, and the browser `localStorage` API. No frontend frameworks.

## Project structure
```text
nexora-ecommerce/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── products.js
│   ├── storage.js
│   ├── cart.js
│   └── app.js
└── README.md
```

## Run locally
1. Open this folder in VS Code.
2. Install or enable the **Live Server** extension.
3. Right-click `index.html` and select **Open with Live Server**.
4. Keep the internet connected for remote product photography and Google Fonts. Local product interactions work without a backend.

Because the app uses JavaScript ES modules, run it through a local server rather than opening `index.html` as a `file://` URL.

## How state persistence works
- The catalog is defined separately in `js/products.js`.
- Cart lines store only a product ID and quantity; prices are always read from the trusted catalog.
- `js/storage.js` safely parses the stored JSON, validates item IDs and quantities, and writes state under `nexora_cart_v1`.
- If storage is unavailable or data is malformed, the application falls back to an empty cart instead of crashing.
- Browser `storage` events update the cart when another tab changes the saved cart.

## Cart calculation rules
- Subtotal = sum of product price × quantity.
- Demo discount = 10% of subtotal when subtotal is at least ₹2,000.
- Demo tax = 5% of subtotal after the discount.
- Final total = discounted subtotal + demo tax.
- Amounts are rounded to two decimal places and formatted using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

These are demonstration rules for the internship project, not a statement of real tax or shipping policy.

## Testing checklist
- [ ] Add a product and check the cart badge.
- [ ] Increase/decrease quantity and verify totals.
- [ ] Reload the page and verify the cart is restored.
- [ ] Remove an item and clear the cart.
- [ ] Test the empty-cart state.
- [ ] Test malformed storage: in DevTools Console run `localStorage.setItem('nexora_cart_v1', '{bad json')`, then reload.
- [ ] Search products and test each category and sorting option.
- [ ] Test at mobile width.
- [ ] Test with a broken image URL and verify fallback.
- [ ] Verify the public GitHub repository and deployed URL.

## Deploy
### GitHub
1. Create a new repository named `nexora-ecommerce`.
2. Set visibility to **Public**.
3. Upload all files while preserving the folder structure.

### GitHub Pages
1. Open repository **Settings → Pages**.
2. Select deployment from the `main` branch and `/ (root)`.
3. Save and wait for the Pages URL to become available.

### Netlify
1. Sign in to Netlify and choose **Add new site → Deploy manually**.
2. Drag the project folder (or a ZIP containing the project files) into the deploy area.
3. Wait for the published URL and test it.

### Vercel
1. Import the public GitHub repository into Vercel.
2. Use the project root as the root directory; no build command is required for this static project.
3. Deploy and verify the resulting URL.

## Submission links
- GitHub repository: `ADD_YOUR_PUBLIC_GITHUB_URL_HERE`
- Live deployment: `ADD_YOUR_LIVE_DEPLOYMENT_URL_HERE`

Do not submit these placeholders. Replace them only after the links have been created and verified.
