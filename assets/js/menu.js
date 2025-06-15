// menu.js

let groupedData = null;

/**
 * Renders a skeleton loading state to give immediate feedback to the user.
 */
function renderSkeletonLoader() {
  const tabsContainer = document.getElementById("tabs-container");
  const productList = document.getElementById("product-list");

  // Clear any previous content
  tabsContainer.innerHTML = "";
  productList.innerHTML = "";

  // 1. Render skeleton tabs
  for (let i = 0; i < 5; i++) {
    const skeletonTab = document.createElement("div");
    skeletonTab.className = "skeleton skeleton-tab";
    tabsContainer.appendChild(skeletonTab);
  }

  // 2. Render skeleton product sections
  for (let i = 0; i < 3; i++) {
    // Create 3 placeholder categories
    const section = document.createElement("div");
    section.className = "skeleton-section";

    const header = document.createElement("div");
    header.className = "skeleton-cat-header";
    header.innerHTML = `
      <div class="skeleton icon"></div>
      <div class="skeleton text"></div>
    `;
    section.appendChild(header);

    const productsDiv = document.createElement("div");
    productsDiv.className = "products";
    for (let j = 0; j < 3; j++) {
      // Create 3 placeholder products per category
      const product = document.createElement("div");
      product.className = "skeleton skeleton-product";
      productsDiv.appendChild(product);
    }
    section.appendChild(productsDiv);
    productList.appendChild(section);
  }
}

/**
 * Fetches your published Sheet CSV and initializes menu rendering.
 * It now shows a skeleton loader first.
 */
function loadMenuData() {
  // ---> NEW: Call skeleton loader immediately upon function start.
  renderSkeletonLoader();

  const SHEET_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vROZEd2FRFZXsGihkUTQPCpBXMwwkMwBioYoemaBX1P8XYWhUQqpw4yA8s4E-plSlbPAxeb5i3bkFEU/pub?gid=0&single=true&output=csv";

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
      // This will now replace the skeleton with the real data.
      renderAll();
    },
    error: (err) => {
      console.error("CSV parse error:", err);
      // Optional: Display an error message to the user
      document.getElementById(
        "product-list"
      ).innerHTML = `<p>Failed to load menu. Please try again later.</p>`;
    },
  });
}

/**
 * Re-render tabs and products, and then re-initialize the scroll spy.
 * This is the central function for any menu updates.
 */
function renderAll() {
  if (!groupedData) return;
  renderTabs(groupedData);
  renderProducts(groupedData);

  // After rendering the products and creating the new sections,
  // re-initialize the scroll spy to make sure it watches the new elements.
  // We use a small timeout to ensure the DOM has fully updated.
  if (typeof initScrollSpy === "function") {
    setTimeout(initScrollSpy, 0);
  }
}

/** Renders category tabs under the header */
function renderTabs(data) {
  const tabsContainer = document.getElementById("tabs-container");
  tabsContainer.innerHTML = "";
  Object.keys(data).forEach((catId, i) => {
    const sample = data[catId][0];
    const label = userLang === "ar" ? sample.cat_ar : sample.cat_en;
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    if (i === 0) {
      btn.classList.add("active");
    }
    btn.textContent = label;
    btn.dataset.cat = catId;
    btn.addEventListener("click", () => {
      setActiveTab(catId);
      scrollToCategory(catId);
    });
    tabsContainer.append(btn);
  });
}

/** Renders product cards under each category */
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
    headerDiv.innerHTML = `
      <img src="${iconUrl}" alt="${title}" class="category-icon" />
      <h2>${title}</h2>
    `;
    section.append(headerDiv);

    const productsDiv = document.createElement("div");
    productsDiv.className = "products";
    items.forEach((r) => {
      const name = userLang === "ar" ? r.item_ar : r.item_en;
      const price = r.price;
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <h3>${name}</h3>
        <p>${price}</p>
      `;
      productsDiv.append(card);
    });

    section.append(productsDiv);
    list.append(section);
  });
}

/**
 * Smooth scroll to category on tab click.
 */
function scrollToCategory(catId) {
  const section = document.getElementById(catId);
  const container = document.querySelector(".menu-content");
  if (!section || !container) return;

  const tabsContainer = document.querySelector(".menu-tabs");
  const offset = tabsContainer ? tabsContainer.offsetHeight : 50;
  const targetY = section.offsetTop - offset;

  isProgrammaticScroll = true;

  container.scrollTo({
    top: targetY,
    behavior: "smooth",
  });

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isProgrammaticScroll = false;
  }, 1000);
}

// Expose globals
window.loadMenuData = loadMenuData;
window.renderAll = renderAll;
