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

    if (typeof window.redrawSpinnerView === "function") {
      window.redrawSpinnerView();
    }

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

/**
 * Adjusts navigation links for GitHub Pages deployment by adding the repo name prefix.
 */
function adjustLinksForGitHubPages() {
  const isGitHub = window.location.hostname.includes('github.io');
  if (!isGitHub) return; // Do nothing if we're on a different server (like Live Server)

  const repoName = '/Huts-App'; // Your repository name
  const navLinks = document.querySelectorAll('.site-nav a, .side-menu a');

  navLinks.forEach(link => {
    const currentHref = link.getAttribute('href');
    // Only add the prefix if it's a root-relative link and doesn't have it already
    if (currentHref.startsWith('/') && !currentHref.startsWith(repoName)) {
      link.setAttribute('href', repoName + currentHref);
    }
  });
}

function highlightActiveMenu() {
  // 1. Define which sub-pages belong to which main navigation link
  const pageGroups = {
    'menu': ['offers'], // The 'offers' page should highlight the 'menu' link
    'games': ['mission', 'spinner'] // 'mission' or 'spinner' page highlights the 'games' link
    // Add other groups here if needed
  };

  // 2. Get a clean identifier for the CURRENT page
  const currentPath = window.location.pathname;
  // This gets the last part of the URL (e.g., "menu", "mission", or "Huts-App" for the homepage on GitHub)
  let currentPageIdentifier = currentPath.replace(/\/$/, "").split("/").pop();

  // Normalize the homepage identifier to be consistent
  if (currentPageIdentifier === 'Huts-App' || currentPageIdentifier === '') {
    currentPageIdentifier = 'home';
  }

  // 3. Determine the final target to highlight
  //    (e.g., if we are on the "mission" page, the target should become "games")
  let targetIdentifier = currentPageIdentifier;
  for (const mainPage in pageGroups) {
    if (pageGroups[mainPage].includes(currentPageIdentifier)) {
      targetIdentifier = mainPage; // Set the target to the main page of the group
      break;
    }
  }

  // 4. Loop through all navigation links to find the match
  document.querySelectorAll(".site-nav a, .side-menu a").forEach(link => {
    // 5. Get a clean identifier for EACH LINK
    // We use the full href to handle both local and deployed environments correctly
    const linkPath = new URL(link.href).pathname;
    let linkIdentifier = linkPath.replace(/\/$/, "").split("/").pop();

    // Normalize the homepage link's identifier
    if (linkIdentifier === 'Huts-App' || linkIdentifier === '') {
      linkIdentifier = 'home';
    }

    // In the HTML for the homepage link, we use href="/".
    // This results in an empty identifier, so we handle it explicitly.
    // The link to the homepage should point to "/" in the header.html partial.
    // e.g., <a href="/">Home</a>
    if (link.getAttribute('href') === '/') {
      linkIdentifier = 'home';
    }


    // 6. Compare the page's target identifier with the link's identifier
    if (linkIdentifier === targetIdentifier) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
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
        this.blur();
        setTimeout(() => {
          this.classList.remove("copied");
        }, 1000);
      })
      .catch(err => {
        console.error("فشل في نسخ النص: ", err);
        this.blur();
      });
  });
});

function initBackButton() {
  const backBtn = document.getElementById('back-btn');
  if (!backBtn) return;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isHomePage = document.querySelector('.home-content');
  if (isTouchDevice && !isHomePage) {
    backBtn.classList.add('visible');
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.history.back();
    });
  }
}

function initLogoTextVisibility() {
  const logoText = document.querySelector('.logo-text');
  if (!logoText) return;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isHomePage = document.querySelector('.home-content');
  if (isTouchDevice && !isHomePage) {
    logoText.classList.add('hidden-on-mobile');
  }
}

// --- BOOT SEQUENCE ---
window.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname === '/Huts-App/' || window.location.pathname === '/Huts-App/index.html' || window.location.pathname === '/') {
    document.body.classList.add('is-homepage');
  }

  includeHTML().then(() => {
    // ==================================================================
    // --- START OF FIX: Dynamic path for translations.json ---
    // ==================================================================

    // Determine the correct base path depending on the page depth.
    // This works for both Live Server (root is '/') and GitHub Pages (root is '/Huts-App/').
    const pathSegments = window.location.pathname.split('/').filter(segment => segment).length;
    const isGitHubPages = window.location.hostname.includes('github.io');

    // On GitHub, a sub-page has more than 1 segment. On Live Server, a sub-page has more than 0 segments.
    const isSubPage = isGitHubPages ? pathSegments > 1 : pathSegments > 0;
    const basePath = isSubPage ? '../' : '';

    fetch(`${basePath}assets/i18n/translations.json`)
      .then(res => res.json())
      .then(data => {
        allTranslations = data;
        applyTranslations();
      })
      .catch(err => console.error("Error loading translations:", err));

    // ==================================================================
    // --- END OF FIX ---
    // ==================================================================

    adjustLinksForGitHubPages();
    initLanguageToggle();
    highlightActiveMenu();
    initMenuToggle();
    initIframeSkeletons();
    initBackButton();
    initLogoTextVisibility();

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
  if (event.persisted) {
    console.log('Page restored from bfcache. Checking for state updates.');
    const sideMenu = document.querySelector('.side-menu');
    const themeColorMeta = document.getElementById('theme-color-meta');
    if (sideMenu && sideMenu.classList.contains('open')) {
      sideMenu.classList.remove('open');
    }
    if (themeColorMeta && themeColorMeta.getAttribute('content') !== '#ffffff') {
      themeColorMeta.setAttribute('content', '#ffffff');
    }
    const savedLang = localStorage.getItem("preferredLanguage") || (navigator.language.startsWith("ar") ? "ar" : "en");
    const currentLang = document.documentElement.lang;
    if (savedLang !== currentLang) {
      console.log(`Language mismatch on cached page. Applying '${savedLang}'.`);
      userLang = savedLang;
      applyDirection();
      applyTranslations();
      if (typeof window.redrawSpinnerView === "function") {
        window.redrawSpinnerView();
      }
      const langToggleBtn = document.getElementById('lang-toggle');
      if (langToggleBtn) {
        langToggleBtn.innerHTML = userLang === "ar" ? "English" : "العربية";
      }
    }
  }
});