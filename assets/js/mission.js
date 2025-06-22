// ====================================================
// COFFEE HUT MISSION GAME - V4.2 (Final Animation)
// ====================================================

const translations = {
  en: {
    finalScreen: {
      title: "Your Offer Is Ready",
      subtitle: "🎉 LET'S GOOO!",
      description: "Show this to the cashier before time runs out"
    },
    steps: {
      title_step0: "Welcome, Challenger",
      title_step1: "Almost There",
      title_step2: "Almost Done",
      desc_step0: "Check-in to unlock level 2 🚀",
      desc_step1_waiting: "Next challenge loading ⏳",
      desc_step1_ready: "Just one more push to win 🔥",
      desc_step2_waiting: "Next challenge loading ⏳",
      desc_step2_ready: "Your reward is waiting for you 🏆",
      button_next: "Next Mission",
      button_claim: "Claim Now"
    },
    errors: {
      far: "You must be at Coffee Hut to proceed",
      permissionDenied: "Please enable location access to continue",
      noSupport: "Unable to determine your location, Reload page!"
    }
  },
  ar: {
    finalScreen: {
      title: "العرض جاهز",
      subtitle: "🎉 يلا بينا!",
      description: "أظهر هذه الشاشة للكاشير قبل انتهاء الوقت"
    },
    steps: {
      title_step0: "مرحباً، متحدٍ",
      title_step1: "أقتربت على الوصول",
      title_step2: "خطوة أخيرة",
      desc_step0: "سجّل حضورك لفتح المستوى الثاني 🚀",
      desc_step1_waiting: "جاري تحميل التحدي التالي ⏳",
      desc_step1_ready: "خطوة أخيرة وتفوز 🔥",
      desc_step2_waiting: "جاري تحميل التحدي التالي ⏳",
      desc_step2_ready: "جائزتك في انتظارك 🏆",
      button_next: "المهمة التالية",
      button_claim: "احصل على العرض"
    },
    errors: {
      far: "يجب أن تكون في موقع كوفي هت للمتابعة",
      permissionDenied: "يرجى تفعيل خدمة تحديد الموقع للمتابعة",
      noSupport: "تعذر تحديد موقعك، أعد تحميل الصفحة!"
    }
  }
};


// const delay = 86400; // Original Time: 24 hours
// const finalDelay = 86400;
const delay = 90; // Test Time: 5 minutes
const finalDelay = 90;

// const hutLat = 30.08865012314379; // Original Location
// const hutLng = 31.30396811084656;
const hutLat = 30.10700900325245; // Test Location
const hutLng = 31.326854809090072;
const hutRadius = 0.10;

let step = +localStorage.stepIndex || 0;
let start = +localStorage.stepStart || Date.now();

const save = () => { localStorage.stepIndex = step; localStorage.stepStart = start; };
const clearAll = () => { clearInterval(window.timer); clearInterval(window.finalTimer); };
const reset = () => { clearAll(); step = 0; start = Date.now(); save(); render(); };
const formatTime = (s) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const ss = s % 60; return `${h.toString().padStart(2, '0')} : ${m.toString().padStart(2, '0')} : ${ss.toString().padStart(2, '0')}`; };
const progressBar = (container) => { const bar = document.createElement('div'); bar.className = 'progress-bar'; for (let i = 0; i < 3; i++) { const seg = document.createElement('div'); seg.className = 'progress-segment' + (i < step ? ' filled' : ''); bar.append(seg); } container.append(bar); };
function checkProximity(callback) { if (!navigator.geolocation) { return callback('no-geo-support'); } navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => { if (permissionStatus.state === 'denied') { return callback('permission-denied'); } navigator.geolocation.getCurrentPosition(pos => { const { latitude, longitude } = pos.coords; const dx = latitude - hutLat; const dy = longitude - hutLng; const dist = Math.sqrt(dx * dx + dy * dy) * 111.32; if (dist > hutRadius) { return callback('far'); } return callback('inside'); }, err => { if (err.code === err.PERMISSION_DENIED) { return callback('permission-denied'); } return callback('location-error'); }, { enableHighAccuracy: false, timeout: 3000, maximumAge: 0 }); }).catch(() => { navigator.geolocation.getCurrentPosition(pos => { const { latitude, longitude } = pos.coords; const dx = latitude - hutLat; const dy = longitude - hutLng; const dist = Math.sqrt(dx * dx + dy * dy) * 111.32; if (dist > hutRadius) { return callback('far'); } return callback('inside'); }, err => { if (err.code === err.PERMISSION_DENIED) { return callback('permission-denied'); } return callback('location-error'); }, { enableHighAccuracy: false, timeout: 3000, maximumAge: 0 }); }); }

// NEW: Function to generate confetti pieces
function createConfetti(container) {
  const confettiColors = ['#ff857f', '#5fd998', '#3fa9f5', '#cd9fec'];
  for (let i = 0; i < 20; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${Math.random() * 50 + 25}%`; // Start inside the box
    // Set a random end position for the blast animation
    piece.style.setProperty('--x-end', `${(Math.random() - 0.5) * 200}px`);
    container.append(piece);
  }
}

// MODIFIED: Function to create the Gift Box
function createGiftBox(container) {
  const boxContainer = document.createElement('div');
  boxContainer.className = 'gift-box-container';
  const giftBox = document.createElement('div');
  giftBox.className = 'gift-box-flat';
  giftBox.id = 'mission-gift-box';

  const boxBase = document.createElement('div');
  boxBase.className = 'box-base-flat';

  const lid = document.createElement('div');
  lid.className = 'box-lid-flat';

  const bow = document.createElement('div');
  bow.className = 'bow';
  lid.append(bow);

  const lock = document.createElement('div');
  lock.className = 'box-lock';

  const heart = document.createElement('div');
  heart.className = 'heart-icon';
  heart.innerHTML = '♥';

  // NEW: Confetti container
  const confetti = document.createElement('div');
  confetti.className = 'confetti-container';
  createConfetti(confetti);

  giftBox.append(boxBase, lid, lock, heart, confetti);
  boxContainer.append(giftBox);
  container.append(boxContainer);
}


// --- The rest of the script is identical to the previous version ---
function render() {
  const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const T = translations[lang];

  clearAll();
  const root = document.getElementById('cards');
  root.innerHTML = '';
  const errMsg = document.getElementById('error-msg');
  if (errMsg) {
    errMsg.style.display = 'none';
    errMsg.innerHTML = '';
  }

  if (step > 3) return reset();

  const card = document.createElement('div');
  card.className = 'card';

  if (step < 3) {
    createGiftBox(card);
  }

  progressBar(card);

  const content = document.createElement('div');
  content.className = 'card-content' + (step === 3 ? ' final' : '');

  if (step === 3) {
    // ... Final screen logic ...
    const h1 = document.createElement('h3'); h1.textContent = T.finalScreen.title; content.append(h1);
    const h2 = document.createElement('h3'); h2.textContent = T.finalScreen.subtitle; content.append(h2);
    const d1 = document.createElement('div'); d1.className = 'description'; d1.textContent = T.finalScreen.description; content.append(d1);
    const st = document.createElement('div'); st.className = 'status'; content.append(st);
    card.append(content); root.append(card); requestAnimationFrame(() => card.classList.add('show'));
    (function updateFinal() { const r = finalDelay - Math.floor((Date.now() - start) / 1000); if (r > 0) st.textContent = formatTime(r); else reset(); })();
    window.finalTimer = setInterval(() => { const r = finalDelay - Math.floor((Date.now() - start) / 1000); if (r > 0) st.textContent = formatTime(r); else reset(); }, 1000);
    return;
  }

  const title = document.createElement('h3');
  title.textContent = step === 0 ? T.steps.title_step0 : step === 1 ? T.steps.title_step1 : T.steps.title_step2;
  content.append(title);

  const elapsed = Math.floor((Date.now() - start) / 1000);
  const desc = document.createElement('div');
  desc.className = 'description';
  if (step === 0) {
    desc.textContent = T.steps.desc_step0;
  } else {
    desc.textContent = elapsed < delay ? T.steps.desc_step1_waiting : T.steps.desc_step1_ready;
  }
  content.append(desc);

  let statusDiv;
  if (step > 0 && elapsed < delay) {
    statusDiv = document.createElement('div');
    statusDiv.className = 'status';
    statusDiv.textContent = formatTime(delay - elapsed);
    content.append(statusDiv);
    window.timer = setInterval(() => {
      const r = delay - Math.floor((Date.now() - start) / 1000);
      if (r > 0) {
        statusDiv.textContent = formatTime(r);
      } else {
        clearInterval(window.timer);
        statusDiv.remove();
        btn.disabled = false;
        const currentDescKey = step === 1 ? 'desc_step1_ready' : 'desc_step2_ready';
        desc.textContent = T.steps[currentDescKey];
        const giftBox = document.getElementById('mission-gift-box');
        if (giftBox) {
          giftBox.classList.add('is-shaking');
        }
      }
    }, 1000);
  }

  const btn = document.createElement('button');
  btn.textContent = (step === 0 || step === 1) ? T.steps.button_next : T.steps.button_claim;
  btn.disabled = (step > 0 && elapsed < delay);
  content.append(btn);

  // ===============================================
  // MODIFIED V3: Button Click Listener with Google Tags
  // ===============================================
  btn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent any default behavior
    btn.disabled = true; // Disable button immediately to prevent multiple clicks

    const giftBox = document.getElementById('mission-gift-box');
    const errMsg = document.getElementById('error-msg'); // Make sure we can access the error div

    // 1. First, check the location.
    checkProximity(status => {
      // 2. Check if the location is correct.
      if (status === 'inside') {

        // --- NEW: GOOGLE TAGS ---
        // Send Google Analytics event based on the current step
        if (typeof gtag === 'function') { // Check if gtag is available first
          if (step === 0) {
            gtag('event', 'Mission-1');
          } else if (step === 1) {
            gtag('event', 'Mission-2');
          } else if (step === 2) {
            gtag('event', 'Mission-3');
          }
        }
        // --- END OF NEW CODE ---

        // SUCCESS! Now we play the animation.
        if (giftBox) {
          giftBox.classList.remove('is-shaking');
          giftBox.classList.add('is-unlocked');
        }

        // 3. Wait for the animation to finish, then update the game state.
        setTimeout(() => {
          clearAll();
          step++;
          start = Date.now();
          save();
          render(); // Re-render for the next step
        }, 1200); // 1.2 seconds for the animation

      } else {
        // FAILURE! Show an error message and DO NOT open the box.
        const errorKey = status === 'far' ? 'far' : status === 'permission-denied' ? 'permissionDenied' : 'noSupport';
        errMsg.textContent = T.errors[errorKey];
        errMsg.style.display = 'block';

        // Re-enable the button so the user can try again.
        btn.disabled = false;
      }
    });
  });

  card.append(content);
  root.append(card);
  requestAnimationFrame(() => card.classList.add('show'));

  if (step > 0 && elapsed >= delay) {
    const giftBox = document.getElementById('mission-gift-box');
    if (giftBox) {
      giftBox.classList.add('is-shaking');
    }
  }
}

if (document.getElementById('cards')) { if (!localStorage.stepStart) save(); render(); }
const languageObserver = new MutationObserver((mutationsList) => { for (const mutation of mutationsList) { if (mutation.type === 'attributes' && mutation.attributeName === 'lang') { render(); } } });
languageObserver.observe(document.documentElement, { attributes: true });