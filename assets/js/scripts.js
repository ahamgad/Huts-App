// scripts.js - FINAL VERSION (Integrated Path Fixes)

// =============================================
// --- 1. DEFINE THE SITE'S BASE PATH ONCE ---
// =============================================
const isGitHub = window.location.hostname.includes('github.io');
const repoName = '/Huts-App'; // Your repository name
const siteBasePath = isGitHub ? repoName : '';
// On GitHub, siteBasePath will be '/Huts-App'. On Live Server, it will be ''.

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

// --- MODIFIED: includeHTML now uses the dynamic base path ---
function includeHTML() {
  const includeEls = Array.from(document.querySelectorAll("[data-include]"));
  return Promise.all(
    includeEls.map(el => {
      const includePath = siteBasePath + el.getAttribute("data-include");
      return fetch(includePath)
        .then(r => {
          if (!r.ok) throw new Error(`Failed to fetch partial: ${includePath}`);
          return r.text()
        })
        .then(html => el.outerHTML = html)
        .catch(err => console.error(err));
    })
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

// --- MODIFIED: initMenuToggle now contains the robust z-index logic ---
function initMenuToggle() {
  const menuToggle = document.querySelector(".menu-toggle");
  const sideMenu = document.querySelector(".side-menu");

  if (!menuToggle || !sideMenu) return;

  const closeBtn = document.querySelector(".close-menu");
  const themeColorMeta = document.getElementById('theme-color-meta');
  const overlay = document.querySelector(".side-menu-overlay");
  const menuTabs = document.querySelector('.menu-tabs');

  const openMenu = () => {
    sideMenu.classList.add("open");
    if (overlay) overlay.classList.add("open");
    if (themeColorMeta) themeColorMeta.setAttribute('content', '#f8f9fa');
    if (menuTabs) menuTabs.style.zIndex = 'auto'; // Force tabs behind overlay
    trackEvent("Menu_Toggle", { action: "open" });
  };

  const closeMenu = () => {
    sideMenu.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    if (themeColorMeta) themeColorMeta.setAttribute('content', '#ffffff');
    if (menuTabs) menuTabs.style.zIndex = ''; // Restore original z-index
    trackEvent("Menu_Toggle", { action: "close" });
  };

  menuToggle.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (overlay) overlay.addEventListener("click", closeMenu);

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
  // --- الخطوة 1: تأكد من أن هذا المحدد يجد الروابط ---
  // --- الرجاء تعديل '.site-nav a, .side-menu a' إذا لزم الأمر ---
  const navLinks = document.querySelectorAll('.site-nav a, .side-menu a');

  if (navLinks.length === 0) {
    console.error("Highlighting failed: Could not find any navigation links. Please check your CSS selector in highlightActiveMenu().");
    return;
  }

  // --- الخطوة 2: تحديد "معرّف" الصفحة الحالية ---
  // هذا الكود يستخرج آخر جزء من الرابط مثل "menu" أو "mission"
  const pathParts = window.location.pathname.split('/').filter(part => part && part !== 'Huts-App');
  let currentPageIdentifier = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'home';

  // --- الخطوة 3: تحديد من هي الصفحة الرئيسية للقسم الحالي ---
  // (مثال: صفحة "mission" تتبع قسم "games")
  const pageGroups = {
    'games': ['mission', 'spinner'],
    'menu': ['offers']
  };

  let targetIdentifier = currentPageIdentifier;
  for (const mainPage in pageGroups) {
    if (pageGroups[mainPage].includes(currentPageIdentifier)) {
      targetIdentifier = mainPage;
      break;
    }
  }

  // --- الخطوة 4: المرور على كل الروابط وتطبيق كلاس "active" ---
  navLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    let linkIdentifier;

    // تحديد "معرّف" كل رابط
    if (linkHref === '/' || linkHref === 'index.html' || linkHref === './' || linkHref === '/Huts-App/') {
      linkIdentifier = 'home';
    } else {
      // استخراج المعرف من روابط مثل "menu/" أو "games/"
      linkIdentifier = linkHref.replace(/\/$/, "").split("/").pop();
    }

    // المقارنة النهائية
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
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        this.classList.add("copied");
        setTimeout(() => { this.classList.remove("copied"); }, 1000);
      })
      .catch(err => console.error("فشل في نسخ النص: ", err));
  });
});

function initBackButton() {
  const backBtn = document.getElementById('back-btn');
  if (!backBtn) return;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isHomePage = document.body.classList.contains('is-homepage');
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
  const isHomePage = document.body.classList.contains('is-homepage');
  if (isTouchDevice && !isHomePage) {
    logoText.classList.add('hidden-on-mobile');
  }
}

// --- BOOT SEQUENCE ---
window.addEventListener("DOMContentLoaded", () => {
  // Check for homepage and add class
  const homePath = siteBasePath + '/';
  const homePathWithIndex = siteBasePath + '/index.html';
  if (window.location.pathname === homePath || window.location.pathname === homePathWithIndex) {
    document.body.classList.add('is-homepage');
  }

  includeHTML().then(() => {
    // Fetch translations using the base path
    fetch(`${siteBasePath}/assets/i18n/translations.json`)
      .then(res => res.json())
      .then(data => {
        allTranslations = data;
        applyTranslations();
      })
      .catch(err => console.error("Error loading translations:", err));

    // --- NEW: This function no longer needed as paths are now corrected by JS ---
    // adjustPathsForGitHubPages(); 

    // Initialize all modules
    initLanguageToggle();
    initMenuToggle();
    initIframeSkeletons();
    initBackButton();
    initLogoTextVisibility();
    highlightActiveMenu();

    if (document.querySelector(".menu-content")) {
      initScrollSpy();
      initManualScrollDetection();
      if (typeof loadMenuData === "function") {
        loadMenuData();
      }
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