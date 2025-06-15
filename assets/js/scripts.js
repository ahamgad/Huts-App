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
 * Initializes skeleton loading for any iframe within a .iframe-container
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
 * This is the version that restores the original tab scrolling behavior.
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

    // The scrollIntoView is back, with 'auto' behavior to prevent conflict.
    activeBtn.scrollIntoView({
      behavior: "auto",
      inline: "center",
      block: "nearest",
    });
  }
}

/**
 * Scroll-spy: Initializes an IntersectionObserver to watch the .category-section
 * elements and updates the active tab accordingly.
 */
function initScrollSpy() {
  const container = document.querySelector(".menu-content");
  if (!container) return;

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

/**
 * NEW: This function detects when a user starts scrolling manually and
 * immediately resets the programmatic scroll flag.
 */
function initManualScrollDetection() {
  const container = document.querySelector(".menu-content");
  if (!container) return;

  // This handler will be called the moment the user interacts.
  const handleManualScroll = () => {
    isProgrammaticScroll = false;
  };

  // Listen for mouse wheel or touch start to immediately cancel the flag.
  container.addEventListener('wheel', handleManualScroll, { passive: true });
  container.addEventListener('touchstart', handleManualScroll, { passive: true });
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
    if (typeof window.renderAll === "function") window.renderAll();
    if (document.getElementById("feedback-wrapper")) loadDynamicForm("feedback");
    if (document.getElementById("events-wrapper")) loadDynamicForm("events");
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
  document.querySelectorAll(".site-nav a, .side-menu a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === target);
  });
}

const copyButtons = document.querySelectorAll(".copy-button");
copyButtons.forEach((button) => {
  button.addEventListener("click", function (event) {
    event.preventDefault();
    const textToCopy = this.querySelector(".text-to-copy").innerText;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        this.classList.add("copied");
        setTimeout(() => {
          this.classList.remove("copied");
        }, 1000);
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
    initIframeSkeletons();

    // Initialize scroll-related functions for the menu page
    if (document.querySelector(".menu-content")) {
      initScrollSpy();
      initManualScrollDetection(); // <-- The new function is called here
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