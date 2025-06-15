// scripts.js

// --- GA EVENT TRACKING FUNCTION ---
/**
 * Sends a custom event to Google Analytics.
 * @param {string} eventName - The name of the event (e.g., 'CTA_Click').
 * @param {object} eventParams - An object of parameters to send with the event.
 */
function trackEvent(eventName, eventParams) {
  if (typeof gtag === "function") {
    gtag("event", eventName, eventParams);
  } else {
    console.warn(
      "gtag function not found. Google Analytics may not be loaded."
    );
  }
}
// --- END GA EVENT TRACKING FUNCTION ---

// Check localStorage for a saved language. If not found, default to browser language.
let userLang =
  localStorage.getItem("preferredLanguage") ||
  (navigator.language.startsWith("ar") ? "ar" : "en");
let allTranslations = {};

// Global flag to track programmatic scrolling
let isProgrammaticScroll = false;
let scrollTimeout;
// Global variable to hold the observer instance so we can disconnect it later.
let intersectionObserver = null;

/**
 * Loads the correct Google Form iframe based on the form type and selected language.
 * @param {string} formType - Can be 'feedback' or 'events'.
 */
function loadDynamicForm(formType) {
  if (typeof userLang === "undefined") {
    setTimeout(() => loadDynamicForm(formType), 50);
    return;
  }

  const allFormUrls = {
    feedback: {
      en: "https://docs.google.com/forms/d/e/1FAIpQLSeDA06uIWEJXVzE08R3Rt-JXR0q3tTRPkLz9EDqWy2ij7-cTA/viewform?embedded=true",
      ar: "https://docs.google.com/forms/d/e/1FAIpQLSeDaUsupuH_a4kEbHDtwScl-Y2ng6b99giwxZ3XO13f0fpRng/viewform?embedded=true&hl=ar&lc=ar",
    },
    events: {
      en: "https://docs.google.com/forms/d/e/1FAIpQLScTzbj_af4mSKBIxKmJ10cQfBPApFMSqNt-YcOsEv7xbC8Thw/viewform?embedded=true",
      ar: "https://docs.google.com/forms/d/e/1FAIpQLSdVv-KaO3PH43K0FPbLoOk-eHgPQc1-4c6kpwhCWBVsdi4Bhw/viewform?embedded=true&hl=ar&lc=ar",
    },
  };

  const wrapperId = `${formType}-wrapper`;
  const formWrapper = document.getElementById(wrapperId);

  if (formWrapper) {
    // Find if an iframe already exists to remove it before adding a new one (for language toggle)
    const existingIframe = formWrapper.querySelector("iframe");
    if (existingIframe) {
      existingIframe.remove();
    }
    // Reset the loaded state when toggling language
    formWrapper.classList.remove("loaded");

    const formUrls = allFormUrls[formType];
    const selectedFormUrl = formUrls[userLang] || formUrls.en;

    const iframe = document.createElement("iframe");

    // Add event listener to detect when the iframe content has loaded
    iframe.addEventListener("load", () => {
      // Add 'loaded' class to the wrapper to trigger the CSS for fade-in
      formWrapper.classList.add("loaded");
    });

    // Set the src to start the loading process
    iframe.src = selectedFormUrl;
    // Append the new iframe. It will be invisible due to CSS until loaded.
    formWrapper.appendChild(iframe);
  }
}

/**
 * NEW: Initializes skeleton loading for any iframe within a .iframe-container
 * that has a data-src attribute.
 */
function initIframeSkeletons() {
  const containers = document.querySelectorAll(".iframe-container");
  containers.forEach((container) => {
    const iframe = container.querySelector("iframe");
    // Process only if iframe exists and has a data-src
    if (iframe && iframe.dataset.src) {
      iframe.addEventListener("load", () => {
        container.classList.add("loaded");
      });
      // Start loading by moving data-src to src
      iframe.src = iframe.dataset.src;
    }
  });
}

/**
 * Marks the given tab active and scrolls it into the horizontal view.
 * @param {string} catId - The ID of the category to make active.
 */
function setActiveTab(catId) {
  // Deactivate all tabs first to ensure a clean state.
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Activate the correct one.
  const activeBtn = document.querySelector(`.tab-btn[data-cat="${catId}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");

    // The scrollIntoView is back, but with 'auto' behavior to prevent conflict.
    activeBtn.scrollIntoView({
      behavior: "auto", // Changed from "smooth" to "auto"
      inline: "center",
      block: "nearest",
    });
  }
}

/**
 * Scroll-spy: Initializes an IntersectionObserver to watch the .category-section
 * elements and updates the active tab accordingly. This version is optimized
 * for cross-browser compatibility, especially Safari.
 */
function initScrollSpy() {
  const container = document.querySelector(".menu-content");
  if (!container) return;

  // Before creating a new observer, disconnect the old one if it exists.
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  const sections = document.querySelectorAll(".category-section");
  if (sections.length === 0) return;

  const tabsContainer = document.querySelector(".menu-tabs");
  const topOffset = (tabsContainer ? tabsContainer.offsetHeight : 50) + 5;

  const observerOptions = {
    root: container,
    rootMargin: `-${topOffset}px 0px -85% 0px`,
    threshold: 0,
  };

  intersectionObserver = new IntersectionObserver((entries) => {
    if (isProgrammaticScroll) {
      return;
    }

    const intersectingEntries = entries.filter((e) => e.isIntersecting);

    if (intersectingEntries.length > 0) {
      const activeEntry = intersectingEntries[intersectingEntries.length - 1];
      const id = activeEntry.target.id;
      setActiveTab(id);
    }
  }, observerOptions);

  sections.forEach((section) => intersectionObserver.observe(section));
}

function includeHTML() {
  const includeEls = Array.from(document.querySelectorAll("[data-include]"));
  return Promise.all(
    includeEls.map((el) =>
      fetch(el.getAttribute("data-include"))
        .then((r) => r.text())
        .then((html) => (el.outerHTML = html))
        .catch((err) => console.error("Include failed:", err))
    )
  );
}

function applyTranslations() {
  const dict = allTranslations[userLang] || {};
  document.querySelectorAll("[data-i18n-key]").forEach((el) => {
    const key = el.getAttribute("data-i18n-key");
    if (dict[key]) el.textContent = dict[key];
  });
}

function applyDirection() {
  document.documentElement.lang = userLang;
  document.documentElement.dir = userLang === "ar" ? "rtl" : "ltr";
}

function initLanguageToggle() {
  const btn = document.getElementById("lang-toggle");
  if (!btn) return;
  btn.innerHTML = userLang === "ar" ? "English" : "العربية";
  applyDirection();
  btn.addEventListener("click", () => {
    userLang = userLang === "en" ? "ar" : "en";

    localStorage.setItem("preferredLanguage", userLang);

    applyTranslations();
    applyDirection();
    btn.innerHTML = userLang === "ar" ? "English" : "العربية";

    // Handle menu page re-render
    if (typeof window.renderAll === "function") {
      window.renderAll();
    }

    // Handle feedback form re-render
    if (document.getElementById("feedback-wrapper")) {
      loadDynamicForm("feedback");
    }

    // Handle events form re-render
    if (document.getElementById("events-wrapper")) {
      loadDynamicForm("events");
    }

    trackEvent("Language_Toggle", { language_to: userLang });
  });
}

function initMenuToggle() {
  const menuToggle = document.querySelector(".menu-toggle");
  const sideMenu = document.querySelector(".side-menu");
  const closeBtn = document.querySelector(".close-menu");
  if (!menuToggle || !sideMenu || !closeBtn) return;
  menuToggle.addEventListener("click", () => {
    sideMenu.classList.add("open");
    trackEvent("Menu_Toggle", { action: "open" });
  });
  closeBtn.addEventListener("click", () => {
    sideMenu.classList.remove("open");
    trackEvent("Menu_Toggle", { action: "close" });
  });
  document.addEventListener("click", (e) => {
    if (
      sideMenu.classList.contains("open") &&
      !sideMenu.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      sideMenu.classList.remove("open");
    }
  });
}

function highlightActiveMenu() {
  // 1. الحصول على اسم الصفحة الحالية
  const page = window.location.pathname.split("/").pop() || "index.html";

  // 2. تعريف مجموعات الصفحات
  const menuPages = ["menu.html", "offers.html"];
  const gamesPages = ["games.html", "mission.html", "spinner.html"];

  // 3. تحديد الرابط المستهدف الذي يجب أن يكون "active"
  let target;

  if (menuPages.includes(page)) {
    // إذا كانت الصفحة الحالية ضمن مجموعة "المنيو"
    target = "menu.html";
  } else if (gamesPages.includes(page)) {
    // إذا كانت الصفحة الحالية ضمن مجموعة "الألعاب"
    target = "games.html";
  } else {
    // لأي صفحة أخرى، يكون الهدف هو اسم الصفحة نفسها
    target = page;
  }

  // 4. المرور على كل الروابط في القائمة وتطبيق كلاس "active" على الرابط الصحيح
  document.querySelectorAll(".site-nav a, .side-menu a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === target);
  });
}

// 1. استهداف "كل" الأزرار التي تحمل الكلاس
const copyButtons = document.querySelectorAll(".copy-button");

// 2. المرور على كل زر تم إيجاده باستخدام حلقة forEach
copyButtons.forEach((button) => {
  // 3. إضافة مستمع الأحداث (event listener) "لكل زر على حدة"
  button.addEventListener("click", function (event) {
    // منع السلوك الافتراضي لتاج الـ <a>
    event.preventDefault();

    // استهداف النص الذي نريد نسخه من داخل "هذا الزر" الذي تم النقر عليه
    const textToCopy = this.querySelector(".text-to-copy").innerText;

    // استخدام واجهة المتصفح الحديثة للنسخ
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        // --- عند نجاح النسخ ---

        // أضف كلاس 'copied' "لهذا الزر" لتغيير شكله
        this.classList.add("copied");

        // بعد 3 ثوانٍ، قم بإزالة الكلاس ليعود "هذا الزر" لحالته الأصلية
        setTimeout(() => {
          this.classList.remove("copied");
        }, 1000); // 3000 ميلي ثانية = 3 ثواني
      })
      .catch((err) => {
        console.error("فشل في نسخ النص: ", err);
        alert("حدث خطأ، لم يتم نسخ النص.");
      });
  });
});

// Boot sequence
window.addEventListener("DOMContentLoaded", () => {
  includeHTML().then(() => {
    fetch("assets/i18n/translations.json")
      .then((res) => res.json())
      .then((data) => {
        allTranslations = data;
        applyTranslations();
      })
      .catch((err) => console.error("Error loading translations:", err));

    initLanguageToggle();
    highlightActiveMenu();
    initMenuToggle();
    initIframeSkeletons(); // Added this call for static iframes like the map

    if (typeof loadMenuData === "function") {
      loadMenuData();
    } else {
      initScrollSpy();
    }

    // Load correct form based on page
    if (document.getElementById("feedback-wrapper")) {
      loadDynamicForm("feedback");
    }
    if (document.getElementById("events-wrapper")) {
      loadDynamicForm("events");
    }
  });
});