/* ═══════════════════════════════════════════
   SwiftRide – Complete Application Logic
═══════════════════════════════════════════ */

// ─── STATE ───────────────────────────────
const state = {
  currentPage: 'home',
  currentStep: 1,
  selectedCab: null,
  cabPricePerKm: 0,
  cabArrival: 0,
  distance: 0,
  baseFare: 50,
  totalFare: 0,
  discount: 0,
  promoApplied: false,
  selectedPayment: 'UPI',
  isDark: localStorage.getItem('sr_dark') === 'true',
};

// ─── INIT ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setDefaults();
  applyTheme(state.isDark);
  // Set initial active nav link
  setActiveNavLink('home');
});

function setDefaults() {
  const today = new Date().toISOString().split('T')[0];
  const now   = new Date().toTimeString().slice(0,5);
  ['heroDate','s1date'].forEach(id => { const el=document.getElementById(id); if(el) el.value=today; });
  ['heroTime','s1time'].forEach(id => { const el=document.getElementById(id); if(el) el.value=now; });
}

// ─── NAVIGATION ───────────────────────────
function navigate(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = '';
  });

  // Show target
  const target = document.getElementById('page-' + page);
  if (!target) { console.warn('Page not found:', page); return; }
  target.classList.add('active');
  state.currentPage = page;

  // Update nav links
  setActiveNavLink(page);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Close mobile menu
  document.getElementById('navLinks').classList.remove('open');

  // Special: if navigating to book, reset to step 1
  if (page === 'book' && state.currentStep === 6) {
    // Don't reset if coming from confirmation – let user see they finished
  }
}

function setActiveNavLink(page) {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('data-page') === page) a.classList.add('active');
  });
}

// ─── MOBILE MENU ──────────────────────────
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ─── DARK MODE ────────────────────────────
function toggleTheme() {
  state.isDark = !state.isDark;
  applyTheme(state.isDark);
  localStorage.setItem('sr_dark', state.isDark);
}
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// ─── HERO SEARCH ──────────────────────────
function heroSearch() {
  const pickup = document.getElementById('heroPickup').value.trim();
  const drop   = document.getElementById('heroDrop').value.trim();
  if (!pickup && !drop) { showToast('Please enter pickup and drop locations first!'); return; }
  if (!pickup) { showToast('Please enter a pickup location.'); return; }
  if (!drop)   { showToast('Please enter a drop location.'); return; }
  // Prefill booking step 1
  document.getElementById('s1pickup').value = pickup;
  document.getElementById('s1drop').value   = drop;
  const hDate = document.getElementById('heroDate').value;
  const hTime = document.getElementById('heroTime').value;
  if (hDate) document.getElementById('s1date').value = hDate;
  if (hTime) document.getElementById('s1time').value = hTime;
  navigate('book');
  gotoStep(1);
}

// ─── FILL FAVOURITE LOCATIONS ─────────────
function fillLocations(pickup, drop) {
  document.getElementById('s1pickup').value = pickup;
  document.getElementById('s1drop').value   = drop;
}

// ─── BOOKING STEPS ────────────────────────
function gotoStep(step) {
  // Validation before advancing
  if (step === 2) {
    const p = document.getElementById('s1pickup').value.trim();
    const d = document.getElementById('s1drop').value.trim();
    if (!p) { showToast('Please enter a pickup location.'); return; }
    if (!d) { showToast('Please enter a drop location.'); return; }
    // Update cab selection page subtitle
    document.getElementById('s2pickup').textContent = p;
    document.getElementById('s2drop').textContent   = d;
  }
  if (step === 3) {
    if (!state.selectedCab) { showToast('Please select a cab type to continue.'); return; }
    buildFareEstimate();
  }
  if (step === 5) {
    const name  = document.getElementById('paxName').value.trim();
    const phone = document.getElementById('paxPhone').value.trim();
    if (!name)  { showToast('Please enter your full name.'); return; }
    if (!phone || phone.length < 10) { showToast('Please enter a valid 10-digit phone number.'); return; }
    // Sync payment total
    document.getElementById('payTotal').textContent  = '₹' + state.totalFare;
    document.getElementById('payCab').textContent    = state.selectedCab;
    document.getElementById('btnPayAmt').textContent = state.totalFare;
  }

  // Hide all steps
  document.querySelectorAll('.book-step').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById('step' + step);
  if (!target) return;
  target.classList.remove('hidden');
  state.currentStep = step;

  // Update progress indicators
  document.querySelectorAll('.ps').forEach((el, i) => {
    el.classList.remove('active','done');
    if (i + 1 < step) el.classList.add('done');
    else if (i + 1 === step) el.classList.add('active');
  });

  // Scroll to top of booking container
  document.getElementById('page-book').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── CAB SELECTION ────────────────────────
function pickCab(el, name, pricePerKm, seats, arrival) {
  document.querySelectorAll('.cab-row').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedCab      = name;
  state.cabPricePerKm    = pricePerKm;
  state.cabArrival       = arrival;
  state.promoApplied     = false;
  state.discount         = 0;
  const nextBtn = document.getElementById('step2Next');
  if (nextBtn) nextBtn.disabled = false;
}

// ─── FARE ESTIMATE ────────────────────────
function buildFareEstimate() {
  state.distance = Math.floor(Math.random() * 22) + 8; // 8–30 km
  const rideFare = state.distance * state.cabPricePerKm;
  state.totalFare = rideFare + state.baseFare - state.discount;

  const from = document.getElementById('s1pickup').value || '–';
  const to   = document.getElementById('s1drop').value   || '–';

  document.getElementById('fareFrom').textContent = from;
  document.getElementById('fareTo').textContent   = to;
  document.getElementById('fbCab').textContent    = state.selectedCab;
  document.getElementById('fbDist').textContent   = state.distance + ' km';
  document.getElementById('fbRate').textContent   = '₹' + state.cabPricePerKm + '/km';
  document.getElementById('fbBase').textContent   = '₹' + state.baseFare;
  document.getElementById('fbDiscount').textContent = '-₹' + state.discount;
  document.getElementById('fbTotal').textContent  = '₹' + state.totalFare;
  document.getElementById('promoInput').value     = '';
  document.getElementById('promoFeedback').textContent = '';
  document.getElementById('promoFeedback').className   = 'promo-feedback';
}

// ─── PROMO CODE ───────────────────────────
function applyPromo() {
  const code = document.getElementById('promoInput').value.trim().toUpperCase();
  const fb   = document.getElementById('promoFeedback');
  if (!code) { fb.textContent = 'Please enter a promo code.'; fb.className = 'promo-feedback err'; return; }

  const validCodes = { 'FIRST50': 0.5, 'SWIFT20': 0.2, 'RIDE10': 0.1 };
  if (validCodes[code]) {
    if (state.promoApplied) { fb.textContent = 'A promo code has already been applied.'; fb.className = 'promo-feedback err'; return; }
    const pct = validCodes[code];
    const rideFare = state.distance * state.cabPricePerKm;
    state.discount = Math.floor(rideFare * pct);
    state.totalFare = rideFare + state.baseFare - state.discount;
    state.promoApplied = true;
    document.getElementById('fbDiscount').textContent = '-₹' + state.discount;
    document.getElementById('fbTotal').textContent    = '₹' + state.totalFare;
    fb.textContent  = '🎉 ' + Math.floor(pct * 100) + '% discount applied! You save ₹' + state.discount;
    fb.className    = 'promo-feedback ok';
  } else {
    fb.textContent = '❌ Invalid code. Try FIRST50 for 50% off!';
    fb.className   = 'promo-feedback err';
  }
}

// ─── PAYMENT METHOD ───────────────────────
function pickPayment(el, method) {
  document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  state.selectedPayment = method;
  const cardForm = document.getElementById('cardForm');
  if (method === 'Credit Card' || method === 'Debit Card') {
    cardForm.classList.remove('hidden');
  } else {
    cardForm.classList.add('hidden');
  }
}

function formatCard(input) {
  let v = input.value.replace(/\D/g,'').slice(0,16);
  input.value = v.replace(/(.{4})/g,'$1 ').trim();
}

// ─── CONFIRM BOOKING ─────────────────────
function confirmBooking() {
  const bookingId = 'SR' + Date.now().toString().slice(-8).toUpperCase();
  const drivers   = ['Ramesh Kumar','Suresh Yadav','Mohan Singh','Arjun Patel','Vijay Sharma','Ravi Gupta'];
  const driver    = drivers[Math.floor(Math.random() * drivers.length)];
  const plates    = ['DL 3C AM','DL 4F BN','HR 26 AC','UP 14 BT','MH 12 CF'];
  const plate     = plates[Math.floor(Math.random() * plates.length)];
  const num       = (Math.floor(Math.random() * 9000) + 1000);
  const vehicle   = plate + ' ' + num;
  const pickup    = document.getElementById('s1pickup').value;
  const drop      = document.getElementById('s1drop').value;

  // Fill confirmation screen
  document.getElementById('cdBookingId').textContent = bookingId;
  document.getElementById('cdDriver').textContent    = driver;
  document.getElementById('cdVehicle').textContent   = vehicle;
  document.getElementById('cdCab').textContent       = state.selectedCab;
  document.getElementById('cdEta').textContent       = state.cabArrival + ' minutes';
  document.getElementById('cdFare').textContent      = '₹' + state.totalFare;
  document.getElementById('cdPayment').textContent   = state.selectedPayment;
  document.getElementById('cdRoute').textContent     = pickup + ' → ' + drop;

  // Add to history
  addToHistory({ bookingId, pickup, drop, fare: state.totalFare, cab: state.selectedCab });
  gotoStep(6);
  showToast('Booking confirmed! Driver is on the way 🚗');
}

// ─── STAR RATING ──────────────────────────
function rateStar(val) {
  document.querySelectorAll('#starRow span').forEach((s,i) => {
    s.classList.toggle('lit', i < val);
  });
  showToast('Thanks for rating ' + '★'.repeat(val));
}

// ─── NEW BOOKING ──────────────────────────
function newBooking() {
  // Reset state
  state.selectedCab   = null;
  state.promoApplied  = false;
  state.discount      = 0;
  state.totalFare     = 0;
  state.selectedPayment = 'UPI';
  // Clear fields
  ['s1pickup','s1drop','paxName','paxPhone','paxPickupDetail','paxDropDetail','paxNote'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.querySelectorAll('.cab-row').forEach(r => r.classList.remove('selected'));
  document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('active'));
  const firstPay = document.querySelector('.pay-opt');
  if (firstPay) { firstPay.classList.add('active'); state.selectedPayment = 'UPI'; }
  const nextBtn = document.getElementById('step2Next');
  if (nextBtn) nextBtn.disabled = true;
  setDefaults();
  gotoStep(1);
}

// ─── HISTORY ──────────────────────────────
function addToHistory(ride) {
  const list  = document.getElementById('historyList');
  const today = new Date();
  const day   = String(today.getDate()).padStart(2,'0');
  const month = today.toLocaleString('en',{month:'short'});
  const card  = document.createElement('div');
  card.className = 'history-card';
  card.setAttribute('data-status','Completed');
  card.innerHTML = `
    <div class="hc-date"><div class="hc-day">${day}</div><div class="hc-month">${month}</div></div>
    <div class="hc-route">
      <div class="hc-from"><i class="fa-solid fa-circle green-col"></i> ${ride.pickup}</div>
      <div class="hc-to"><i class="fa-solid fa-location-dot orange-col"></i> ${ride.drop}</div>
    </div>
    <div class="hc-info">
      <span class="hc-cab"><i class="fa-solid fa-car"></i> ${ride.cab}</span>
      <span class="hc-dist"><i class="fa-solid fa-road"></i> ${state.distance} km</span>
    </div>
    <div class="hc-fare">₹${ride.fare}</div>
    <div class="hc-status completed">Completed</div>
    <button class="btn-rebook" onclick="rebookHistory('${ride.pickup}','${ride.drop}')">Rebook</button>
  `;
  list.insertBefore(card, list.firstChild);

  // Update stats
  updateHistoryStats();
}

function updateHistoryStats() {
  const cards    = document.querySelectorAll('.history-card');
  const completed= [...cards].filter(c => c.getAttribute('data-status') === 'Completed');
  let total      = 0;
  completed.forEach(c => {
    const fareText = c.querySelector('.hc-fare').textContent.replace(/[₹,]/g,'');
    const fare = parseFloat(fareText);
    if (!isNaN(fare)) total += fare;
  });
  const trEl = document.getElementById('totalRides');
  const tsEl = document.getElementById('totalSpent');
  const psEl = document.getElementById('psRides');
  const pspEl= document.getElementById('psSpent');
  if (trEl) trEl.textContent = cards.length;
  if (tsEl) tsEl.textContent = '₹' + total.toLocaleString('en-IN');
  if (psEl) psEl.textContent = cards.length;
  if (pspEl) pspEl.textContent = '₹' + total.toLocaleString('en-IN');
}

function filterRides(btn, status) {
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.history-card').forEach(c => {
    c.style.display = (status === 'all' || c.getAttribute('data-status') === status) ? '' : 'none';
  });
}

function rebookHistory(pickup, drop) {
  document.getElementById('s1pickup').value = pickup;
  document.getElementById('s1drop').value   = drop;
  document.getElementById('heroPickup').value = pickup;
  document.getElementById('heroDrop').value   = drop;
  navigate('book');
  gotoStep(1);
}

// ─── PROFILE ──────────────────────────────
function toggleEditProfile() {
  const form = document.getElementById('editProfileForm');
  form.classList.toggle('hidden');
}

function saveProfile() {
  const name  = document.getElementById('epName').value.trim();
  const phone = document.getElementById('epPhone').value.trim();
  const email = document.getElementById('epEmail').value.trim();
  if (!name || !phone || !email) { showToast('Please fill in all profile fields.'); return; }
  document.getElementById('pName').textContent  = name;
  document.getElementById('pPhone').innerHTML   = '<i class="fa-solid fa-phone"></i> ' + phone;
  document.getElementById('pEmail').innerHTML   = '<i class="fa-solid fa-envelope"></i> ' + email;
  document.getElementById('editProfileForm').classList.add('hidden');
  showToast('Profile updated successfully! ✅');
}

// ─── FAQ ──────────────────────────────────
function toggleFaq(btn) {
  const ans    = btn.nextElementSibling;
  const isOpen = ans.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-ans').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-btn').forEach(b => b.classList.remove('open'));
  if (!isOpen) {
    ans.classList.add('open');
    btn.classList.add('open');
  }
}

// ─── PROMO COPY ───────────────────────────
function copyCode() {
  navigator.clipboard.writeText('FIRST50')
    .then(() => showToast('Code FIRST50 copied! 🎉 Use it at checkout.'))
    .catch(() => showToast('Code: FIRST50 — Enter it at the fare step!'));
}

// ─── TOAST ────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

// ─── NAVBAR SCROLL ────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  nav.style.boxShadow = window.scrollY > 30 ? '0 4px 24px rgba(0,0,0,0.5)' : '';
});

// ─── CLOSE MENU ON OUTSIDE CLICK ──────────
document.addEventListener('click', e => {
  const nav  = document.getElementById('navLinks');
  const ham  = document.getElementById('hamburger');
  if (nav && ham && !nav.contains(e.target) && !ham.contains(e.target)) {
    nav.classList.remove('open');
  }
});
