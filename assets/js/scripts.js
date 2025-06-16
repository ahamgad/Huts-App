// scripts.js

// --- GA EVENT TRACKING FUNCTION ---
function trackEvent(eventName, eventParams) {
  if (typeof gtag === "function") {
    gtag("event", eventName, eventParams);
  } else {
    console.warn("gtag function not found. Google Analytics may not be loaded.");
  }
}

// --- GLOBAL VARIABLES ---
let userLang = localStorage.getItem("preferredLanguage") || (navigator.language.startsWith("ar") ? "ar" : "en");
let allTranslations = {};
let isProgrammaticScroll = false;
let scrollTimeout;
let intersectionObserver = null;

// --- CORE FUNCTIONS ---

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
  document.querySelectorAll(".iframe-container").forEach(container => {
    const iframe = container.querySelector("iframe");
    if (iframe && iframe.dataset.src) {
      iframe.addEventListener("load", () => container.classList.add("loaded"));
      iframe.src = iframe.dataset.src;
    }
  });
}

function setActiveTab(catId) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`a.tab-btn[href="#${catId}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
  }
}

function initScrollSpy() {
  const container = document.querySelector(".menu-content");
  if (!container) return;
  if (intersectionObserver) intersectionObserver.disconnect();
  const sections = document.querySelectorAll(".category-section");
  if (sections.length === 0) return;
  const tabsContainer = document.querySelector(".menu-tabs");
  const topOffset = (tabsContainer ? tabsContainer.offsetHeight : 50) + 5;
  const observerOptions = {
    root: container,
    rootMargin: `-${topOffset}px 0px -85% 0px`,
    threshold: 0,
  };
  intersectionObserver = new IntersectionObserver(entries => {
    if (isProgrammaticScroll) return;
    const intersectingEntries = entries.filter(e => e.isIntersecting);
    if (intersectingEntries.length > 0) {
      const activeEntry = intersectingEntries[intersectingEntries.length - 1];
      setActiveTab(activeEntry.target.id);
    }
  }, observerOptions);
  sections.forEach(section => intersectionObserver.observe(section));
}

function initManualScrollDetection() {
  const container = document.querySelector(".menu-content");
  if (!container) return;
  const handleManualScroll = () => { isProgrammaticScroll = false; };
  container.addEventListener('wheel', handleManualScroll, { passive: true });
  container.addEventListener('touchstart', handleManualScroll, { passive: true });
}

function includeHTML() {
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
  const dict = allTranslations[userLang] || {};
  document.querySelectorAll("[data-i18n-key]").forEach(el => {
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
  const themeColorMeta = document.getElementById('theme-color-meta');

  if (!menuToggle || !sideMenu || !closeBtn) return;

  const openMenu = () => {
    sideMenu.classList.add("open");
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', '#f8f9fa');
    }
    trackEvent("Menu_Toggle", { action: "open" });
  };

  const closeMenu = () => {
    sideMenu.classList.remove("open");
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', '#ffffff');
    }
    trackEvent("Menu_Toggle", { action: "close" });
  };

  menuToggle.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", closeMenu);

  document.addEventListener("click", (e) => {
    if (
      sideMenu.classList.contains("open") &&
      !sideMenu.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      closeMenu();
    }
  });

  const sideMenuLinks = sideMenu.querySelectorAll('a');
  sideMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const destination = e.currentTarget.href;
      closeMenu();
      setTimeout(() => {
        window.location.href = destination;
      }, 300);
    });
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
  document.querySelectorAll(".site-nav a, .side-menu a").forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === target);
  });
}

const copyButtons = document.querySelectorAll(".copy-button");
copyButtons.forEach(button => {
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

function initBackButton() {
  const backBtn = document.getElementById('back-btn');
  if (!backBtn) return;
  const isHomePage = document.querySelector('.home-content');
  if (!isHomePage) {
    backBtn.classList.add('visible');
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.history.back();
    });
  }
}

// --- NEW: FUNCTION FOR PAGE TRANSITIONS ON MOBILE ---
function initPageTransitions() {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // 1. Only run this logic on mobile devices
  if (!isTouchDevice) {
    return;
  }

  // 2. Add the class to the body to trigger the initial fade-in animation
  document.body.classList.add('transition-fade');

  // 3. Find all navigational links that don't open in a new tab and are not on-page anchors
  const navLinks = document.querySelectorAll('a[href]:not([href^="#"]):not([target="_blank"])');

  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      const destination = this.getAttribute('href');

      // Prevent the browser from navigating immediately
      e.preventDefault();

      // Apply the fade-out animation by directly setting the style
      document.body.style.animation = 'fadeOutPage 0.4s ease-out forwards';

      // After the animation finishes, navigate to the new page
      setTimeout(() => {
        window.location.href = destination;
      }, 400); // This duration should match the animation duration in CSS
    });
  });
}

// --- BOOT SEQUENCE ---
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
    initBackButton();

    // Call the new page transition function
    initPageTransitions();

    if (document.querySelector(".menu-content")) {
      initScrollSpy();
      initManualScrollDetection();
    }
    if (typeof loadMenuData === "function") {
      loadMenuData();
    }
    if (document.getElementById("feedback-wrapper")) loadDynamicForm("feedback");
    if (document.getElementById("events-wrapper")) loadDynamicForm("events");
  });
});

// --- PAGE STATE CORRECTION ON BACK/FORWARD NAVIGATION ---
window.addEventListener('pageshow', function (event) {
  // event.persisted is true if the page was loaded from the bfcache.
  if (event.persisted) {
    console.log('Page restored from bfcache. Checking for state updates.');

    // --- FIX 1: Side Menu State ---
    const sideMenu = document.querySelector('.side-menu');
    const themeColorMeta = document.getElementById('theme-color-meta');
    if (sideMenu && sideMenu.classList.contains('open')) {
      sideMenu.classList.remove('open');
    }
    if (themeColorMeta && themeColorMeta.getAttribute('content') !== '#ffffff') {
      themeColorMeta.setAttribute('content', '#ffffff');
    }

    // --- FIX 2: Language State ---
    const savedLang = localStorage.getItem("preferredLanguage") || (navigator.language.startsWith("ar") ? "ar" : "en");
    const currentLang = document.documentElement.lang;

    if (savedLang !== currentLang) {
      console.log(`Language mismatch on cached page. Applying '${savedLang}'.`);
      userLang = savedLang; // Update the global variable
      applyDirection();
      applyTranslations();

      // Also update the language toggle button text
      const langToggleBtn = document.getElementById('lang-toggle');
      if (langToggleBtn) {
        langToggleBtn.innerHTML = userLang === "ar" ? "English" : "العربية";
      }
    }
  }
});