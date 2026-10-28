/* TipTheory interactions only. Page content and sections remain authored in HTML. */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const body = document.body;
  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const safeGet = (key, fallback = null) => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  };
  const safeSet = (key, value) => {
    try { localStorage.setItem(key, value); } catch (_) {}
  };
  const safeJSON = (key, fallback = []) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed ?? fallback;
    } catch (_) { return fallback; }
  };
  const safeSetJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };
  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  };

  /* Year */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* Theme: CSS is keyed to body.dark, so toggle that exact class. */
  const themeButton = $("#theme-toggle, #themeToggle");
  function setTheme(theme) {
    const dark = theme === "dark";
    body.classList.toggle("dark", dark);
      root.dataset.theme = dark ? "dark" : "light";
    root.style.colorScheme = dark ? "dark" : "light";
    if (themeButton) {
      themeButton.innerHTML = dark
        ? '<i data-lucide="sun"></i>'
        : '<i data-lucide="moon"></i>';
      themeButton.setAttribute("aria-pressed", String(dark));
      themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      themeButton.title = dark ? "Switch to light mode" : "Switch to dark mode";
    }
    safeSet("tiptheory-theme", dark ? "dark" : "light");
    refreshIcons();
  }
  setTheme(safeGet("tiptheory-theme", "light") === "dark" ? "dark" : "light");
  themeButton?.addEventListener("click", () => {
    setTheme(body.classList.contains("dark") ? "light" : "dark");
  });

  /* RTL/LTR: set direction on html and body; layout uses logical CSS properties. */
 const rtlButton = $("#rtl-toggle, #rtlToggle");
  function setDirection(direction) {
  const dir = direction === "rtl" ? "rtl" : "ltr";

  root.setAttribute("dir", dir);
  body.setAttribute("dir", dir);
  body.classList.toggle("is-rtl", dir === "rtl");
  body.classList.toggle("is-ltr", dir === "ltr");

  if (rtlButton) {
    rtlButton.setAttribute("aria-pressed", String(dir === "rtl"));
    rtlButton.setAttribute(
      "aria-label",
      dir === "rtl" ? "Switch to left-to-right layout" : "Switch to right-to-left layout"
    );
    rtlButton.title = dir === "rtl" ? "Switch to LTR" : "Switch to RTL";
  }

  safeSet("tiptheory-direction", dir);
}

setDirection(safeGet("tiptheory-direction", "ltr") === "rtl" ? "rtl" : "ltr");

rtlButton?.addEventListener("click", () => {
  setDirection(root.getAttribute("dir") === "rtl" ? "ltr" : "rtl");
});

  /* Mobile navigation */
  const mobileToggle = $("#mobile-toggle");
  const nav = $("#primary-nav");
  const homeMenu = $("#home-menu");
  const homeMenuButton = $("#home-menu-button");
  function closeMobileNav() {
    nav?.classList.remove("open");
    mobileToggle?.setAttribute("aria-expanded", "false");
    if (mobileToggle) mobileToggle.innerHTML = '<i data-lucide="menu"></i>';
    refreshIcons();
  }
  mobileToggle?.addEventListener("click", () => {
    if (!nav) return;
    const open = nav.classList.toggle("open");
    mobileToggle.setAttribute("aria-expanded", String(open));
    mobileToggle.innerHTML = open ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    refreshIcons();
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMobileNav));

  /* Home dropdown */
  function closeHomeMenu() {
    homeMenu?.classList.remove("open");
    homeMenuButton?.setAttribute("aria-expanded", "false");
  }
  homeMenuButton?.addEventListener("click", event => {
    event.preventDefault();
    const open = homeMenu?.classList.toggle("open") ?? false;
    homeMenuButton.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", event => {
    if (homeMenu && !homeMenu.contains(event.target)) closeHomeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeHomeMenu();
      closeMobileNav();
    }
  });

  /* Reveal animations: enhance existing HTML sections without generating content. */
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  $$("#main .section:not(.hero), #main .page-hero, #main .premium-strip, #main .premium-quote, #main .premium-cta")
    .forEach((element, index) => {
      element.classList.add("reveal");
      if (index % 3 === 1) element.classList.add("delay-1");
      if (index % 3 === 2) element.classList.add("delay-2");
    });
  const revealItems = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(item => item.classList.add("visible"));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 30px 0px" });
    revealItems.forEach(item => observer.observe(item));
  }

  /* Gallery filters */
  const filterButtons = $$("[data-filter]");
  const galleryItems = $$("[data-category]");
  filterButtons.forEach(button => {
    button.setAttribute("aria-pressed", String(button.classList.contains("active")));
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      galleryItems.forEach(card => {
        card.hidden = filter !== "all" && card.dataset.category !== filter;
      });
    });
  });

  /* Service preselection from URL */
  const queryService = new URLSearchParams(location.search).get("service");
  const serviceSelect = $("#service");
  if (queryService && serviceSelect) {
    const option = [...serviceSelect.options].find(item =>
      item.value.toLowerCase() === queryService.toLowerCase() ||
      item.textContent.trim().toLowerCase() === queryService.toLowerCase()
    );
    if (option) serviceSelect.value = option.value;
  }

  /* Toast: use the existing HTML toast element only. */
  let toastTimer;
  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
  }

  /* Demo forms: browser-side validation only. */
  $$(".demo-form").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      $(".form-success", form)?.classList.add("show");
      showToast("Form validated. Connect a backend to receive submissions.");
      form.reset();
    });
  });
  $$('input[type="date"]').forEach(input => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    input.min = local.toISOString().slice(0, 10);
  });

  /* Favourites */
  function getFavourites() {
    const value = safeJSON("tiptheory-favourites", []);
    return Array.isArray(value) ? value : [];
  }
  $$(".favorite-btn, [data-favorite]").forEach(button => {
    const key = button.dataset.favorite || button.dataset.id ||
      button.closest("[data-product-id]")?.dataset.productId ||
      button.getAttribute("aria-label") || button.textContent.trim();
    const update = active => {
      button.classList.toggle("is-favourite", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", active ? "Remove from favourites" : "Add to favourites");
      const icon = $("[data-lucide]", button);
      if (icon) icon.setAttribute("data-lucide", active ? "heart" : "heart");
      refreshIcons();
    };
    update(getFavourites().includes(key));
    button.addEventListener("click", () => {
      const saved = getFavourites();
      const active = !saved.includes(key);
      const next = active ? [...saved, key] : saved.filter(item => item !== key);
      safeSetJSON("tiptheory-favourites", next);
      update(active);
      showToast(active ? "Added to favourites." : "Removed from favourites.");
    });
  });

  /* Nail shape and colour selectors */
  $$("[data-shape], [data-nail-shape], [data-nail-color], [data-nail-colour], [data-color-swatch], [data-colour-swatch]")
    .forEach(control => {
      const shape = control.hasAttribute("data-shape") || control.hasAttribute("data-nail-shape");
      const selector = shape ? "[data-shape], [data-nail-shape]" :
        "[data-nail-color], [data-nail-colour], [data-color-swatch], [data-colour-swatch]";
      const group = control.closest("[data-selector-group], .selector-group, .shape-options, .colour-options, .color-options") || control.parentElement;
      control.setAttribute("aria-pressed", String(control.classList.contains("active") || control.classList.contains("selected")));
      control.addEventListener("click", () => {
        group?.querySelectorAll(selector).forEach(item => {
          const selected = item === control;
          item.classList.toggle("active", selected);
          item.classList.toggle("selected", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
        const choice = control.dataset.shape || control.dataset.nailShape || control.dataset.nailColor ||
          control.dataset.nailColour || control.dataset.colorSwatch || control.dataset.colourSwatch;
        const output = $("[data-selection-output]");
        if (output && choice) output.textContent = choice;
        const color = control.dataset.nailColor || control.dataset.nailColour ||
          control.dataset.colorSwatch || control.dataset.colourSwatch;
        const preview = $("[data-nail-preview]");
        if (preview && color) {
          const candidate = CSS.supports("color", color) ? color : `#${color.replace(/^#/, "")}`;
          if (CSS.supports("color", candidate)) preview.style.setProperty("--nail-preview-color", candidate);
        }
      });
    });

  /* FAQ accordions */
  $$("[data-accordion-trigger], .faq-question, .accordion-trigger").forEach(trigger => {
    trigger.addEventListener("click", () => {
      const panelId = trigger.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : trigger.nextElementSibling;
      if (!panel) return;
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
      panel.classList.toggle("open", !expanded);
    });
  });

  /* Image zoom */
  $$("[data-lightbox] img, img[data-lightbox], [data-image-zoom]").forEach(target => {
    const image = target.matches("img") ? target : $("img", target);
    if (!image) return;
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", "Toggle image zoom");
    const toggle = () => image.classList.toggle("is-zoomed");
    image.addEventListener("click", toggle);
    image.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  /* Back to top */
  $$("#back-to-top, [data-back-to-top]").forEach(button => {
    const update = () => button.classList.toggle("visible", window.scrollY > 360);
    window.addEventListener("scroll", update, { passive: true });
    update();
    button.addEventListener("click", () => window.scrollTo({
      top: 0, behavior: reduceMotion ? "auto" : "smooth"
    }));
  });

  /* Avoid browser horizontal drift caused by focus/zoom transitions */
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 1024) {
      // Keep the responsive nav state under the user's control.
      if (!nav?.classList.contains("open")) nav?.setAttribute("aria-hidden", "true");
      else nav?.removeAttribute("aria-hidden");
    } else {
      nav?.removeAttribute("aria-hidden");
    }
  }, { passive: true });

  refreshIcons();
});

/* ==========================================
   TIPTHEORY — CINEMATIC HERO MOUSE PARALLAX
   Add this at the end of js/app.js
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const hero = document.querySelector(".hero-home.luxury-hero");

    if (!hero) return;

    const image = hero.querySelector(".luxury-hero-image");

    if (!image) return;

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const desktopPointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    ).matches;

    if (reduceMotion || !desktopPointer) return;

    let animationFrame = null;

    hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();

        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }

        animationFrame = requestAnimationFrame(() => {
            image.style.transform =
                `scale(1.045) translate(${-x * 14}px, ${-y * 10}px)`;
        });
    });

    hero.addEventListener("pointerleave", () => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }

        image.style.transform = "";
    });
});

/* TipTheory — Interactive Nail Shape Selection */
document.addEventListener("DOMContentLoaded", () => {
    const shapeCards = document.querySelectorAll(
        ".shape-section .shape-card"
    );

    shapeCards.forEach((card) => {
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-pressed", "false");

        function selectShape() {
            shapeCards.forEach((item) => {
                item.classList.remove("is-selected");
                item.setAttribute("aria-pressed", "false");
            });

            card.classList.add("is-selected");
            card.setAttribute("aria-pressed", "true");
        }

        card.addEventListener("click", selectShape);

        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectShape();
            }
        });
    });
});
/* ==========================================
   TIPTHEORY HOME — SCROLL REVEAL CONTROLLER
========================================== */

(() => {
  const initTipTheoryReveals = () => {
    const home = document.querySelector('body[data-page="home1"]');

    if (!home) return;

    const main = home.querySelector("#main");
    if (!main) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    const sections = [...main.querySelectorAll(":scope > section")];

    sections.forEach((section, sectionIndex) => {
      /* Preserve the hero's existing layout and entrance animation */
      if (section.classList.contains("luxury-hero")) {
        return;
      }

      const heading = section.querySelector(
        "h2, .section-title, .section-heading"
      );

      if (heading) {
        heading.classList.add("tt-reveal", "tt-heading");
      }

      /* Reveal section content with varied directions */
      const contentItems = section.querySelectorAll(
        ".container > *, .section-inner > *, .section-content > *"
      );

      contentItems.forEach((item, index) => {
        if (
          item.matches("script, style") ||
          item.closest(".tt-reveal")
        ) {
          return;
        }

        if (item.matches("h2, .section-title, .section-heading")) {
          return;
        }

        const hasImage = item.matches("img, picture") ||
          item.querySelector("img");

        item.classList.add("tt-reveal");

        if (hasImage) {
          item.classList.add("tt-image-reveal");
        } else {
          const direction = (index + sectionIndex) % 4;

          if (direction === 0) item.classList.add("tt-fade-up");
          if (direction === 1) item.classList.add("tt-fade-left");
          if (direction === 2) item.classList.add("tt-fade-right");
          if (direction === 3) item.classList.add("tt-zoom-in");
        }
      });

      /* Animate cards in sequence */
      const cardGroups = section.querySelectorAll(
        ".services-grid, .gallery-grid, .features-grid, " +
        ".cards-grid, .service-cards, .gallery-preview-grid"
      );

      cardGroups.forEach((group) => {
        group.classList.add("tt-stagger");

        [...group.children].forEach((card, index) => {
          card.classList.add("tt-reveal", "tt-fade-up");

          if (index > 0) {
            card.style.animationDelay =
              `${Math.min(index * 120, 480)}ms`;
          }
        });
      });

      /* Give images a gentle hover zoom */
      section.querySelectorAll("img").forEach((img) => {
        const parent = img.parentElement;

        if (parent && !parent.classList.contains("tt-image-hover")) {
          parent.classList.add("tt-image-hover");
        }
      });

      /* Add subtle lift to common cards */
      section.querySelectorAll(
        ".service-card, .gallery-card, .feature-card, " +
        ".design-card, .treatment-card"
      ).forEach((card) => {
        card.classList.add("tt-hover-card");
      });
    });

    const revealItems = main.querySelectorAll(".tt-reveal");

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => {
        item.classList.add("tt-visible");
        item.style.opacity = "1";
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("tt-visible");
        } else {
          entry.target.classList.remove("tt-visible");
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -35px 0px"
    });

    revealItems.forEach((item) => observer.observe(item));
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initTipTheoryReveals,
      { once: true }
    );
  } else {
    initTipTheoryReveals();
  }
})();



/* TipTheory Home 2 — interactive hero depth */
(() => {
    const hero = document.querySelector(".home2-creative-hero");

    if (!hero) return;

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    const left = hero.querySelector(".h2-arch-left");
    const right = hero.querySelector(".h2-arch-right");

    let frame = null;

    hero.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "mouse") return;

        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        hero.style.setProperty("--pointer-x", `${x * 100}%`);
        hero.style.setProperty("--pointer-y", `${y * 100}%`);
        hero.classList.add("h2-pointer-active");

        if (frame) cancelAnimationFrame(frame);

        frame = requestAnimationFrame(() => {
            if (left) {
                left.style.translate =
                    `${(x - 0.5) * -12}px ${(y - 0.5) * -8}px`;
                left.classList.add("h2-depth-active");
            }

            if (right) {
                right.style.translate =
                    `${(x - 0.5) * 12}px ${(y - 0.5) * 8}px`;
                right.classList.add("h2-depth-active");
            }
        });
    });

    hero.addEventListener("pointerleave", () => {
        hero.classList.remove("h2-pointer-active");

        [left, right].forEach((image) => {
            if (!image) return;
            image.style.translate = "0 0";
            image.classList.remove("h2-depth-active");
        });
    });
    })();
/* ==========================================
   TIPTHEORY HOME 2 — ALL SECTION ANIMATIONS
========================================== */

const home2 = document.querySelector(
    'body[data-page="home2"]'
);

if (home2) {
    const main = home2.querySelector("#main");

    if (main) {
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const sections = [
            ...main.querySelectorAll(":scope > section")
        ];

        const animatedElements = new Set();

        sections.forEach((section, sectionIndex) => {
            // Animate each complete section
            section.classList.add("h2-motion-reveal");
            section.style.setProperty(
                "--motion-delay",
                `${Math.min(sectionIndex * 80, 400)}ms`
            );
            animatedElements.add(section);

            // Animate section headings and introductory content
            const headings = section.querySelectorAll(
                "h1, h2, h3, .h2-section-intro, " +
                ".signature-intro, .h2-section-heading"
            );

            headings.forEach((element, index) => {
                element.classList.add("h2-motion-reveal");
                element.style.setProperty(
                    "--motion-delay",
                    `${index * 70}ms`
                );
                animatedElements.add(element);
            });

            // Animate cards, images, buttons and studio controls
            const items = section.querySelectorAll(
    ".h2-signature-card, .signature-luxe-card, " +
    ".h2-testimonial, .h2-review-row, " +
    ".h2-review-content, .h2-review-number, " +
    ".h2-review-author, .h2-review-arrow, " +
    ".h2-gallery-item, .tt-gallery-card, " +
    ".h2-process-item, .h2-atelier-point, " +
    ".h2-artistry-visual, .h2-artistry-content, " +
    ".h2-design-preview, .h2-design-controls, " +
    ".td-preview-panel, .td-controls-panel, " +
    ".td-shape-option, .td-colour-option, " +
    ".td-finish-option, .td-booking-bar, " +
    ".signature-card-copy, .signature-card-image, " +
    ".signature-bottom, .h2-final-cta-content, " +
    ".h2-final-actions, img"
);

            items.forEach((element, index) => {
                if (animatedElements.has(element)) return;

                element.classList.add("h2-motion-reveal");
                element.style.setProperty(
                    "--motion-delay",
                    `${Math.min(index * 65, 390)}ms`
                );

                animatedElements.add(element);
            });
        });

        // Respect accessibility settings
        if (
            reduceMotion ||
            !("IntersectionObserver" in window)
        ) {
            animatedElements.forEach(element => {
                element.classList.add("h2-motion-visible");
            });
        } else {
            const observer = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add(
                                "h2-motion-visible"
                            );
                            observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    threshold: 0.08,
                    rootMargin: "0px 0px -25px 0px"
                }
            );

            animatedElements.forEach(element => {
                observer.observe(element);
            });
        }
    }
}
    
/* =========================================================
   TIPTHEORY — LIVE NAIL DESIGN STUDIO
   Accurate nail shapes + working Glossy / Matte / Chrome /
   Shimmer finishes. Uses the existing home2.html SVG.
========================================================= */
(() => {
  "use strict";

  function initTipTheoryStudio() {
    const studio = document.getElementById("design-studio");

    if (!studio || studio.dataset.tdReady === "true") return;

    const nail = studio.querySelector("#tdNailShape");
    const clipPath = studio.querySelector("#tdNailClipPath");
    const nailGradient = studio.querySelector("#tdNailGradient");
    const chromeGradient = studio.querySelector("#tdChromeGradient");
    const shimmerGradient = studio.querySelector("#tdShimmerGradient");
    const finishGroup = studio.querySelector("#tdNailFinish");
    const shimmerDetails = studio.querySelector("#tdShimmerDetails");

    const previewFinish = studio.querySelector("#tdPreviewFinish");
    const summaryTitle = studio.querySelector("#tdSummaryTitle");
    const summaryDescription = studio.querySelector("#tdSummaryDescription");
    const summarySwatch = studio.querySelector("#tdSummarySwatch");
    const selectionText = studio.querySelector("#tdSelectionText");
    const previewStage = studio.querySelector(".td-preview-stage");

    if (
      !nail ||
      !clipPath ||
      !nailGradient ||
      !chromeGradient ||
      !finishGroup ||
      !shimmerDetails
    ) {
      console.warn("TipTheory Studio: required SVG elements are missing.");
      return;
    }

    studio.dataset.tdReady = "true";

    const SVG_NS = "http://www.w3.org/2000/svg";

    /*
      All shapes use the same 220 × 390 SVG viewBox.
      Each shape is centred and fits within the preview.
    */
    const shapes = {
      almond: {
        label: "Almond",
        path: `
         M 110 36
          C 78 36, 65 62, 65 102
          L 65 275
          C 65 319, 83 344, 110 344
          C 137 344, 155 319, 155 275
          L 155 102
          C 155 62, 142 36, 110 36
          Z
        `

      },

      oval: {
        label: "Oval",
        path: `
         M 110 27
          C 91 31, 77 53, 72 83
          C 65 126, 68 190, 77 247
          C 84 292, 98 331, 110 350
          C 122 331, 136 292, 143 247
          C 152 190, 155 126, 148 83
          C 143 53, 129 31, 110 27
          Z
        `
         
      },

      square: {
        label: "Square",
        path: `
          M 78 39
          Q 78 32, 86 32
          L 134 32
          Q 142 32, 142 39
          L 142 303
          Q 142 312, 134 312
          L 86 312
          Q 78 312, 78 303
          Z
        `
      },

      coffin: {
        label: "Coffin",
        path: `
          M 87 32
          L 133 32
          L 154 100
          L 141 305
          Q 110 319, 79 305
          L 66 100
          Z
        `
      },

      stiletto: {
        label: "Stiletto",
        path: `
          M 110 22
          L 155 116
          L 145 269
          Q 137 322, 110 350
          Q 83 322, 75 269
          L 65 116
          Z
        `
      }
    };

    const finishes = {
      glossy: {
        label: "Glossy",
        description: "A glass-like shine with bright, smooth reflections."
      },

      matte: {
        label: "Matte",
        description: "A soft, velvety finish with a gentle, muted surface."
      },

      chrome: {
        label: "Chrome",
        description: "A reflective metallic finish with polished silver highlights."
      },

      shimmer: {
        label: "Shimmer",
        description: "A luminous finish with delicate, sparkling particles."
      }
    };

    const defaultState = {
      shape: "almond",
      colour: "#FF477E",
      colourName: "Rose Pink",
      finish: "glossy"
    };

    const state = { ...defaultState };

    const finishHighlightPaths = Array.from(
      finishGroup.querySelectorAll(":scope > path")
    );

    /*
      Keep the original two reflection paths.
      Additional effects are created inside the nail's clipped finish group.
    */
    let shimmerOverlay = finishGroup.querySelector("#tdShimmerOverlay");

    if (!shimmerOverlay) {
      shimmerOverlay = document.createElementNS(SVG_NS, "rect");
      shimmerOverlay.setAttribute("id", "tdShimmerOverlay");
      shimmerOverlay.setAttribute("x", "35");
      shimmerOverlay.setAttribute("y", "20");
      shimmerOverlay.setAttribute("width", "150");
      shimmerOverlay.setAttribute("height", "340");
      shimmerOverlay.setAttribute("fill", "url(#tdShimmerGradient)");
      shimmerOverlay.setAttribute("opacity", "0");
      shimmerOverlay.setAttribute("pointer-events", "none");

      finishGroup.insertBefore(shimmerOverlay, shimmerDetails);
    }

    /*
      Colour helpers
    */
    function hexToRgb(hex) {
      let value = String(hex || "#F1C6B6").replace("#", "").trim();

      if (value.length === 3) {
        value = value.split("").map((char) => char + char).join("");
      }

      if (!/^[0-9a-fA-F]{6}$/.test(value)) {
        value = "F1C6B6";
      }

      return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16)
      };
    }

    function rgbToHex({ r, g, b }) {
      return (
        "#" +
        [r, g, b]
          .map((value) =>
            Math.round(Math.max(0, Math.min(255, value)))
              .toString(16)
              .padStart(2, "0")
          )
          .join("")
      );
    }

    function mixColours(first, second, amount) {
      const a = hexToRgb(first);
      const b = hexToRgb(second);

      return rgbToHex({
        r: a.r + (b.r - a.r) * amount,
        g: a.g + (b.g - a.g) * amount,
        b: a.b + (b.b - a.b) * amount
      });
    }

    function setGradientStops(gradient, stops) {
      if (!gradient) return;

      gradient.replaceChildren();

      stops.forEach((item) => {
        const stop = document.createElementNS(SVG_NS, "stop");

        stop.setAttribute("offset", item.offset);
        stop.setAttribute("stop-color", item.color);

        if (item.opacity !== undefined) {
          stop.setAttribute("stop-opacity", String(item.opacity));
        }

        gradient.appendChild(stop);
      });
    }

    /*
      Generate a different highlight pattern for every selection.
      The particles remain inside the nail because the parent group
      uses clip-path="url(#tdNailClip)".
    */
    function makeShimmer() {
      shimmerDetails.replaceChildren();

      const particleCount = 68;

      for (let i = 0; i < particleCount; i++) {
        const circle = document.createElementNS(SVG_NS, "circle");

        const x = 70 + ((i * 47) % 80);
        const y = 48 + ((i * 61) % 275);
        const radius = i % 8 === 0 ? 2.1 : i % 3 === 0 ? 1.5 : 0.85;

        circle.setAttribute("cx", String(x));
        circle.setAttribute("cy", String(y));
        circle.setAttribute("r", String(radius));
        circle.setAttribute(
          "fill",
          i % 4 === 0 ? "#FFFFFF" : "#FFE4ED"
        );
        circle.setAttribute("opacity", String(0.45 + (i % 5) * 0.1));

        shimmerDetails.appendChild(circle);
      }
    }

    /*
      STEP 1 — Correctly update both the visible nail and clipping shape.
    */
    function updateShape() {
      const selectedShape = shapes[state.shape];

      if (!selectedShape) return;

      nail.setAttribute("d", selectedShape.path);
      clipPath.setAttribute("d", selectedShape.path);

      nail.setAttribute("vector-effect", "non-scaling-stroke");
      nail.setAttribute("stroke-linejoin", "round");
      nail.setAttribute("stroke-linecap", "round");

      const shapeButtons = studio.querySelectorAll(".td-shape-option");

      shapeButtons.forEach((button) => {
        const selected = button.dataset.shape === state.shape;

        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    /*
      STEP 2 — Apply the chosen colour.
      Glossy and matte use the chosen colour; chrome keeps the colour
      as a subtle undertone under the metallic reflections.
    */
    function updateColour() {
      const base = state.colour;
      const light = mixColours(base, "#FFFFFF", 0.52);
      const mid = mixColours(base, "#FFFFFF", 0.12);
      const dark = mixColours(base, "#32131F", 0.22);

      setGradientStops(nailGradient, [
        { offset: "0%", color: light },
        { offset: "28%", color: mid },
        { offset: "60%", color: base },
        { offset: "100%", color: dark }
      ]);

      if (summarySwatch) {
        summarySwatch.style.backgroundColor = base;
      }

      const colourButtons = studio.querySelectorAll(".td-colour-option");

      colourButtons.forEach((button) => {
        const selected = button.dataset.colour === state.colour;

        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    /*
      STEP 3 — Apply genuinely different finish effects.
    */
    function updateFinish() {
      const selectedFinish = finishes[state.finish];

      if (!selectedFinish) return;

      const base = state.colour;

      const glossy = finishHighlightPaths[0];
      const secondary = finishHighlightPaths[1];

      /*
        Reset all finish effects first so selecting a new finish
        never leaves the previous finish's visual effects behind.
      */
      finishHighlightPaths.forEach((path) => {
        path.style.display = "";
        path.setAttribute("fill", "#FFFFFF");
        path.setAttribute("stroke", "none");
      });

      shimmerDetails.setAttribute("opacity", "0");
      shimmerOverlay.setAttribute("opacity", "0");

      nail.style.filter = "url(#tdNailShadow)";
      nail.style.opacity = "1";
      nail.setAttribute("fill", "url(#tdNailGradient)");
      nail.setAttribute("stroke", "#FFE7E4");
      nail.setAttribute("stroke-width", "2.5");

      /*
        Glossy: strong, clean white reflections and a glass-like shine.
      */
      if (state.finish === "glossy") {
        nail.style.filter =
          "url(#tdNailShadow) drop-shadow(0 0 5px rgba(255,190,207,.25))";

        if (glossy) {
          glossy.setAttribute("opacity", "0.76");
        }

        if (secondary) {
          secondary.setAttribute("opacity", "0.48");
          secondary.setAttribute("stroke-width", "4.5");
        }
      }

      /*
        Matte: deliberately remove the bright glossy streaks.
        The nail colour remains visible but with lower contrast.
      */
      if (state.finish === "matte") {
        const matteLight = mixColours(base, "#FFFFFF", 0.25);
        const matteMid = mixColours(base, "#FFFFFF", 0.04);
        const matteDark = mixColours(base, "#3B2028", 0.12);

        setGradientStops(nailGradient, [
          { offset: "0%", color: matteLight },
          { offset: "45%", color: matteMid },
          { offset: "100%", color: matteDark }
        ]);

        nail.style.filter = "saturate(.78) brightness(.98)";

        if (glossy) {
          glossy.setAttribute("opacity", "0.09");
        }

        if (secondary) {
          secondary.setAttribute("opacity", "0.035");
        }
      }

      /*
        Chrome: metallic vertical gradient with sharp silver bands.
        This looks different from glossy, even with the same colour.
      */
      if (state.finish === "chrome") {
        setGradientStops(chromeGradient, [
          { offset: "0%", color: mixColours(base, "#4A2635", 0.5) },
          { offset: "12%", color: "#FFFFFF" },
          { offset: "24%", color: mixColours(base, "#D8C2CB", 0.5) },
          { offset: "36%", color: "#777079" },
          { offset: "47%", color: "#FFFFFF" },
          { offset: "58%", color: mixColours(base, "#C7A3B2", 0.55) },
          { offset: "72%", color: "#FDF9FC" },
          { offset: "86%", color: "#9A7888" },
          { offset: "100%", color: "#523541" }
        ]);

        nail.setAttribute("fill", "url(#tdChromeGradient)");
        nail.setAttribute("stroke", "#FFF0F5");
        nail.style.filter =
          "url(#tdNailShadow) drop-shadow(0 0 4px rgba(255,225,238,.24))";

        if (glossy) {
          glossy.setAttribute("opacity", "0.32");
        }

        if (secondary) {
          secondary.setAttribute("opacity", "0.72");
          secondary.setAttribute("stroke-width", "3.5");
        }
      }

      /*
        Shimmer: coloured nail + visible fine particles + soft sheen.
      */
      if (state.finish === "shimmer") {
        nail.style.filter =
          "url(#tdNailShadow) drop-shadow(0 0 5px rgba(255,221,238,.28))";

        shimmerDetails.setAttribute("opacity", "1");
        shimmerOverlay.setAttribute("opacity", "0.28");

        if (glossy) {
          glossy.setAttribute("opacity", "0.28");
        }

        if (secondary) {
          secondary.setAttribute("opacity", "0.22");
        }
      }

      if (previewFinish) {
        previewFinish.textContent = selectedFinish.label + " finish";
      }

      const finishButtons = studio.querySelectorAll(".td-finish-option");

      finishButtons.forEach((button) => {
        const selected = button.dataset.finish === state.finish;

        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    /*
      STEP 4 — Keep summary text and colour swatch in sync.
    */
    function updateSummary() {
      const shapeLabel = shapes[state.shape].label;
      const finishLabel = finishes[state.finish].label;

      const title =
        `${shapeLabel} · ${state.colourName} · ${finishLabel}`;

      if (summaryTitle) {
        summaryTitle.textContent = title;
      }

      if (selectionText) {
        selectionText.textContent = title;
      }

      if (summaryDescription) {
        summaryDescription.textContent =
          finishes[state.finish].description;
      }

      if (summarySwatch) {
        summarySwatch.style.backgroundColor = state.colour;
      }
    }

    /*
      STEP 5 — Update everything together.
    */
    function updatePreview(animate = true) {
      updateShape();
      updateColour();
      updateFinish();
      updateSummary();

      if (previewStage && animate) {
        previewStage.classList.remove("td-preview-updated");

        // Restart the existing preview animation.
        void previewStage.offsetWidth;

        previewStage.classList.add("td-preview-updated");
      }
    }

    /*
      Read the HTML's initial selections if present.
    */
    function readInitialSelections() {
      const selectedShape = studio.querySelector(
        ".td-shape-option.is-selected[data-shape]"
      );

      const selectedColour = studio.querySelector(
        ".td-colour-option.is-selected[data-colour]"
      );

      const selectedFinish = studio.querySelector(
        ".td-finish-option.is-selected[data-finish]"
      );

      if (selectedShape && shapes[selectedShape.dataset.shape]) {
        state.shape = selectedShape.dataset.shape;
      }

      if (selectedColour) {
        state.colour = selectedColour.dataset.colour || defaultState.colour;
        state.colourName =
          selectedColour.dataset.colourName || defaultState.colourName;
      }

      if (
        selectedFinish &&
        finishes[selectedFinish.dataset.finish]
      ) {
        state.finish = selectedFinish.dataset.finish;
      }
    }

    /*
      Shape controls.
    */
    studio.querySelectorAll(".td-shape-option[data-shape]").forEach(
      (button) => {
        button.addEventListener("click", () => {
          if (!shapes[button.dataset.shape]) return;

          state.shape = button.dataset.shape;
          updatePreview();
        });
      }
    );

    /*
      Colour controls.
    */
    studio.querySelectorAll(".td-colour-option[data-colour]").forEach(
      (button) => {
        button.addEventListener("click", () => {
          const colour = button.dataset.colour;

          if (!colour) return;

          state.colour = colour;
          state.colourName =
            button.dataset.colourName || "Custom Colour";

          updatePreview();
        });
      }
    );

    /*
      Finish controls.
      Each click updates the nail fill, highlights, shimmer and summary.
    */
    studio.querySelectorAll(".td-finish-option[data-finish]").forEach(
      (button) => {
        button.addEventListener("click", () => {
          if (!finishes[button.dataset.finish]) return;

          state.finish = button.dataset.finish;
          updatePreview();
        });
      }
    );

    /*
      Keep booking link accessible and pass the chosen design in its URL.
    */
    const bookingLink = studio.querySelector(".td-book-look");

    function updateBookingLink() {
      if (!bookingLink) return;

      const url = new URL(bookingLink.href, window.location.href);

      url.searchParams.set(
        "nailShape",
        shapes[state.shape].label
      );

      url.searchParams.set("nailColour", state.colourName);
      url.searchParams.set(
        "nailFinish",
        finishes[state.finish].label
      );

      bookingLink.href = url.href;
    }

    /*
      Include the current selection in every live preview update.
    */
    const originalUpdatePreview = updatePreview;

    function refreshPreview() {
      originalUpdatePreview();
      updateBookingLink();
    }

    /*
      Initialise all visual elements and selected states.
    */
    makeShimmer();
    readInitialSelections();

    // Use the same initial render path as subsequent user interactions.
    updatePreview(false);
    updateBookingLink();

    // Add a class that can be used by the existing CSS animation.
    if (previewStage) {
      previewStage.classList.add("td-studio-ready");
    }

    /*
      Replace click handlers with a single consistent refresh path.
      This also ensures booking summary stays in sync.
    */
    studio.querySelectorAll(
      ".td-shape-option[data-shape], " +
      ".td-colour-option[data-colour], " +
      ".td-finish-option[data-finish]"
    ).forEach((button) => {
      button.addEventListener("click", () => {
        // The primary handler updates state synchronously.
        // This handler refreshes the booking URL after that update.
        updateBookingLink();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initTipTheoryStudio,
      { once: true }
    );
  } else {
    initTipTheoryStudio();
  }
})();
/* ==========================================
   TIPTHEORY — SIGNATURE SCROLL REVEAL
========================================== */

(() => {
  function initSignatureScrollReveal() {
    const section = document.querySelector("#signature-edit");
    if (!section) return;

    const intro = section.querySelector(".signature-intro");
    const cards = section.querySelectorAll(".signature-luxe-card");
    const bottom = section.querySelector(".signature-bottom");

    const allTargets = [];

    if (intro) {
      intro.querySelectorAll(
        ".signature-eyebrow, h2, p, .signature-divider"
      ).forEach((element, index) => {
        element.classList.add("tt-scroll-reveal");
        element.style.setProperty("--tt-delay", `${index * 120}ms`);
        allTargets.push(element);
      });
    }

    cards.forEach((card, index) => {
      card.classList.add("tt-scroll-reveal", "tt-card-reveal");
      card.style.setProperty("--tt-delay", `${index * 140}ms`);
      allTargets.push(card);

      const copy = card.querySelector(".signature-card-copy");
      const image = card.querySelector(".signature-card-image");

      if (copy) {
        copy.classList.add("tt-scroll-reveal", "tt-from-left");
        copy.style.setProperty("--tt-delay", `${index * 140 + 150}ms`);
        allTargets.push(copy);
      }

      if (image) {
        image.classList.add("tt-scroll-reveal", "tt-from-right");
        image.style.setProperty("--tt-delay", `${index * 140 + 220}ms`);
        allTargets.push(image);
      }
    });

    if (bottom) {
      bottom.classList.add("tt-scroll-reveal");
      bottom.style.setProperty("--tt-delay", "150ms");
      allTargets.push(bottom);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      allTargets.forEach(element => element.classList.add("tt-scroll-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("tt-scroll-visible");
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -30px 0px"
    });

    allTargets.forEach(element => observer.observe(element));
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initSignatureScrollReveal,
      { once: true }
    );
  } else {
    initSignatureScrollReveal();
  }
})();
/* ==========================================
   TIPTHEORY APPOINTMENT PAGE
   Theme, RTL and form validation
   ========================================== */

(() => {
  function initAppointmentPage() {
    const page = document.querySelector(".appointment-page");

    // Run only on the appointment page
    if (!page) return;

    const root = document.documentElement;
    const themeButton = document.getElementById("themeToggle");
    const rtlButton = document.getElementById("rtlToggle");
    const form = document.getElementById("appointmentForm");
    const dateInput = document.getElementById("date");
    const message = document.getElementById("formMessage");

    function renderIcons() {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }

    renderIcons();

    

    // LOCAL DATE: DISALLOW PAST DATES
    function getLocalDate() {
      const today = new Date();

      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    if (dateInput) {
      dateInput.min = getLocalDate();
    }

    // FORM VALIDATION
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        if (dateInput && dateInput.value < getLocalDate()) {
          showMessage("Please choose today or a future date.", "error");
          dateInput.focus();
          return;
        }

        const formData = new FormData(form);
        const appointmentDetails = Object.fromEntries(formData.entries());

        console.log("Appointment request:", appointmentDetails);

        showMessage(
          "Your details are validated. Appointment submission still needs a backend or email service.",
          "success"
        );
      });

      form.addEventListener("input", clearMessage);
      form.addEventListener("change", clearMessage);
    }

    function showMessage(text, type) {
      if (!message) return;

      message.textContent = text;
      message.className = `form-message ${type}`;
    }

    function clearMessage() {
      if (!message) return;

      message.textContent = "";
      message.className = "form-message";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAppointmentPage, {
      once: true
    });
  } else {
    initAppointmentPage();
  }
})();

/* ==========================================
   TIPTHEORY — LUXURY SPOTLIGHT INTERACTION
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const hero = document.querySelector(".about-editorial-hero");

    if (!hero) return;

    const motionPreference = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const pointerPreference = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    );

    if (motionPreference.matches || !pointerPreference.matches) {
        return;
    }

    let frame = null;

    hero.addEventListener("pointerenter", () => {
        hero.classList.add("luxury-active");
    });

    hero.addEventListener("pointermove", (event) => {
        if (frame !== null) return;

        frame = requestAnimationFrame(() => {
            const bounds = hero.getBoundingClientRect();

            const x = ((event.clientX - bounds.left) / bounds.width) * 100;
            const y = ((event.clientY - bounds.top) / bounds.height) * 100;

            hero.style.setProperty("--spot-x", `${x}%`);
            hero.style.setProperty("--spot-y", `${y}%`);

            frame = null;
        });
    });

    hero.addEventListener("pointerleave", () => {
        hero.classList.remove("luxury-active");
        hero.style.setProperty("--spot-x", "50%");
        hero.style.setProperty("--spot-y", "48%");
    });
});

/* =====================================================
   TIPTHEORY ABOUT — FULL PAGE SCROLL ANIMATIONS
   Home 2 inspired: sections + text + images + cards
===================================================== */
(() => {
    function initTipTheoryAboutMotion() {
        const body = document.body;

        if (!body.classList.contains("page-about")) return;

        const main = document.querySelector("#main.about-main");
        if (!main) return;

        // Prevent duplicate initialization
        if (main.dataset.aboutMotionReady === "true") return;
        main.dataset.aboutMotionReady = "true";

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        // Animate every section, including the hero.
        const sections = [...main.querySelectorAll(":scope > section")];
        const animatedItems = new Set();

        sections.forEach((section, sectionIndex) => {
            section.classList.add("tt-about-motion");
            section.style.setProperty(
                "--tt-about-delay",
                `${Math.min(sectionIndex * 60, 240)}ms`
            );
            animatedItems.add(section);

            // Reveal headings and descriptive text individually.
            const textElements = section.querySelectorAll(
                "h1, h2, h3, p, .about-eyebrow, .care-kicker, " +
                ".about-card-label, .about-card-number, figcaption, " +
                ".about-story-stamp, .about-difference-number"
            );

            textElements.forEach((element, index) => {
                element.classList.add("tt-about-motion");
                element.style.setProperty(
                    "--tt-about-delay",
                    `${Math.min(index * 55, 220)}ms`
                );
                animatedItems.add(element);
            });

            // Reveal images and image wrappers.
            const visualElements = section.querySelectorAll(
                "img, .about-story-visual, .about-purpose-card, " +
                ".about-difference-card, .about-experience-step, " +
                ".about-experience-visual, .care-photo, " +
                ".about-final-content, .about-hero-copy, " +
                ".about-story-copy, .care-heading, " +
                ".about-section-heading, .about-difference-heading, " +
                ".about-experience-heading, .about-purpose-grid, " +
                ".about-difference-grid, .about-experience-layout, " +
                ".care-gallery, .about-final-actions, .about-hero-actions"
            );

            visualElements.forEach((element, index) => {
                element.classList.add("tt-about-motion");
                element.style.setProperty(
                    "--tt-about-delay",
                    `${Math.min(index * 65, 300)}ms`
                );
                animatedItems.add(element);
            });
        });

        // Never leave text hidden if animations are disabled or unsupported.
        if (reduceMotion || !("IntersectionObserver" in window)) {
            animatedItems.forEach(element => {
                element.classList.add("tt-about-visible");
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add("tt-about-visible");
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.06,
            rootMargin: "0px 0px -30px 0px"
        });

        animatedItems.forEach(element => observer.observe(element));

        // Safety fallback: make all content visible if observer setup fails.
        window.setTimeout(() => {
            animatedItems.forEach(element => {
                if (!element.classList.contains("tt-about-visible")) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top < window.innerHeight + 100) {
                        element.classList.add("tt-about-visible");
                    }
                }
            });
        }, 1500);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initTipTheoryAboutMotion,
            { once: true }
        );
    } else {
        initTipTheoryAboutMotion();
    }
})();

/* =====================================================
   TIPTHEORY CONTACT PAGE — COMPLETE ANIMATION SYSTEM
   Add this at the END of js/app.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const main = document.querySelector(
    'body[data-page="contact"] #main'
  );

  if (!main || main.dataset.contactAnimationsReady === "true") {
    return;
  }

  main.dataset.contactAnimationsReady = "true";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  /* Hero: animate tagline, headings, paragraphs and buttons */
  const hero = main.querySelector(".contact-hero");

  if (hero) {
    const heroItems = hero.querySelectorAll(
      ".contact-hero-copy > *, " +
      ".contact-hero-actions, " +
      ".contact-hero-actions > *"
    );

    heroItems.forEach(function (element, index) {
      element.classList.add("tt-contact-animate");

      if (index % 3 === 1) {
        element.classList.add("tt-contact-left");
      } else if (index % 3 === 2) {
        element.classList.add("tt-contact-zoom");
      }

      element.style.setProperty(
        "--tt-contact-delay",
        (index * 130) + "ms"
      );

      element.classList.add("tt-contact-in");
    });
  }

  /* All sections and their content */
  const elements = main.querySelectorAll(
    "section, section h1, section h2, section h3, " +
    "section h4, section p, section span, section small, " +
    "section strong, section label, section li, section a, " +
    "section button, section figure, section img, section form, " +
    "section .contact-eyebrow, section .contact-info-card, " +
    "section .contact-location-row, section .contact-map-wrap, " +
    "section .contact-faq-item, section .contact-form, " +
    "section input, section textarea, section select"
  );

  elements.forEach(function (element, index) {
    if (element.closest(".contact-hero")) return;
    if (element.classList.contains("tt-contact-animate")) return;

    element.classList.add("tt-contact-animate");

    const direction = index % 4;

    if (direction === 1) {
      element.classList.add("tt-contact-left");
    } else if (direction === 2) {
      element.classList.add("tt-contact-right");
    } else if (direction === 3) {
      element.classList.add("tt-contact-zoom");
    }

    element.style.setProperty(
      "--tt-contact-delay",
      ((index % 4) * 100) + "ms"
    );
  });

  const animatedItems = main.querySelectorAll(
    ".tt-contact-animate:not(.tt-contact-in)"
  );

  if (!("IntersectionObserver" in window)) {
    animatedItems.forEach(function (element) {
      element.classList.add("tt-contact-in");
    });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("tt-contact-in");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: "0px 0px -25px 0px"
  });

  animatedItems.forEach(function (element) {
    observer.observe(element);
  });
});

/* =====================================================
   TIPTHEORY SERVICES — PAGE INTERACTIONS
   Append to existing app.js. Preserve shared handlers.
   ===================================================== */
(() => {
  "use strict";

  function initServicesDesign() {
    const page = document.querySelector(".tt-services");
    if (!page || page.dataset.tsInitialized === "true") return;
    page.dataset.tsInitialized = "true";

    /* Reveal animations: content remains visible without JS. */
    const revealItems = page.querySelectorAll(
      ".ts-intro-grid > *, .ts-section-heading, .ts-service-row, " +
      ".ts-art-copy, .ts-art-image, .ts-shape-tabs, .ts-shape-result, " +
      ".ts-journey-steps article, .ts-final-inner > *"
    );

    if (
      "IntersectionObserver" in window &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      page.classList.add("ts-js-motion");

      const observer = new IntersectionObserver((entries, instance) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("ts-visible");
          instance.unobserve(entry.target);
        });
      }, {
        threshold: 0.12,
        rootMargin: "0px 0px -35px 0px"
      });

      revealItems.forEach((element, index) => {
        element.classList.add("ts-reveal");
        element.style.transitionDelay = `${(index % 4) * 90}ms`;
        observer.observe(element);
      });
    }

    /* Interactive nail shape studio */
    const shapeData = {
      almond: {
        title: "The Almond",
        description:
          "A tapered silhouette with a softly rounded tip for an elegant, elongated look.",
        image:
          "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=85",
        alt: "Almond nail shape inspiration",
        service: "Almond Nail Shape"
      },
      oval: {
        title: "The Oval",
        description:
          "A softly curved classic that creates a natural, timeless impression and pairs well with understated colours.",
        image:
          "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=85",
        alt: "Oval nail shape inspiration",
        service: "Oval Nail Shape"
      },
      square: {
        title: "The Square",
        description:
          "Straight sidewalls and a neat flat tip give this shape a crisp, contemporary finish.",
        image:
          "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=85",
        alt: "Square nail shape inspiration",
        service: "Square Nail Shape"
      },
      coffin: {
        title: "The Coffin",
        description:
          "A tapered silhouette with a flat tip creates a statement shape and a striking canvas for nail art.",
        image:
          "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=85",
        alt: "Coffin nail shape inspiration",
        service: "Coffin Nail Shape"
      },
      stiletto: {
        title: "The Stiletto",
        description:
          "A dramatic pointed shape for a bold look. Discuss a comfortable length and suitable design for your routine.",
        image:
          "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=900&q=85",
        alt: "Stiletto nail shape inspiration",
        service: "Stiletto Nail Shape"
      }
    };

    const tabs = page.querySelectorAll(".ts-shape-tab");
    const resultTitle = page.querySelector("#ts-shape-title");
    const resultDescription = page.querySelector("#ts-shape-description");
    const resultImage = page.querySelector("#ts-shape-image");
    const resultLink = page.querySelector("#ts-shape-link");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const item = shapeData[tab.dataset.shape];
        if (!item) return;

        tabs.forEach((otherTab) => {
          const selected = otherTab === tab;
          otherTab.classList.toggle("active", selected);
          otherTab.setAttribute("aria-pressed", String(selected));
        });

        if (resultTitle) resultTitle.textContent = item.title;
        if (resultDescription) {
          resultDescription.textContent = item.description;
        }

        if (resultImage) {
          resultImage.style.opacity = "0";
          resultImage.onload = () => {
            resultImage.style.opacity = "1";
          };
          resultImage.src = item.image;
          resultImage.alt = item.alt;

          if (resultImage.complete) {
            resultImage.style.opacity = "1";
          }
        }

        if (resultLink) {
          resultLink.href =
            "enquiry.html?service=" + encodeURIComponent(item.service);
        }
      });
    });

    /* Re-render Lucide icons after page elements are ready. */
    function refreshServicesIcons() {
      if (window.lucide?.createIcons) {
        window.lucide.createIcons();
      }
    }

    refreshServicesIcons();
    window.addEventListener("load", refreshServicesIcons, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initServicesDesign, {
      once: true
    });
  } else {
    initServicesDesign();
  }
})();

/* =========================================================
   TIPTHEORY SERVICES — COMPLETE PAGE INTERACTIONS
   Premium reveal animations + nail shape studio + Lucide
   Preserve existing shared app.js handlers.
========================================================= */

(() => {
  "use strict";

  function initServicesDesign() {
    const page = document.querySelector(".tt-services");

    if (!page || page.dataset.tsInitialized === "true") return;
    page.dataset.tsInitialized = "true";

    /* -----------------------------------------------
       1. PREMIUM SCROLL REVEAL — ORIGINAL PAGE CLASSES
    ------------------------------------------------ */

    const revealSelectors = [
      ".ts-intro-grid > *",
      ".ts-section-heading",
      ".ts-service-row",
      ".ts-art-copy",
      ".ts-art-image",
      ".ts-shape-tabs",
      ".ts-shape-result",
      ".ts-journey-steps article",
      ".ts-final-inner > *"
    ];

    const revealItems = new Set();

    revealSelectors.forEach((selector) => {
      page.querySelectorAll(selector).forEach((element) => {
        revealItems.add(element);
      });
    });

    /* Include text and image elements throughout the page */
    page.querySelectorAll(
      "p, h1, h2, h3, h4, figure, .ts-service-row img, " +
      ".ts-art-copy > *, .ts-art-image img"
    ).forEach((element) => {
      if (element.closest("button, .ts-shape-tab")) return;
      revealItems.add(element);
    });

    const motionAllowed =
      "IntersectionObserver" in window &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (motionAllowed) {
      page.classList.add("ts-js-motion");

      const observer = new IntersectionObserver(
        (entries, instance) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("ts-visible");
            instance.unobserve(entry.target);
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -35px 0px"
        }
      );

      revealItems.forEach((element, index) => {
        element.classList.add("ts-reveal");

        /* Paragraphs reveal smoothly, with a subtle stagger */
        if (element.matches("p")) {
          element.classList.add("ts-paragraph-reveal");
        }

        element.style.setProperty(
          "--ts-reveal-delay",
          `${(index % 4) * 90}ms`
        );

        observer.observe(element);
      });
    }

    /* -----------------------------------------------
       2. INTERACTIVE NAIL SHAPE STUDIO
    ------------------------------------------------ */

    const shapeData = {
      almond: {
        title: "The Almond",
        description:
          "A tapered silhouette with a softly rounded tip for an elegant, elongated look.",
        image:
          "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=85",
        alt: "Almond nail shape inspiration",
        service: "Almond Nail Shape"
      },

      oval: {
        title: "The Oval",
        description:
          "A softly curved classic that creates a natural, timeless impression and pairs well with understated colours.",
        image:
          "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=85",
        alt: "Oval nail shape inspiration",
        service: "Oval Nail Shape"
      },

      square: {
        title: "The Square",
        description:
          "Straight sidewalls and a neat flat tip give this shape a crisp, contemporary finish.",
        image:
          "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=85",
        alt: "Square nail shape inspiration",
        service: "Square Nail Shape"
      },

      coffin: {
        title: "The Coffin",
        description:
          "A tapered silhouette with a flat tip creates a statement shape and a striking canvas for nail art.",
        image:
          "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=85",
        alt: "Coffin nail shape inspiration",
        service: "Coffin Nail Shape"
      },

      stiletto: {
        title: "The Stiletto",
        description:
          "A dramatic pointed shape for a bold look. Discuss a comfortable length and suitable design for your routine.",
        image:
          "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=900&q=85",
        alt: "Stiletto nail shape inspiration",
        service: "Stiletto Nail Shape"
      }
    };

    const tabs = page.querySelectorAll(".ts-shape-tab");
    const resultTitle = page.querySelector("#ts-shape-title");
    const resultDescription = page.querySelector("#ts-shape-description");
    const resultImage = page.querySelector("#ts-shape-image");
    const resultLink = page.querySelector("#ts-shape-link");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const item = shapeData[tab.dataset.shape];
        if (!item) return;

        tabs.forEach((otherTab) => {
          const selected = otherTab === tab;

          otherTab.classList.toggle("active", selected);
          otherTab.setAttribute("aria-pressed", String(selected));
        });

        if (resultTitle) {
          resultTitle.textContent = item.title;
        }

        if (resultDescription) {
          resultDescription.textContent = item.description;
        }

        if (resultImage) {
          resultImage.style.opacity = "0";
          resultImage.style.transform = "translateY(10px)";

          resultImage.onload = () => {
            resultImage.style.opacity = "1";
            resultImage.style.transform = "translateY(0)";
          };

          resultImage.onerror = () => {
            resultImage.style.opacity = "1";
            resultImage.style.transform = "translateY(0)";
          };

          resultImage.src = item.image;
          resultImage.alt = item.alt;

          if (resultImage.complete && resultImage.naturalWidth > 0) {
            resultImage.style.opacity = "1";
            resultImage.style.transform = "translateY(0)";
          }
        }

        if (resultLink) {
          resultLink.href =
            "enquiry.html?service=" + encodeURIComponent(item.service);
        }
      });
    });

    /* -----------------------------------------------
       3. REFRESH LUCIDE ICONS
    ------------------------------------------------ */

    function refreshServicesIcons() {
      if (window.lucide?.createIcons) {
        window.lucide.createIcons();
      }
    }

    refreshServicesIcons();
    window.addEventListener("load", refreshServicesIcons, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initServicesDesign, {
      once: true
    });
  } else {
    initServicesDesign();
  }
})();


/* =========================================================
   TIPTHEORY SERVICES — ADDITIONAL PREMIUM REVEAL CONTROLLER
   Supports .services-page layout and its paragraph content
========================================================= */

(() => {
  "use strict";

  const page = document.querySelector(".services-page");
  if (!page) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion || !("IntersectionObserver" in window)) return;

  /* Reveal headings, paragraphs, images, cards and studio steps */
  const revealGroups = [
    { selector: ".tt-collage-copy", direction: "from-left" },
    { selector: ".tt-photo-mosaic .tt-mosaic-tile", direction: "scale-in" },
    { selector: ".svc-section-intro", direction: "from-left" },
    { selector: ".svc-menu-item", direction: "" },
    { selector: ".svc-menu-footnote", direction: "" },
    { selector: ".svc-fashion-image", direction: "from-left" },
    { selector: ".svc-fashion-copy", direction: "from-right" },
    { selector: ".td-studio-heading", direction: "" },
    { selector: ".td-preview-panel", direction: "from-left" },
    { selector: ".td-controls-panel", direction: "from-right" },
    { selector: ".svc-details-heading", direction: "" },
    { selector: ".svc-detail-card", direction: "scale-in" },
    { selector: ".svc-story-image", direction: "from-left" },
    { selector: ".svc-story-copy", direction: "from-right" },
    { selector: ".svc-final-content", direction: "" }
  ];

  const animatedElements = new Set();

  revealGroups.forEach(({ selector, direction }) => {
    page.querySelectorAll(selector).forEach((element, index) => {
      if (animatedElements.has(element)) return;

      animatedElements.add(element);
      element.classList.add("motion-reveal");

      if (direction) {
        element.classList.add(direction);
      }

      if (
        element.matches(
          ".svc-menu-item, .svc-detail-card, .tt-mosaic-tile"
        )
      ) {
        element.style.setProperty(
          "--motion-delay",
          `${(index % 6) * 100}ms`
        );
      }
    });
  });

  /* Paragraphs reveal independently, not just with their parent */
  page.querySelectorAll(
    ".tt-collage-copy p, .svc-section-intro p, " +
    ".svc-menu-item p, .svc-menu-footnote p, " +
    ".svc-fashion-copy p, .td-studio p, " +
    ".svc-detail-card p, .svc-story-copy p, " +
    ".svc-final-content p"
  ).forEach((paragraph, index) => {
    if (animatedElements.has(paragraph)) return;

    animatedElements.add(paragraph);
    paragraph.classList.add("motion-reveal", "paragraph-reveal");

    paragraph.style.setProperty(
      "--motion-delay",
      `${(index % 3) * 110}ms`
    );
  });

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -45px 0px"
    }
  );

  animatedElements.forEach((element) => {
    observer.observe(element);
  });

  /* Studio controls reveal one after another */
  const studio = page.querySelector(".td-controls-panel");

  if (studio) {
    studio.querySelectorAll(
      ".td-control-heading, .td-shape-grid, " +
      ".td-colour-grid, .td-finish-grid, .td-booking-bar"
    ).forEach((element, index) => {
      if (animatedElements.has(element)) return;

      animatedElements.add(element);
      element.classList.add("motion-reveal");

      element.style.setProperty(
        "--motion-delay",
        `${index * 90}ms`
      );

      observer.observe(element);
    });
  }
})();

/* =========================================================
   TIPTHEORY — GALLERY PAGE INTERACTIONS
   Append at the end of js/app.js
   Does not replace existing app.js functionality
========================================================= */

(function () {
  "use strict";

  function initTipTheoryGallery() {
    const page = document.querySelector(".tt-gallery-page");

    // Run only on the Gallery page
    if (!page || page.dataset.galleryInitialized === "true") return;
    page.dataset.galleryInitialized = "true";

    /* -----------------------------------------
       1. GALLERY CATEGORY FILTERS
    ----------------------------------------- */

    const filterButtons = [
      ...page.querySelectorAll("[data-gallery-filter]")
    ];

    const galleryCards = [
      ...page.querySelectorAll("[data-gallery-category]")
    ];

    function applyGalleryFilter(category) {
      filterButtons.forEach((button) => {
        const isActive = button.dataset.galleryFilter === category;

        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      galleryCards.forEach((card) => {
        const shouldShow =
          category === "all" ||
          card.dataset.galleryCategory === category;

        card.hidden = !shouldShow;
      });
    }

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyGalleryFilter(button.dataset.galleryFilter);
      });
    });

    /* -----------------------------------------
       2. STYLE COLLECTION FILTER LINKS
    ----------------------------------------- */

    page.querySelectorAll("[data-style-filter]").forEach((link) => {
      link.addEventListener("click", () => {
        const category = link.dataset.styleFilter;

        applyGalleryFilter(category);

        // Let the browser follow the link to the gallery section.
      });
    });

    /* -----------------------------------------
       3. IMAGE LIGHTBOX ELEMENTS
    ----------------------------------------- */

    const lightbox = document.getElementById("gallery-lightbox");
    const lightboxImage = document.getElementById("gallery-lightbox-image");
    const lightboxCaption = document.getElementById("gallery-lightbox-caption");

    if (!lightbox || !lightboxImage || !lightboxCaption) return;

    const closeButton = lightbox.querySelector(".gallery-lightbox-close");
    const previousButton = lightbox.querySelector(".gallery-lightbox-prev");
    const nextButton = lightbox.querySelector(".gallery-lightbox-next");

    let currentIndex = 0;
    let visibleImageButtons = [];
    let lastFocusedElement = null;

    function refreshVisibleImages() {
      visibleImageButtons = [
        ...page.querySelectorAll(
          ".gallery-art-card:not([hidden]) .gallery-image-button"
        )
      ];
    }

    function displayLightboxImage(index) {
      refreshVisibleImages();

      if (!visibleImageButtons.length) return;

      currentIndex =
        (index + visibleImageButtons.length) %
        visibleImageButtons.length;

      const button = visibleImageButtons[currentIndex];
      const thumbnail = button.querySelector("img");

      if (!thumbnail) return;

      lightboxImage.src =
        button.dataset.galleryImage || thumbnail.currentSrc || thumbnail.src;

      lightboxImage.alt = thumbnail.alt || "Nail art inspiration";

      lightboxCaption.textContent =
        button.dataset.galleryTitle || thumbnail.alt || "Gallery design";
    }

    function openLightbox(button) {
      refreshVisibleImages();

      currentIndex = visibleImageButtons.indexOf(button);

      if (currentIndex < 0) return;

      lastFocusedElement = button;
      displayLightboxImage(currentIndex);

      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");

      document.body.classList.add("gallery-lightbox-open");

      if (closeButton) closeButton.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");

      document.body.classList.remove("gallery-lightbox-open");

      if (lastFocusedElement && document.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
      }
    }

    /* -----------------------------------------
       4. OPEN IMAGE ON CLICK
    ----------------------------------------- */

    page.querySelectorAll(".gallery-image-button").forEach((button) => {
      button.addEventListener("click", () => {
        openLightbox(button);
      });
    });

    /* -----------------------------------------
       5. NEXT / PREVIOUS / CLOSE BUTTONS
    ----------------------------------------- */

    if (closeButton) {
      closeButton.addEventListener("click", closeLightbox);
    }

    if (previousButton) {
      previousButton.addEventListener("click", () => {
        displayLightboxImage(currentIndex - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        displayLightboxImage(currentIndex + 1);
      });
    }

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    /* -----------------------------------------
       6. KEYBOARD NAVIGATION
    ----------------------------------------- */

    document.addEventListener("keydown", (event) => {
      if (!lightbox.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        displayLightboxImage(currentIndex - 1);
      }

      if (event.key === "ArrowRight") {
        displayLightboxImage(currentIndex + 1);
      }
    });

    /* -----------------------------------------
       7. REVEAL ANIMATIONS
    ----------------------------------------- */

    const animatedElements = page.querySelectorAll(
      ".gallery-art-card, " +
      ".gallery-style-card, " +
      ".gallery-behind-grid figure, " +
      ".gallery-occasion-copy, " +
      ".gallery-final-content"
    );

    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("gallery-revealed");
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -35px 0px"
        }
      );

      animatedElements.forEach((element) => {
        element.classList.add("gallery-reveal");
        revealObserver.observe(element);
      });
    } else {
      animatedElements.forEach((element) => {
        element.classList.add("gallery-revealed");
      });
    }

    /* -----------------------------------------
       8. REFRESH LUCIDE ICONS IF AVAILABLE
    ----------------------------------------- */

    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  // Works whether app.js loads before or after DOMContentLoaded.
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initTipTheoryGallery,
      { once: true }
    );
  } else {
    initTipTheoryGallery();
  }
})();

/* Gallery Show More / Show Less */
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".tt-gallery-page .gallery-masonry");
  const toggle = document.getElementById("gallery-show-more");

  if (!gallery || !toggle) return;

  const wrap = toggle.closest(".gallery-show-more-wrap");
  const label = toggle.querySelector("span");
  const icon = toggle.querySelector("i");

  const extraCards = Array.from(
    gallery.querySelectorAll(".gallery-extra-card")
  );

  if (!extraCards.length) {
    wrap?.classList.add("is-hidden");
    return;
  }

  let expanded = false;

  function updateButton() {
    const allCardsVisible = extraCards.every(card => !card.hidden);

    expanded = allCardsVisible;
    toggle.setAttribute("aria-expanded", String(expanded));
    label.textContent = expanded ? "Show Less" : "Show More";

    if (icon) {
      icon.setAttribute(
        "data-lucide",
        expanded ? "arrow-up" : "arrow-down"
      );
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  toggle.addEventListener("click", () => {
    expanded = !expanded;

    extraCards.forEach(card => {
      card.hidden = !expanded;
    });

    updateButton();

    if (!expanded) {
      document.getElementById("signature-gallery")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  /* Keep extra cards compatible with the category filters */
  document.querySelectorAll("[data-gallery-filter]").forEach(filter => {
    filter.addEventListener("click", () => {
      const category = filter.dataset.galleryFilter;

      extraCards.forEach(card => {
        if (category !== "all" && card.dataset.galleryCategory !== category) {
          card.hidden = true;
        } else {
          card.hidden = !expanded;
        }
      });
    });
  });

  updateButton();
});
/* =====================================================
   TIPTHEORY GALLERY — FULL PAGE PREMIUM REVEALS
===================================================== */

(() => {
    function initPremiumGalleryMotion() {
        const page = document.querySelector(
            'body[data-page="gallery"]'
        );

        const main = page?.querySelector("#main");

        if (!page || !main) return;

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const revealSelector = [
            ":scope > section",
            ".gallery-hero-copy > *",
            ".gallery-hero-visual > *",
            ".gallery-section-heading > *",
            ".gallery-editorial-heading > *",
            ".gallery-collections-heading > *",
            ".gallery-detail-heading > *",
            ".gallery-story-copy > *",
            ".gallery-occasion-copy > *",
            ".gallery-art-card",
            ".gallery-collection-item",
            ".gallery-story-image",
            ".gallery-detail-feature",
            ".gallery-detail-side",
            ".gallery-detail-quote",
            ".occasion-photo-main",
            ".occasion-photo-small",
            ".gallery-final-content > *"
        ].join(",");

        const elements = [...main.querySelectorAll(revealSelector)];

        // Remove duplicates while preserving the original DOM order.
        const targets = [...new Set(elements)].filter((element) => {
            if (element.matches(".gallery-hero")) return false;

            // Avoid hiding a parent and its children at the same time.
            return !targetsHasAncestor(element, main, revealSelector);
        });

        function targetsHasAncestor(element, root, selector) {
            let parent = element.parentElement;

            while (parent && parent !== root) {
                if (parent.matches(selector) && parent !== element) {
                    return true;
                }

                parent = parent.parentElement;
            }

            return false;
        }

        if (reducedMotion || !("IntersectionObserver" in window)) {
            targets.forEach((element) => {
                element.classList.add("tt-premium-visible");
                element.style.opacity = "1";
                element.style.transform = "none";
            });

            return;
        }

        targets.forEach((element, index) => {
            element.classList.add("tt-premium-reveal");

            // Alternate motion directions for a premium editorial rhythm.
            if (element.matches(
                ".gallery-art-card, .gallery-collection-item, " +
                ".gallery-detail-feature, .gallery-story-image"
            )) {
                element.classList.add("tt-premium-zoom");
            } else if (index % 3 === 1) {
                element.classList.add("tt-premium-left");
            } else if (index % 3 === 2) {
                element.classList.add("tt-premium-right");
            } else {
                element.classList.add("tt-premium-up");
            }

            // Short stagger delay, capped to keep scrolling responsive.
            element.style.setProperty(
                "--tt-premium-delay",
                `${Math.min(index % 5, 4) * 90}ms`
            );
        });

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add("tt-premium-visible");
                obs.unobserve(entry.target);
            });
        }, {
            threshold: 0.08,
            rootMargin: "0px 0px -45px 0px"
        });

        targets.forEach((element) => observer.observe(element));
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initPremiumGalleryMotion,
            { once: true }
        );
    } else {
        initPremiumGalleryMotion();
    }
})();
/* ==========================================
   TIPTHEORY GALLERY
   FIX: DISCOVER THE LOOK FOR ALL CARDS
========================================== */

document.addEventListener("click", function (event) {
    const galleryButton = event.target.closest(
        "#signature-gallery .gallery-image-button"
    );

    if (!galleryButton) return;

    const lightbox = document.getElementById("gallery-lightbox");
    const lightboxImage = document.getElementById("gallery-lightbox-image");
    const lightboxCaption = document.getElementById("gallery-lightbox-caption");

    if (!lightbox || !lightboxImage || !lightboxCaption) {
        console.error("Gallery lightbox elements are missing.");
        return;
    }

    const imageUrl = galleryButton.dataset.galleryImage;
    const imageTitle = galleryButton.dataset.galleryTitle || "Nail Art Design";

    if (!imageUrl) {
        console.error("Missing data-gallery-image:", galleryButton);
        return;
    }

    // Display the selected image, just like the existing cards
    lightboxImage.src = imageUrl;
    lightboxImage.alt = imageTitle;
    lightboxCaption.textContent = imageTitle;

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("gallery-lightbox-active");
});


/* CLOSE LIGHTBOX */

document.addEventListener("click", function (event) {
    const closeButton = event.target.closest(".gallery-lightbox-close");
    const lightbox = document.getElementById("gallery-lightbox");

    if (!closeButton || !lightbox) return;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gallery-lightbox-active");
});


/* CLOSE WITH ESCAPE KEY */

document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    const lightbox = document.getElementById("gallery-lightbox");

    if (!lightbox) return;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gallery-lightbox-active");
});
/* ==========================================
   TIPTHEORY — WORKING GALLERY CATEGORY FILTERS
   All / Minimal / Floral / Chrome / Bold
========================================== */

(() => {
    "use strict";

    function initGalleryCategoryFilters() {
        const page = document.querySelector('body[data-page="gallery"]');

        if (!page) return;

        const buttons = page.querySelectorAll(
            ".gallery-filter[data-gallery-filter]"
        );

        const cards = page.querySelectorAll(
            ".gallery-masonry .gallery-art-card[data-gallery-category]"
        );

        if (!buttons.length || !cards.length) {
            console.error("Gallery filter: buttons or cards not found.");
            return;
        }

        function filterGallery(category) {
            // Update selected button
            buttons.forEach((button) => {
                const selected =
                    button.dataset.galleryFilter === category;

                button.classList.toggle("active", selected);
                button.setAttribute("aria-pressed", String(selected));
            });

            // Show only matching cards
            cards.forEach((card) => {
                const cardCategory = (
                    card.dataset.galleryCategory || ""
                ).trim().toLowerCase();

                const shouldShow =
                    category === "all" || cardCategory === category;

                card.hidden = !shouldShow;

                if (shouldShow) {
                    card.style.setProperty("display", "", "");
                    card.removeAttribute("hidden");
                } else {
                    card.setAttribute("hidden", "");
                    card.style.setProperty(
                        "display",
                        "none",
                        "important"
                    );
                }
            });
        }

        // Capture clicks before older, duplicate filter handlers
        page.addEventListener("click", (event) => {
            const button = event.target.closest(
                ".gallery-filter[data-gallery-filter]"
            );

            if (!button || !page.contains(button)) return;

            event.stopImmediatePropagation();
            filterGallery(button.dataset.galleryFilter);
        }, true);

        // Initial state
        filterGallery("all");
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initGalleryCategoryFilters,
            { once: true }
        );
    } else {
        initGalleryCategoryFilters();
    }
})();

/* Gallery Look Finder — category navigation */
document.addEventListener("DOMContentLoaded", () => {
  const lookButtons = document.querySelectorAll(
    ".look-finder-card[data-gallery-filter]"
  );

  const gallerySection = document.querySelector("#signature-gallery");
  const filterButtons = document.querySelectorAll(
    ".gallery-filter[data-gallery-filter]"
  );

  lookButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.galleryFilter;

      // Activate the matching existing gallery filter
      const matchingFilter = Array.from(filterButtons).find(
        (filter) => filter.dataset.galleryFilter === category
      );

      if (matchingFilter) {
        matchingFilter.click();
      } else {
        // Fallback: filter the gallery cards directly
        document.querySelectorAll(
          "#signature-gallery .gallery-art-card"
        ).forEach((card) => {
          card.hidden =
            card.dataset.galleryCategory !== category;
        });
      }

      // Scroll to the filtered gallery
      if (gallerySection) {
        gallerySection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });
});
/* MOBILE HOME DROPDOWN TOGGLE */
document.addEventListener("DOMContentLoaded", function () {
  const homeMenu = document.getElementById("home-menu");
  const homeButton = document.getElementById("home-menu-button");

  if (!homeMenu || !homeButton) return;

  homeButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const isOpen = homeMenu.classList.toggle("dropdown-open");
    homeButton.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", function (event) {
    if (!homeMenu.contains(event.target)) {
      homeMenu.classList.remove("dropdown-open");
      homeButton.setAttribute("aria-expanded", "false");
    }
  });
});