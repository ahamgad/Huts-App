// ===============================================
// menu.js - FINAL VERSION WITH UNITS
// ===============================================

// Make functions globally accessible
window.loadMenuData = loadMenuData;
window.renderAll = renderAll;

let groupedData = null;

function renderSkeletonLoader() {
  const tabsContainer = document.getElementById("tabs-container");
  const productList = document.getElementById("product-list");
  tabsContainer.innerHTML = "";
  productList.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const skeletonTab = document.createElement("div");
    skeletonTab.className = "skeleton skeleton-tab";
    tabsContainer.appendChild(skeletonTab);
  }
  for (let i = 0; i < 3; i++) {
    const section = document.createElement("div");
    section.className = "skeleton-section";
    const header = document.createElement("div");
    header.className = "skeleton-cat-header";
    header.innerHTML = `<div class="skeleton icon"></div><div class="skeleton text"></div>`;
    section.appendChild(header);
    const productsDiv = document.createElement("div");
    productsDiv.className = "products";
    for (let j = 0; j < 3; j++) {
      const product = document.createElement("div");
      product.className = "skeleton skeleton-product";
      productsDiv.appendChild(product);
    }
    section.appendChild(productsDiv);
    productList.appendChild(section);
  }
}

function loadMenuData() {
  const menuContent = document.querySelector('.menu-content');
  if (menuContent) menuContent.classList.add('noscroll');

  // The skeleton classes are now added by default in the HTML,
  // so no need to call a function for them here.
  // The CSS will handle their initial appearance.
  renderSkeletonLoader(); // This handles the tabs and product list skeletons

  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vROZEd2FRFZXsGihkUTQPCpBXMwwkMwBioYoemaBX1P8XYWhUQqpw4yA8s4E-plSlbPAxeb5i3bkFEU/pub?gid=0&single=true&output=csv";

  Papa.parse(SHEET_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      groupedData = {};
      results.data.forEach((r) => {
        if (r.category_id && !groupedData[r.category_id]) groupedData[r.category_id] = [];
        if (r.category_id) groupedData[r.category_id].push(r);
      });
      renderAll();

      const footer = document.querySelector('.menu-page-footer');
      if (footer) footer.style.display = 'flex';

      if (menuContent) menuContent.classList.remove('noscroll');

      initProductSheetLogic();

      // --- NEW: Reveal the banner and hint after data is loaded ---
      const banner = document.getElementById('menu-page-banner');
      const hint = document.getElementById('product-details-hint');

      if (banner) {
        banner.classList.remove('skeleton', 'skeleton-banner');
        banner.classList.add('loaded');
      }
      if (hint) {
        hint.classList.remove('skeleton');
        hint.classList.add('loaded');
      }
      // --- END OF NEW CODE ---
    },
    error: (err) => {
      console.error("CSV parse error:", err);
      const currentLang = document.documentElement.lang;
      const errorMessages = {
        en: "Failed to fetch data! Please reload the page.",
        ar: "فشل في جلب البيانات! يرجى إعادة تحميل الصفحة"
      };
      const message = errorMessages[currentLang] || errorMessages.en;
      document.getElementById("product-list").innerHTML = `<p class="error-message">${message}</p>`;
      if (menuContent) menuContent.classList.remove('noscroll');
    },
  });
}

function renderAll() {
  if (!groupedData) return;
  const lang = document.documentElement.lang || 'en';
  renderTabs(groupedData, lang);
  renderProducts(groupedData, lang);
  if (typeof initScrollSpy === "function") setTimeout(initScrollSpy, 100);
}

function renderTabs(data, lang) {
  const tabsContainer = document.getElementById("tabs-container");
  tabsContainer.innerHTML = "";
  Object.keys(data).forEach((catId, i) => {
    const sample = data[catId][0];
    const label = lang === "ar" ? sample.cat_ar : sample.cat_en;
    const link = document.createElement("a");
    link.className = "tab-btn";
    if (i === 0) link.classList.add("active");
    link.textContent = label;
    link.href = `#${catId}`;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const categoryId = e.currentTarget.href.split('#')[1];
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (isTouchDevice) {
        const section = document.getElementById(categoryId);
        const container = document.querySelector('.menu-content');
        const tabsContainer = document.querySelector('.menu-tabs');
        if (section && container) {
          const offset = (tabsContainer ? tabsContainer.offsetHeight : 50) + 20;
          const targetY = section.offsetTop - offset;
          window.isProgrammaticScroll = true;
          if (typeof setActiveTab === 'function') setActiveTab(categoryId);
          container.scrollTo({ top: targetY, behavior: "auto" });
          setTimeout(() => { window.isProgrammaticScroll = false; }, 300);
        }
      } else {
        if (typeof scrollToCategory === 'function') scrollToCategory(categoryId);
      }
    });
    tabsContainer.append(link);
  });
}

/**
 * Renders product cards with conditional logic for offer prices.
 */
function renderProducts(data, lang) {
  const list = document.getElementById("product-list");
  list.innerHTML = "";
  list.className = 'product-list menu-items-container';
  Object.entries(data).forEach(([catId, items]) => {
    const section = document.createElement("section");
    section.id = catId;
    section.className = "category-section";
    const sample = items[0];
    const title = lang === "ar" ? sample.cat_ar : sample.cat_en;
    const iconUrl = sample.img_url;
    const headerDiv = document.createElement("div");
    headerDiv.className = "category-header";
    headerDiv.innerHTML = `<img src="${iconUrl}" alt="${title}" class="category-icon" /><h2>${title}</h2>`;
    section.append(headerDiv);
    const productsDiv = document.createElement("div");
    productsDiv.className = "products";
    items.forEach((r) => {
      const name = lang === "ar" ? r.item_ar : r.item_en;
      const card = document.createElement("div");
      card.className = "product-card product-item";

      // Add all data attributes for the bottom sheet
      card.setAttribute('data-name-en', r.item_en ?? '');
      card.setAttribute('data-name-ar', r.item_ar ?? '');
      card.setAttribute('data-ingredients-en', r.ingredients_en ?? '');
      card.setAttribute('data-ingredients-ar', r.ingredients_ar ?? '');
      card.setAttribute('data-calories', r.calories ?? '-');
      card.setAttribute('data-fat', r.fat_g ?? '-');
      card.setAttribute('data-carbs', r.carbs_g ?? '-');
      card.setAttribute('data-protein', r.protein_g ?? '-');
      card.setAttribute('data-caffeine', r.caffeine_mg ?? '-');
      card.setAttribute('data-price', r.price ?? '-');
      // --- NEW: Add the offer price to the dataset as well ---
      card.setAttribute('data-offer', r.offer ?? '-');

      // --- MODIFIED: Conditional price rendering logic ---
      let priceHTML = '';
      const originalPrice = r.price;
      const offerPrice = r.offer;

      // Check if offerPrice exists and is not a placeholder like '-'
      if (offerPrice && offerPrice.trim() !== '' && offerPrice.trim() !== '-') {
        // If there's an offer, show both prices
        priceHTML = `
          <span class="original-price">${originalPrice}</span>
          <span class="offer-price">${offerPrice}</span>
        `;
      } else {
        // If there's no offer, show only the original price
        priceHTML = `${originalPrice}`;
      }

      card.innerHTML = `
        <div class="product-info">
            <h3>${name}</h3>
        </div>
        <div class="product-price">
            ${priceHTML}
        </div>
      `;
      // --- END OF MODIFICATION ---

      productsDiv.append(card);
    });
    section.append(productsDiv);
    list.append(section);
  });
}


// =============================================
// --- NUTRITION BOTTOM SHEET LOGIC (with Offer Price) ---
// =============================================
function initProductSheetLogic() {
  const sheetLabels = {
    en: { ingredients: "Ingredients", nutrition: "Nutritional Facts", calories: "Calories", fat: "Fat", carbs: "Carbs", protein: "Protein", caffeine: "Caffeine" },
    ar: { ingredients: "المكونات", nutrition: "القيم الغذائية", calories: "السعرات الحرارية", fat: "الدهون", carbs: "الكربوهيدرات", protein: "البروتين", caffeine: "الكافيين" }
  };
  const menuContainer = document.getElementById('product-list');
  const sheet = document.getElementById('nutrition-sheet');
  const overlay = document.getElementById('nutrition-overlay');
  const closeBtn = document.getElementById('close-sheet-btn');

  if (!menuContainer || !sheet || !overlay || !closeBtn) return;

  const productNameEl = document.getElementById('sheet-product-name');
  const productPriceEl = document.getElementById('sheet-product-price');
  const ingredientsWrapperEl = document.getElementById('sheet-ingredients-wrapper');
  const productIngredientsEl = document.getElementById('sheet-product-ingredients');
  const nutritionListEl = document.getElementById('sheet-nutrition-list');
  const ingredientsTitleEl = document.querySelector('.sheet-ingredients h4');
  const nutritionTitleEl = document.querySelector('.sheet-nutrition h4');

  const openSheet = (productData) => {
    const lang = document.documentElement.lang || 'en';
    const labels = sheetLabels[lang];

    // Populate product name
    productNameEl.textContent = productData[lang === 'ar' ? 'nameAr' : 'nameEn'] || productData.nameEn;

    // --- START OF MODIFICATION: Conditional Price and Offer Display ---
    const originalPrice = productData.price;
    const offerPrice = productData.offer;

    // Check if a valid offer price exists
    if (offerPrice && offerPrice.trim() !== '' && offerPrice.trim() !== '-') {
      // If there's an offer, show both prices using the same CSS classes
      productPriceEl.innerHTML = `
        <span class="original-price">${originalPrice}</span>
        <span class="offer-price">${offerPrice} LE</span>
      `;
      productPriceEl.style.display = 'block';
    } else if (originalPrice && originalPrice.trim() !== '' && originalPrice.trim() !== '-') {
      // If there's no offer, show only the original price
      productPriceEl.innerHTML = `${originalPrice} LE`;
      productPriceEl.style.display = 'block';
    } else {
      // If no price at all, hide the element
      productPriceEl.style.display = 'none';
    }
    // --- END OF MODIFICATION ---

    // Conditionally show/hide ingredients
    const ingredientsText = productData[lang === 'ar' ? 'ingredientsAr' : 'ingredientsEn'] || '';
    if (ingredientsText && ingredientsText.trim() !== '' && ingredientsText.trim() !== '-') {
      ingredientsWrapperEl.style.display = 'block';
      productIngredientsEl.textContent = ingredientsText;
      ingredientsTitleEl.textContent = labels.ingredients;
    } else {
      ingredientsWrapperEl.style.display = 'none';
    }

    // Populate nutrition list
    nutritionTitleEl.textContent = labels.nutrition;
    nutritionListEl.innerHTML = '';
    const nutritionData = [
      { label: labels.calories, value: productData.calories }, { label: labels.fat, value: productData.fat },
      { label: labels.carbs, value: productData.carbs }, { label: labels.protein, value: productData.protein },
      { label: labels.caffeine, value: productData.caffeine }
    ];

    nutritionData.forEach(item => {
      const li = document.createElement('li');
      let unit = '';
      if (item.value !== '-' && item.value) {
        const currentLang = document.documentElement.lang || 'en';
        switch (item.label) {
          case labels.fat:
          case labels.carbs:
          case labels.protein:
            unit = currentLang === 'ar' ? ' جم' : ' g';
            break;
          case labels.caffeine:
            unit = currentLang === 'ar' ? ' ملجم' : ' mg';
            break;
        }
      }
      const valueDisplay = item.value === '-' || !item.value ? '-' : `${item.value}${unit}`;
      li.innerHTML = `<span class="label">${item.label}</span><span class="value">${valueDisplay}</span>`;
      nutritionListEl.appendChild(li);
    });

    // Show the sheet
    sheet.classList.add('is-open');
    overlay.classList.add('is-open');
    document.body.classList.add('noscroll');
    document.documentElement.classList.add('noscroll');
  };

  const closeSheet = () => {
    sheet.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.classList.remove('noscroll');
    document.documentElement.classList.remove('noscroll');
  };

  menuContainer.addEventListener('click', (event) => {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isMobile) return;
    const productItem = event.target.closest('.product-item');
    if (productItem) {
      event.preventDefault();
      openSheet(productItem.dataset);
    }
  });

  closeBtn.addEventListener('click', closeSheet);
  overlay.addEventListener('click', closeSheet);
}

/**
 * Smooth scrolls to a category. This is for DESKTOP ONLY.
 */
function scrollToCategory(catId) {
  const section = document.getElementById(catId);
  const container = document.querySelector(".menu-content");
  if (!section || !container) return;

  // These global variables are defined in scripts.js, so we access them via the window object
  window.isProgrammaticScroll = true;

  if (typeof setActiveTab === 'function') {
    setActiveTab(catId);
  }

  const tabsContainer = document.querySelector(".menu-tabs");
  const offset = (tabsContainer ? tabsContainer.offsetHeight : 50) + 20;
  const targetY = section.offsetTop - offset;

  container.scrollTo({
    top: targetY,
    behavior: "smooth",
  });

  clearTimeout(window.scrollTimeout);
  window.scrollTimeout = setTimeout(() => {
    window.isProgrammaticScroll = false;
  }, 1000); // 1-second timeout for the animation
}