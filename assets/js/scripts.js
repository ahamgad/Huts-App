// scripts.js

// --- GA EVENT TRACKING FUNCTION ---
function trackEvent(eventName, eventParams) {
  if (typeof gtag === "function") {
    gtag("event", eventName, eventParams);
  } else {
    console.warn("gtag function not found. Google Analytics may not be loaded.");
  }
}

// --- UTILITY FUNCTIONS ---
/**
 * Throttle function to limit the rate at which a function gets called.
 * This is better for scroll events than debounce.
 * @param {Function} func The function to throttle.
 * @param {number} limit The throttle limit in milliseconds.
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}


// --- GLOBAL VARIABLES ---
let userLang = localStorage.getItem("preferredLanguage") || (navigator.language.startsWith("ar") ? "ar" : "en");
let allTranslations = {};
let isProgrammaticScroll = false;
let scrollTimeout;


// --- CORE FUNCTIONS ---

function loadDynamicForm(formType) {
  // ... (This function remains unchanged)
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
    const existingIframe = formWrapper.querySelector("iframe");
    if (existingIframe) existingIframe.remove();
    formWrapper.classList.remove("loaded");
    const formUrls = allFormUrls[formType];
    const selectedFormUrl = formUrls[userLang] || formUrls.en;
    const iframe = document.createElement("iframe");
    iframe.addEventListener("load", () => formWrapper.classList.add("loaded"));
    iframe.src = selectedFormUrl;
    formWrapper.appendChild(iframe);
  }
}

function initIframeSkeletons() {
  // ... (This function remains unchanged)
  document.querySelectorAll(".iframe-container").forEach(container => {
    const iframe = container.querySelector("iframe");
    if (iframe && iframe.dataset.src) {
      iframe.addEventListener("load", () => container.classList.add("loaded"));
      iframe.src = iframe.dataset.src;
    }
  });
}

function setActiveTab(catId) {
  // ... (This function remains unchanged)
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.tab-btn[data-cat="${catId}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
  }
}

// --- NEW SCROLL HANDLING LOGIC (REPLACES initScrollSpy) ---
function initScrollHandler() {
  const container = document.querySelector(".menu-content");
  if (!container) return;

  const sections = document.querySelectorAll(".category-section");
  if (sections.length === 0) return;

  const tabsContainer = document.querySelector(".menu-tabs");
  const topOffset = (tabsContainer ? tabsContainer.offsetHeight : 50) + 10;

  const handleScroll = () => {
    // If a programmatic scroll is happening, do nothing.
    if (isProgrammaticScroll) return;

    let currentSectionId = sections[0].id;

    // Find which section is currently at the top of the viewport
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop <= topOffset) {
        currentSectionId = section.id;
      }
    });

    setActiveTab(currentSectionId);
  };

  // Use the throttle utility to prevent the function from firing too often
  const throttledHandleScroll = throttle(handleScroll, 100);
  container.addEventListener('scroll', throttledHandleScroll);
}
// --- END OF NEW SCROLL HANDLING LOGIC ---


function initManualScrollDetection() {
  const container = document.querySelector(".menu-content");
  if (!container) return;
  const handleManualScroll = () => { isProgrammaticScroll = false; };
  container.addEventListener('wheel', handleManualScroll, { passive: true });
  container.addEventListener('touchstart', handleManualScroll, { passive: true });
}

function includeHTML() {
  // ... (This function remains unchanged)
  const includeEls = Array.from(document.querySelectorAll("[data-include]"));
  return Promise.all(
    includeEls.map(el =>
      fetch(el.getAttribute("data-include"))
        .then(r => r.text())
        .then(html => el.outerHTML = html)
        .catch(err => console.error("Include failed:", err))
    )
  );
}

function applyTranslations() {
  // ... (This function remains unchanged)
  const dict = allTranslations[userLang] || {};
  document.querySelectorAll("[data-i18n-key]").forEach(el => {
    const key = el.getAttribute("data-i18n-key");
    if (dict[key]) el.textContent = dict[key];
  });
}

function applyDirection() {
  // ... (This function remains unchanged)
  document.documentElement.lang = userLang;
  document.documentElement.dir = userLang === "ar" ? "rtl" : "ltr";
}

function initLanguageToggle() {
  // ... (This function remains unchanged)
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
    if (typeof window.renderAll === "function") window.renderAll();
    if (document.getElementById("feedback-wrapper")) loadDynamicForm("feedback");
    if (document.getElementById("events-wrapper")) loadDynamicForm("events");
    trackEvent("Language_Toggle", { language_to: userLang });
  });
}

function initMenuToggle() {
  // ... (This function remains unchanged)
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
  document.addEventListener("click", e => {
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
  // ... (This function remains unchanged)
  const page = window.location.pathname.split("/").pop() || "index.html";
  const menuPages = ["menu.html", "offers.html"];
  const gamesPages = ["games.html", "mission.html", "spinner.html"];
  let target;
  if (menuPages.includes(page)) {
    target = "menu.html";
  } else if (gamesPages.includes(page)) {
    target = "games.html";
  } else {
    target = page;
  }
  document.querySelectorAll(".site-nav a, .side-menu a").forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === target);
  });
}

const copyButtons = document.querySelectorAll(".copy-button");
copyButtons.forEach(button => {
  // ... (This function remains unchanged)
  button.addEventListener("click", function (event) {
    event.preventDefault();
    const textToCopy = this.querySelector(".text-to-copy").innerText;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        this.classList.add("copied");
        setTimeout(() => this.classList.remove("copied"), 1000);
      })
      .catch(err => console.error("فشل في نسخ النص: ", err));
  });
});

// Boot sequence
window.addEventListener("DOMContentLoaded", () => {
  includeHTML().then(() => {
    fetch("assets/i18n/translations.json")
      .then(res => res.json())
      .then(data => {
        allTranslations = data;
        applyTranslations();
      })
      .catch(err => console.error("Error loading translations:", err));

    initLanguageToggle();
    highlightActiveMenu();
    initMenuToggle();
    initIframeSkeletons();

    // Initialize scroll-related functions for the menu page
    if (document.querySelector(".menu-content")) {
      // THE NEW LOGIC IS CALLED HERE, REPLACING initScrollSpy
      initScrollHandler();
      initManualScrollDetection();
    }

    // Load menu data if the function exists
    if (typeof loadMenuData === "function") {
      loadMenuData();
    }

    // Load dynamic forms if their wrappers exist
    if (document.getElementById("feedback-wrapper")) loadDynamicForm("feedback");
    if (document.getElementById("events-wrapper")) loadDynamicForm("events");
  });
});