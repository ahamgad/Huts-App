// spinner.js

// --- Global Variables & References ---
let menus = {}; // Will be populated from Google Sheets
let selectedDrinkObject = {}; // This will now hold the currently selected drink object
let currentSpinnerState = { view: 'initial', args: [] };
const spinnerContentArea = document.getElementById("spinner-content-area");
const spinnerWheelContainer = document.querySelector('.spinner-wheel-container');
const spinnerWheel = document.getElementById("spinner-wheel");
const SPIN_DURATION = 2000;

// --- Data Loading and Processing ---
function loadSpinnerData() {
  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vROZEd2FRFZXsGihkUTQPCpBXMwwkMwBioYoemaBX1P8XYWhUQqpw4yA8s4E-plSlbPAxeb5i3bkFEU/pub?gid=0&single=true&output=csv";
  Papa.parse(SHEET_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const dynamicMenus = {};
      results.data.forEach((row) => {
        if (row.spinner_category) {
          const mainCat = row.spinner_category.trim();
          const subCat = row.spinner_subcategory ? row.spinner_subcategory.trim() : null;
          const item = { en: row.item_en, ar: row.item_ar };
          if (subCat) {
            if (!dynamicMenus[mainCat]) dynamicMenus[mainCat] = {};
            if (!dynamicMenus[mainCat][subCat]) dynamicMenus[mainCat][subCat] = [];
            dynamicMenus[mainCat][subCat].push(item);
          } else {
            if (!dynamicMenus[mainCat]) dynamicMenus[mainCat] = [];
            dynamicMenus[mainCat].push(item);
          }
        }
      });
      menus = dynamicMenus;
      updateSpinnerView(getInitialOptionsHtml(), { isInitialLoad: true });
    },
    error: (err) => {
      console.error("Spinner CSV parse error:", err);
      spinnerContentArea.innerHTML = `<p>Failed to load spinner data.</p>`;
    },
  });
}

// --- View Update Function ---
function updateSpinnerView(newHtml, options = {}) {
  if (!spinnerContentArea || !spinnerWheel) return;
  spinnerContentArea.classList.add("is-transitioning");
  if (!options.isInitialLoad && !options.skipSpin) {
    spinnerWheel.classList.add("is-spinning");
  }
  const delay = (options.isInitialLoad || options.skipSpin) ? 250 : SPIN_DURATION;
  setTimeout(() => {
    spinnerWheel.classList.remove("is-spinning");
    spinnerContentArea.innerHTML = newHtml;
    attachEventListeners();
    spinnerContentArea.classList.remove("is-transitioning");
    // if (options.hideSpinnerAfter) {
    //   spinnerWheelContainer.classList.add('hidden');
    // }
    if (options.launchConfetti) {
      launchConfetti();
    }
  }, delay);
}

// --- HTML Template Functions ---
function getInitialOptionsHtml() {
  const coffeeLabel = userLang === 'ar' ? 'مشروبات القهوة' : 'Coffee Drinks';
  const nonCoffeeLabel = userLang === 'ar' ? 'مشروبات غير القهوة' : 'Non-Coffee Drinks';
  const snacksLabel = userLang === 'ar' ? 'تسالي وحلويات' : 'Snacks & Desserts';
  return `
      <button class="option-button" data-action="selectCategory" data-category="coffee"><i class="fi fi-rr-coffee-bean"></i>${coffeeLabel}</button>
      <button class="option-button" data-action="selectCategory" data-category="noncoffee"><i class="fi fi-rr-glass-champagne"></i>${nonCoffeeLabel}</button>
      <button class="option-button" data-action="selectCategory" data-category="snacks"><i class="fi fi-rr-candy"></i>${snacksLabel}</button>
    `;
}

function getSubOptionsHtml(category) {
  const titleMap = {
    coffee: { en: 'Coffee Drinks', ar: 'مشروبات القهوة' },
    noncoffee: { en: 'Non-Coffee Drinks', ar: 'مشروبات غير القهوة' }
  };
  const titleHeader = `<h3 class='page-title'>${titleMap[category][userLang]}</h3>`;
  const option1 = category === 'coffee' ? 'hot' : 'cold';
  const option2 = category === 'coffee' ? 'iced' : 'hot';
  let label1, label2;
  if (userLang === 'ar') {
    label1 = category === 'coffee' ? '<i class="fi fi-rr-mug-hot"></i>قهوة ساخنة' : '<i class="fi fi-rr-glass-citrus"></i>أنعشني';
    label2 = category === 'coffee' ? '<i class="fi fi-rr-beer"></i>قهوة باردة' : '<i class="fi fi-rr-mug-hot"></i>مزاج دافي';
  } else {
    label1 = category === 'coffee' ? '<i class="fi fi-rr-mug-hot"></i>Hot Coffee' : '<i class="fi fi-rr-glass-citrus"></i>Refresh Me';
    label2 = category === 'coffee' ? '<i class="fi fi-rr-beer"></i>Iced Coffee' : '<i class="fi fi-rr-mug-hot"></i>Keep Me Warm';
  }
  return `
      ${titleHeader}
      <button class='option-button' data-action="suggestDrink" data-category="${category}" data-subcategory="${option1}">${label1}</button>
      <button class='option-button' data-action="suggestDrink" data-category="${category}" data-subcategory="${option2}">${label2}</button>
    `;
}

// --- MODIFIED: This function now ONLY displays the currently selected drink ---
function getSuggestionHtml(category, subcategory) {
  const spinAgainText = userLang === 'ar' ? 'جرّب تاني' : 'Spin again';

  // It displays whatever is currently in the global 'selectedDrinkObject'
  return `
    <div class='drink-name'>${selectedDrinkObject[userLang]}</div>
    <div class='choice-buttons'>
      <button data-action="acceptSuggestion"><i class="fi fi-rr-social-network"></i></button>
      <button data-action="suggestDrink" data-category="${category}" data-subcategory="${subcategory || ''}"><i class="fi fi-rr-hand"></i>${spinAgainText}</button>
    </div>
  `;
}

function getAcceptedHtml() {
  const text1 = userLang === 'ar' ? 'يلا بينا!' : 'Let’s gooo!';
  const text2 = userLang === 'ar' ? 'جرّب تاني' : 'Spin again';
  return `
    <div class="page-title">${selectedDrinkObject[userLang]}</div>
    <div class='drink-name'>🎉 ${text1}</div>
    <div class='choice-buttons'>
      <button data-action="resetGame"><i class="fi fi-rr-refresh"></i> ${text2}</button>
    </div>
  `;
}

// --- Function to attach all event listeners ---
function attachEventListeners() {
  const buttons = spinnerContentArea.querySelectorAll('button[data-action]');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      vibrate();
      const action = button.dataset.action;
      const category = button.dataset.category;
      const subcategory = button.dataset.subcategory;
      const actions = {
        selectCategory: () => selectCategory(category),
        suggestDrink: () => suggestDrink(category, subcategory),
        acceptSuggestion: () => acceptSuggestion(),
        resetGame: () => resetGame()
      };
      if (actions[action]) actions[action]();
    });
  });
}

// --- Main Game Logic ---
function selectCategory(category) {
  const nextView = menus[category] && Array.isArray(menus[category]) ? 'suggestion' : 'subOptions';
  currentSpinnerState = { view: nextView, args: [category] };
  if (nextView === 'subOptions') {
    updateSpinnerView(getSubOptionsHtml(category));
  } else {
    suggestDrink(category); // The first suggestion for snacks
  }
}

// --- MODIFIED: This function now CHOOSES a random drink first ---
function suggestDrink(category, subcategory = null) {
  currentSpinnerState = { view: 'suggestion', args: [category, subcategory] };

  // 1. Pick a random drink and save it globally
  const list = subcategory ? menus[category][subcategory] : menus[category];
  if (!list || list.length === 0) {
    const errorText = userLang === 'ar' ? 'لا توجد عناصر في هذا القسم!' : 'No items found in this section!';
    const backText = userLang === 'ar' ? 'ابدأ من جديد' : 'Start Over';
    updateSpinnerView(`<div class='drink-name'>${errorText}</div> <div class='choice-buttons'><button data-action="resetGame">${backText}</button></div>`, { skipSpin: true });
    return;
  }
  const randomDrinkObj = list[Math.floor(Math.random() * list.length)];
  selectedDrinkObject = randomDrinkObj;

  // 2. Update the view. getSuggestionHtml will now use the object we just saved.
  updateSpinnerView(getSuggestionHtml(category, subcategory), { launchConfetti: true });
}

function acceptSuggestion() {
  currentSpinnerState = { view: 'accepted', args: [] };
  // spinnerWheelContainer.classList.add('hidden');
  updateSpinnerView(getAcceptedHtml(), { skipSpin: true });
}

function resetGame() {
  currentSpinnerState = { view: 'initial', args: [] };
  // spinnerWheelContainer.classList.remove('hidden');
  updateSpinnerView(getInitialOptionsHtml(), { skipSpin: true });
}

// --- Global Redraw Function for Language Change ---
window.redrawSpinnerView = function () {
  let newHtml = '';
  // This switch statement now calls the 'dumb' HTML template functions
  // which will use the *already selected* drink object.
  switch (currentSpinnerState.view) {
    case 'initial': newHtml = getInitialOptionsHtml(); break;
    case 'subOptions': newHtml = getSubOptionsHtml(...currentSpinnerState.args); break;
    case 'suggestion': newHtml = getSuggestionHtml(...currentSpinnerState.args); break;
    case 'accepted': newHtml = getAcceptedHtml(); break;
  }
  // Instantly update the view without animation
  spinnerContentArea.innerHTML = newHtml;
  attachEventListeners();
}

// --- Effects ---
function launchConfetti() {
  const centerEl = spinnerWheelContainer;
  if (!centerEl) return;
  const rect = centerEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const themeColors = ['#c58be8', '#79e0ab', '#66bfff', '#ff9994', '#e69540'];
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.backgroundColor = themeColors[Math.floor(Math.random() * themeColors.length)];
    confetti.style.left = centerX + 'px';
    confetti.style.top = centerY + 'px';
    confetti.style.setProperty('--x', `${Math.random() * 200 - 100}px`);
    confetti.style.setProperty('--y', `${Math.random() * 200 - 100}px`);
    confetti.style.zIndex = 1;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1600);
  }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
  loadSpinnerData();
});

function vibrate(duration = 50) {
  if (navigator.vibrate) navigator.vibrate(duration);
}

// --- MODIFIED: Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Animate the spinner wheel into view
  if (spinnerWheelContainer) {
    // A small delay ensures the browser has rendered the initial (scale: 0) state
    setTimeout(() => {
      spinnerWheelContainer.classList.add('visible');
    }, 100);
  }

  // 2. Start fetching the data from the Google Sheet
  loadSpinnerData();
});

function vibrate(duration = 50) {
  if (navigator.vibrate) navigator.vibrate(duration);
}