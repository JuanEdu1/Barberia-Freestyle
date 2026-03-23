// ─────────────────────────────────────────────
//  Barber Freestyle – Booking Logic
// ─────────────────────────────────────────────

const SERVICES = {
  'corte-basico':       { name: 'Corte Básico',               price: '$30.000',   duration: 25,  note: 'Incluye cejas y styling' },
  'corte-freestyle':    { name: 'Corte + Freestyle',           price: '$35.000',   duration: 35,  note: 'Diseño freestyle personalizado' },
  'corte-barba':        { name: 'Corte con Barba',             price: '$40.000',   duration: 35,  note: 'Perfilado de barba + cejas' },
  'corte-dama':         { name: 'Corte para Dama',             price: '$35.000',   duration: 40,  note: 'Corte + cejas con cuchilla' },
  'freestyle-creativo': { name: 'Corte + Freestyle Creativo',  price: '$40.000',   duration: 45,  note: 'Diseño avanzado y creativo' },
  'asesoria-visajista': { name: 'Asesoría Visajista',          price: '$60.000',   duration: 60,  note: 'Corte + asesoría de estilo' },
  'rayitos-mechas':     { name: 'Rayitos o Mechas',            price: '$225.000+', duration: 200, note: 'Precio puede variar según trabajo' },
  'trenzados':          { name: 'Trenzados',                   price: '$70.000+',  duration: 150, note: 'Precio varía según diseño' },
};

const OPEN_HOUR  = 9;   // 9:00 AM
const CLOSE_HOUR = 18;  // 6:00 PM

// ── DOM refs ──────────────────────────────────
const inpName    = document.getElementById('inp-name');
const inpPhone   = document.getElementById('inp-phone');
const inpEmail   = document.getElementById('inp-email');
const inpService = document.getElementById('inp-service');
const inpNotes   = document.getElementById('inp-notes');
const submitBtn  = document.getElementById('submit-btn');

const serviceBadge  = document.getElementById('service-badge');
const badgeDuration = document.getElementById('badge-duration');
const badgePrice    = document.getElementById('badge-price');
const badgeNote     = document.getElementById('badge-note');

const slotsGrid        = document.getElementById('slots-grid');
const slotsPlaceholder = document.getElementById('slots-placeholder');
const sectionSummary   = document.getElementById('section-summary');

let selectedDate = null;
let selectedTime = null;
let currentSlug  = null;

// ── Flatpickr Calendar ────────────────────────
const fp = flatpickr('#cal-input', {
  locale: 'es',
  inline: true,
  minDate: 'today',
  disable: [
    function(date) {
      return date.getDay() === 0; // Sunday disabled
    }
  ],
  dateFormat: 'Y-m-d',
  onChange: function(selectedDates, dateStr) {
    selectedDate = dateStr;
    selectedTime = null;
    document.getElementById('err-date').classList.remove('show');
    regenerateSlots();
    updateSummary();
    checkFormReady();
  }
});

// ── Service Selector ──────────────────────────
inpService.addEventListener('change', () => {
  currentSlug = inpService.value;
  document.getElementById('err-service').classList.remove('show');

  if (currentSlug && SERVICES[currentSlug]) {
    const svc = SERVICES[currentSlug];
    badgeDuration.textContent = svc.duration + ' min';
    badgePrice.textContent    = svc.price;
    badgeNote.textContent     = svc.note;
    serviceBadge.style.display = 'flex';
  } else {
    serviceBadge.style.display = 'none';
  }

  selectedTime = null;
  regenerateSlots();
  updateSummary();
  checkFormReady();
});

// ── Slot Generation ───────────────────────────
function regenerateSlots() {
  slotsGrid.innerHTML = '';

  if (!selectedDate || !currentSlug) {
    slotsGrid.style.display = 'none';
    slotsPlaceholder.style.display = 'block';
    slotsPlaceholder.textContent = '← Selecciona una fecha y un servicio';
    return;
  }

  const svc = SERVICES[currentSlug];
  const durationMins = svc.duration;

  // Latest start time = CLOSE_HOUR*60 - durationMins
  const latestStart = CLOSE_HOUR * 60 - durationMins;

  const slots = [];
  for (let minutes = OPEN_HOUR * 60; minutes <= latestStart; minutes += 30) {
    slots.push(minutes);
  }

  if (slots.length === 0) {
    slotsGrid.style.display = 'none';
    slotsPlaceholder.style.display = 'block';
    slotsPlaceholder.textContent = 'Este servicio no tiene horarios disponibles en el día seleccionado.';
    return;
  }

  slotsGrid.style.display = 'grid';
  slotsPlaceholder.style.display = 'none';

  // Get occupied slots from localStorage
  const occupied = getOccupiedSlots(selectedDate, currentSlug);

  slots.forEach(mins => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const timeStr  = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const label    = formatTime(h, m);
    const isOccupied = occupied.includes(timeStr);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot-btn';
    btn.textContent = label;
    btn.dataset.time = timeStr;

    if (isOccupied) {
      btn.disabled = true;
      btn.title = 'No disponible';
    } else {
      btn.addEventListener('click', () => selectSlot(btn, timeStr));
    }

    // Re-select if was already selected
    if (timeStr === selectedTime) {
      btn.classList.add('selected');
    }

    slotsGrid.appendChild(btn);
  });
}

function selectSlot(btn, timeStr) {
  // Clear all selected
  slotsGrid.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedTime = timeStr;
  document.getElementById('err-time').classList.remove('show');
  updateSummary();
  checkFormReady();
}

function formatTime(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${hour12}:${String(m).padStart(2,'0')} ${ampm}`;
}

// ── Summary Section ───────────────────────────
function updateSummary() {
  if (!currentSlug || !selectedDate || !selectedTime) {
    sectionSummary.style.display = 'none';
    return;
  }

  sectionSummary.style.display = 'block';
  const svc = SERVICES[currentSlug];

  document.getElementById('sum-service').textContent  = svc.name;
  document.getElementById('sum-duration').textContent = svc.duration + ' minutos';
  document.getElementById('sum-date').textContent     = formatDateSpanish(selectedDate);
  document.getElementById('sum-time').textContent     = selectedTime;
  document.getElementById('sum-price').textContent    = svc.price;
}

function formatDateSpanish(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const days   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const date   = new Date(y, m - 1, d);
  return `${days[date.getDay()].charAt(0).toUpperCase() + days[date.getDay()].slice(1)}, ${d} de ${months[m-1]} de ${y}`;
}

// ── Occupied slots (localStorage) ────────────
function getOccupiedSlots(date, slug) {
  try {
    const key = `bk_${date}_${slug}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function addOccupiedSlot(date, slug, time) {
  try {
    const key = `bk_${date}_${slug}`;
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    if (!current.includes(time)) current.push(time);
    localStorage.setItem(key, JSON.stringify(current));
  } catch {}
}

// ── Form Validation ───────────────────────────
function checkFormReady() {
  const ready = inpName.value.trim() &&
                inpPhone.value.trim() &&
                currentSlug &&
                selectedDate &&
                selectedTime;
  submitBtn.disabled = !ready;
}

[inpName, inpPhone].forEach(el => el.addEventListener('input', checkFormReady));

// ── Inline Errors ─────────────────────────────
function validateAndSubmit() {
  let valid = true;

  if (!inpName.value.trim()) { showErr('err-name', 'inp-name'); valid = false; }
  else                       { hideErr('err-name', 'inp-name'); }

  if (!inpPhone.value.trim()) { showErr('err-phone', 'inp-phone'); valid = false; }
  else                        { hideErr('err-phone', 'inp-phone'); }

  if (!currentSlug) { showErr('err-service', 'inp-service'); valid = false; }
  else              { hideErr('err-service', 'inp-service'); }

  if (!selectedDate) { document.getElementById('err-date').classList.add('show'); valid = false; }
  else               { document.getElementById('err-date').classList.remove('show'); }

  if (!selectedTime) { document.getElementById('err-time').classList.add('show'); valid = false; }
  else               { document.getElementById('err-time').classList.remove('show'); }

  return valid;
}

function showErr(errId, inputId) {
  document.getElementById(errId).classList.add('show');
  document.getElementById(inputId)?.classList.add('error');
}
function hideErr(errId, inputId) {
  document.getElementById(errId).classList.remove('show');
  document.getElementById(inputId)?.classList.remove('error');
}

// ── URL Param Pre-selection ───────────────────
function preSelectFromURL() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('servicio');
  if (slug && SERVICES[slug]) {
    inpService.value = slug;
    inpService.dispatchEvent(new Event('change'));
  }
}

// ── Submit ────────────────────────────────────
submitBtn.addEventListener('click', async () => {
  if (!validateAndSubmit()) return;

  const svc = SERVICES[currentSlug];
  const data = {
    name:    inpName.value.trim(),
    phone:   inpPhone.value.trim(),
    email:   inpEmail.value.trim(),
    service: svc.name,
    date:    selectedDate,
    time:    selectedTime,
    notes:   inpNotes.value.trim(),
    timestamp: new Date().toISOString()
  };

  // Mark slot as occupied
  addOccupiedSlot(selectedDate, currentSlug, selectedTime);

  try {
    const encodedUrl = encodeURIComponent('https://api.openrouter.ai/api/v1/messages');
    await fetch('https://dev-edge.flowith.net/api-proxy/' + encodedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': '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' },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [{
          role: 'user',
          content: `Nueva solicitud de cita en Barber Freestyle:\n\nCliente: ${data.name}\nTeléfono: ${data.phone}\nEmail: ${data.email || 'N/A'}\nServicio: ${data.service}\nFecha: ${data.date}\nHora: ${data.time}\nNotas: ${data.notes || 'Ninguna'}\n\nContacta al cliente para confirmar.`
        }]
      })
    });
  } catch (e) {
    console.log('Error sending booking (local only):', e);
  }

  localStorage.setItem('lastBooking', JSON.stringify(data));
  showSuccessMessage();
  resetForm();
});

function resetForm() {
  inpName.value    = '';
  inpPhone.value   = '';
  inpEmail.value   = '';
  inpNotes.value   = '';
  inpService.value = '';
  serviceBadge.style.display = 'none';
  selectedDate = null;
  selectedTime = null;
  currentSlug  = null;
  fp.clear();
  slotsGrid.innerHTML = '';
  slotsGrid.style.display = 'none';
  slotsPlaceholder.style.display = 'block';
  slotsPlaceholder.textContent = '← Selecciona una fecha y un servicio';
  sectionSummary.style.display = 'none';
  submitBtn.disabled = true;
}

function showSuccessMessage() {
  const msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;top:20px;right:20px;background:#16a34a;color:#fff;padding:16px 24px;border-radius:12px;font-family:Inter,sans-serif;font-size:0.95rem;z-index:9999;box-shadow:0 4px 24px rgba(0,0,0,0.4);max-width:340px;';
  msg.innerHTML = '<strong>✓ ¡Solicitud recibida!</strong><br>Te contactaremos pronto por WhatsApp para confirmar tu cita.';
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 6000);
}

// ── Init ──────────────────────────────────────
preSelectFromURL();
