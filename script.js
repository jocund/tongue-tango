// script.js — product gallery left + details right, 10-image carousel, cart + Stripe link support
// Ensure config.js (with const PAYMENT_LINK = "...") loads before this file.

const STRIPE_PAYMENT_LINK = (typeof PAYMENT_LINK !== 'undefined' && PAYMENT_LINK) ? PAYMENT_LINK : '';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const format = n => Number(n || 0).toFixed(2);

/* ---------- PRODUCT DATA: update filenames if needed ---------- */
const products = [
  {
    id: "tongue-tango",
    title: "Tongue Tango Hot Sauce Pepper Challenge Kit",
    description: "8 Levels of heat with Carolina Reaper, Ghost, Habanero, Cayenne, Datil, Scotch Bonnet & Scorpion Peppers — Ultimate game night, party game and unique gift.",
    price: 44.99,
    images: [
      "assets/tongue-tango-1.png",
      "assets/tongue-tango-2.jpg",
      "assets/tongue-tango-3.jpg",
      "assets/tongue-tango-4.jpg",
      "assets/tongue-tango-5.png",
      "assets/tongue-tango-6.png",
      "assets/tongue-tango-7.png",
      "assets/tongue-tango-8.png",
      "assets/tongue-tango-9.png",
      "assets/tongue-tango-10.png",
      "assets/tongue-tango-11.png"
    ]
  }
];

/* ---------- UI state ---------- */
let galleryIndex = 0;
const product = products[0]; // single-product layout

/* ---------- Render initial product into DOM ---------- */
function renderProductSection() {
  if (!product) return;
  // Title / desc / price
  $('#product-title').textContent = product.title;
  $('#product-desc').textContent = product.description;
  $('#product-price').textContent = `$${format(product.price)}`;
  // initial main image
  galleryIndex = 0;
  const main = $('#gallery-main');
  if (main) {
    main.src = product.images[galleryIndex] || '';
    main.alt = product.title;
  }
  // thumbs
  const thumbs = $('#gallery-thumbs');
  if (thumbs) {
    thumbs.innerHTML = '';
    product.images.forEach((src, idx) => {
      const t = document.createElement('img');
      t.src = src;
      t.alt = `${product.title} ${idx+1}`;
      t.dataset.idx = idx;
      if (idx === galleryIndex) t.classList.add('active');
      t.addEventListener('click', () => {
        galleryIndex = idx;
        updateGallery();
      });
      thumbs.appendChild(t);
    });
  }
}

/* ---------- Gallery controls ---------- */
function updateGallery() {
  const main = $('#gallery-main');
  if (!main) return;
  main.src = product.images[galleryIndex] || '';
  // update active thumb
  $$('#gallery-thumbs img').forEach(img => img.classList.toggle('active', Number(img.dataset.idx) === galleryIndex));
}

// prev / next handlers
$('#gallery-prev')?.addEventListener('click', () => {
  galleryIndex = (galleryIndex - 1 + product.images.length) % product.images.length;
  updateGallery();
});
$('#gallery-next')?.addEventListener('click', () => {
  galleryIndex = (galleryIndex + 1) % product.images.length;
  updateGallery();
});

// keyboard navigation when modal or page focused
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    galleryIndex = (galleryIndex - 1 + product.images.length) % product.images.length;
    updateGallery();
  } else if (e.key === 'ArrowRight') {
    galleryIndex = (galleryIndex + 1) % product.images.length;
    updateGallery();
  }
});

// ---- MODAL SUPPORT ----
const modal = $('#product-modal');
const modalImg = $('#modal-image');
const modalClose = $('#modal-close');
const modalPrev = $('#modal-prev');
const modalNext = $('#modal-next');

function openModalWithIndex(index){
  galleryIndex = index;
  modalImg.src = product.images[galleryIndex];
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
}

function closeModal(){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
}

// click main gallery image → open modal
$('#gallery-main')?.addEventListener('click', () => {
  openModalWithIndex(galleryIndex);
});

// close modal by clicking X
modalClose?.addEventListener('click', closeModal);

// close by clicking outside content
modal.addEventListener('click', (e)=>{
  if(e.target === modal){
    closeModal();
  }
});

// modal prev/next
modalPrev?.addEventListener('click', () => {
  galleryIndex = (galleryIndex - 1 + product.images.length) % product.images.length;
  modalImg.src = product.images[galleryIndex];
});
modalNext?.addEventListener('click', () => {
  galleryIndex = (galleryIndex + 1) % product.images.length;
  modalImg.src = product.images[galleryIndex];
});

// ESC closes modal
document.addEventListener('keydown',(e)=>{
  if(e.key === 'Escape') closeModal();
  if(!modal.classList.contains('hidden')){
    if(e.key === 'ArrowLeft'){
      galleryIndex = (galleryIndex - 1 + product.images.length) % product.images.length;
      modalImg.src = product.images[galleryIndex];
    }
    if(e.key === 'ArrowRight'){
      galleryIndex = (galleryIndex + 1) % product.images.length;
      modalImg.src = product.images[galleryIndex];
    }
  }
});


// open larger modal on main image click
$('#gallery-main')?.addEventListener('click', () => {
  $('#modal-image').src = product.images[galleryIndex] || '';
  $('#product-modal')?.classList.remove('hidden');
  $('#product-modal')?.setAttribute('aria-hidden', 'false');
});
$('#modal-close')?.addEventListener('click', () => {
  $('#product-modal')?.classList.add('hidden');
  $('#product-modal')?.setAttribute('aria-hidden', 'true');
});

/* ---------- Cart (localStorage) ---------- */
const CART_KEY = 'mirror_cart_v3';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}');

function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartUI(); }
function addToCart(qty = 1){ cart[product.id] = (cart[product.id] || 0) + Number(qty); saveCart(); flashCartCount(); }
function setCartQty(id, qty){ if (qty <= 0) delete cart[id]; else cart[id] = Number(qty); saveCart(); }
function cartItems(){ return Object.entries(cart).map(([id, qty]) => ({ product: products.find(p=>p.id===id), qty })); }
function cartTotal(){ return cartItems().reduce((s,it) => s + (it.product.price * it.qty), 0); }

function updateCartUI(){
  const count = Object.values(cart).reduce((a,b)=>a+(Number(b)||0),0) || 0;
  const countEl = $('#cart-count'); if (countEl) countEl.textContent = count;
  const totalEl = $('#cart-total'); if (totalEl) totalEl.textContent = format(cartTotal());
  const panel = $('#cart-items');
  if (!panel) return;
  const items = cartItems();
  panel.innerHTML = '';
  if (!items.length) { panel.innerHTML = '<p class="muted">Your cart is empty</p>'; return; }
  items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `<img src="${it.product.images[0]}" alt="${it.product.title}"><div style="flex:1"><div><strong>${it.product.title}</strong></div><div class="muted">$${format(it.product.price)} × <input class="item-qty" data-id="${it.product.id}" type="number" min="0" value="${it.qty}" style="width:56px"></div></div><div style="text-align:right">$${format(it.product.price * it.qty)}</div>`;
    panel.appendChild(div);
  });
  $$('.item-qty').forEach(inp => inp.addEventListener('change', e => setCartQty(e.target.dataset.id, Number(e.target.value||0))));
}

function flashCartCount(){
  const el = $('#cart-count'); if (!el) return;
  el.style.transform = 'scale(1.14)'; el.style.transition = 'transform 120ms ease';
  setTimeout(()=> el.style.transform = '', 140);
}

/* ---------- Buttons & events ---------- */
$('#add-to-cart')?.addEventListener('click', () => {
  const q = Number($('#qty')?.value || 1);
  addToCart(q);
});

$('#open-cart')?.addEventListener('click', () => {
  $('#cart-panel')?.classList.toggle('hidden');
  updateCartUI();
});

$('#cart-toggle')?.addEventListener('click', () => {
  $('#cart-panel')?.classList.toggle('hidden');
  updateCartUI();
});

$('#cart-close')?.addEventListener('click', () => $('#cart-panel')?.classList.add('hidden'));

$('#buy-now')?.addEventListener('click', () => {
  // Redirect to Stripe Payment Link (static). If you need dynamic cart metadata, implement server flow.
  if (STRIPE_PAYMENT_LINK && STRIPE_PAYMENT_LINK.trim().length) {
    window.location.href = STRIPE_PAYMENT_LINK;
  } else {
    alert('No payment link configured. Add your Stripe Payment Link to config.js as PAYMENT_LINK.');
  }
});

$('#checkout-btn')?.addEventListener('click', () => {
  if (STRIPE_PAYMENT_LINK && STRIPE_PAYMENT_LINK.trim().length) {
    window.location.href = STRIPE_PAYMENT_LINK;
  } else {
    alert('No payment link configured. Add your Stripe Payment Link to config.js as PAYMENT_LINK.');
  }
});

/* ---------- Init ---------- */
renderProductSection();
/* --- FORCE ALL PRODUCT IMAGES TO CONTAIN CORRECTLY (JPEG + PNG) --- */
function normalizeImageFit(img) {
  if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return;

  const isWide = img.naturalWidth > img.naturalHeight;

  // Reset first (important)
  img.style.width = "";
  img.style.height = "";
  img.style.maxWidth = "100%";
  img.style.maxHeight = "100%";
  img.style.objectFit = "contain";

  if (isWide) {
    // Wider than tall → full width, auto height
    img.style.width = "100%";
    img.style.height = "auto";
  } else {
    // Taller than wide → full height, auto width
    img.style.height = "100%";
    img.style.width = "auto";
  }
}

/* watch and normalize all gallery + modal images */
function normalizeAllImages() {
  const imgs = [
    $('#gallery-main'),
    $('#modal-image'),
    ...document.querySelectorAll('#gallery-thumbs img')
  ].filter(Boolean);

  imgs.forEach(img => {
    if (img.complete) {
      normalizeImageFit(img);
    } else {
      img.onload = () => normalizeImageFit(img);
    }
  });
}

/* Run normalization after main product render */
setTimeout(normalizeAllImages, 150);

// /* Re-normalize after gallery index changes */
// const galleryMain = $('#gallery-main');
// if (galleryMain) {
//   galleryMain.onload = () => normalizeAllImages();
// }


updateCartUI();

/* expose for debugging */
window._productMirror = { product, cart, addToCart, updateCartUI, renderProductSection };
