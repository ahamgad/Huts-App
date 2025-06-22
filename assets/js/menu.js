// menu.js

let groupedData = null;

/**
 * Renders a skeleton loading state.
 */
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

/**
 * Fetches and parses the CSV data from Google Sheets.
 * It now prevents scrolling and hides the footer while loading.
 */
function loadMenuData() {
  const menuContent = document.querySelector('.menu-content');
  if (menuContent) {
    menuContent.classList.add('noscroll');
  }

  renderSkeletonLoader();

  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vROZEd2FRFZXsGihkUTQPCpBXMwwkMwBioYoemaBX1P8XYWhUQqpw4yA8s4E-plSlbPAxeb5i3bkFEU/pub?gid=0&single=true&output=csv";

  Papa.parse(SHEET_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      groupedData = {};
      results.data.forEach((r) => {
        if (!groupedData[r.category_id]) groupedData[r.category_id] = [];
        groupedData[r.category_id].push(r);
      });
      renderAll();

      // --- جديد: إظهار الفوتر بعد عرض المحتوى ---
      const footer = document.querySelector('.menu-page-footer');
      if (footer) {
        // نستخدم 'flex' لأن هذا هو نوع العرض الافتراضي للفوتر في ملف CSS
        footer.style.display = 'flex';
      }
      // ------------------------------------

      if (menuContent) {
        menuContent.classList.remove('noscroll');
      }
    },
    error: (err) => {
      console.error("CSV parse error:", err);

      // 1. تحديد لغة الموقع الحالية من الوسم <html>
      const currentLang = document.documentElement.lang;

      // 2. تعريف رسائل الخطأ باللغتين
      const errorMessages = {
        en: "Failed to fetch data! Please reload the page.",
        ar: "فشل في جلب البيانات! يرجى إعادة تحميل الصفحة"
      };

      // 3. اختيار الرسالة المناسبة بناءً على اللغة (مع وضع الإنجليزية كخيار افتراضي)
      const message = errorMessages[currentLang] || errorMessages.en;

      // 4. عرض الرسالة المختارة في الصفحة
      document.getElementById("product-list").innerHTML = `<p class="error-message">${message}</p>`;

      if (menuContent) {
        menuContent.classList.remove('noscroll');
      }
    },
  });
}

/**
 * Main render function. Now it also re-initializes the scroll spy.
 */
function renderAll() {
  if (!groupedData) return;
  renderTabs(groupedData);
  renderProducts(groupedData);
  if (typeof initScrollSpy === "function") {
    setTimeout(initScrollSpy, 100);
  }
}

/**
 * Renders category tabs with conditional logic for click events.
 */
function renderTabs(data) {
  const tabsContainer = document.getElementById("tabs-container");
  tabsContainer.innerHTML = "";
  Object.keys(data).forEach((catId, i) => {
    const sample = data[catId][0];
    const label = userLang === "ar" ? sample.cat_ar : sample.cat_en;

    const link = document.createElement("a");
    link.className = "tab-btn";
    if (i === 0) {
      link.classList.add("active");
    }
    link.textContent = label;
    link.href = `#${catId}`;

    link.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default jump to control behavior

      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const categoryId = e.currentTarget.href.split('#')[1];

      if (isTouchDevice) {
        // --- MOBILE BEHAVIOR: Instant Jump with Offset ---
        const section = document.getElementById(categoryId);
        const container = document.querySelector('.menu-content');
        const tabsContainer = document.querySelector('.menu-tabs');

        if (section && container) {
          const offset = (tabsContainer ? tabsContainer.offsetHeight : 50) + 20;
          const targetY = section.offsetTop - offset;

          isProgrammaticScroll = true;
          setActiveTab(categoryId);

          container.scrollTo({
            top: targetY,
            behavior: "auto"
          });

          setTimeout(() => { isProgrammaticScroll = false; }, 300);
        }
      } else {
        // --- DESKTOP BEHAVIOR: Smooth Scroll ---
        scrollToCategory(categoryId);
      }
    });

    tabsContainer.append(link);
  });
}

/**
 * Renders product cards (this function remains the same).
 */
function renderProducts(data) {
  const list = document.getElementById("product-list");
  list.innerHTML = "";
  Object.entries(data).forEach(([catId, items]) => {
    const section = document.createElement("section");
    section.id = catId;
    section.className = "category-section";
    const sample = items[0];
    const title = userLang === "ar" ? sample.cat_ar : sample.cat_en;
    const iconUrl = sample.img_url;
    const headerDiv = document.createElement("div");
    headerDiv.className = "category-header";
    headerDiv.innerHTML = `<img src="${iconUrl}" alt="${title}" class="category-icon" /><h2>${title}</h2>`;
    section.append(headerDiv);
    const productsDiv = document.createElement("div");
    productsDiv.className = "products";
    items.forEach((r) => {
      const name = userLang === "ar" ? r.item_ar : r.item_en;
      const price = r.price;
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `<h3>${name}</h3><p>${price}</p>`;
      productsDiv.append(card);
    });
    section.append(productsDiv);
    list.append(section);
  });
}

/**
 * Smooth scrolls to a category. This is now for DESKTOP ONLY.
 */
function scrollToCategory(catId) {
  const section = document.getElementById(catId);
  const container = document.querySelector(".menu-content");
  if (!section || !container) return;

  isProgrammaticScroll = true;
  setActiveTab(catId);

  const tabsContainer = document.querySelector(".menu-tabs");
  const offset = (tabsContainer ? tabsContainer.offsetHeight : 50) + 20;
  const targetY = section.offsetTop - offset;

  container.scrollTo({
    top: targetY,
    behavior: "smooth",
  });

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isProgrammaticScroll = false;
  }, 1000); // 1-second timeout for the animation
}

// Expose globals for other scripts
window.loadMenuData = loadMenuData;
window.renderAll = renderAll;