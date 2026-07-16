(function () {
  const data = window.siteData;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const accentMap = {
    amber: "#c8891f",
    teal: "#1b8d86",
    violet: "#7a55be",
    blue: "#315fc6",
  };

  function resolvePath(path) {
    return path.split(".").reduce((value, key) => (value ? value[key] : ""), data);
  }

  function bindStaticContent() {
    $$("[data-bind-text]").forEach((node) => {
      node.textContent = resolvePath(node.dataset.bindText);
    });

    $$("[data-bind-src]").forEach((node) => {
      node.setAttribute("src", resolvePath(node.dataset.bindSrc));
    });

    $$("[data-bind-href]").forEach((node) => {
      node.setAttribute("href", resolvePath(node.dataset.bindHref));
    });

    $$("[data-bind-href-email]").forEach((node) => {
      const email = resolvePath(node.dataset.bindHrefEmail);
      node.setAttribute("href", `mailto:${email}`);
    });
  }

  function renderCredentials() {
    const list = $("[data-credentials-list]");
    list.innerHTML = "";

    data.credentials.forEach((credential) => {
      const li = document.createElement("li");
      li.textContent = credential;
      list.appendChild(li);
    });
  }

  function renderPortfolio() {
    const track = $("[data-carousel-track]");
    const dots = $("[data-carousel-dots]");

    track.innerHTML = "";
    dots.innerHTML = "";

    data.portfolio.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "portfolio-card";
      card.style.setProperty("--card-accent", accentMap[item.accent] || accentMap.blue);
      card.dataset.index = index;

      card.innerHTML = `
        <div class="preview-wrap">
          <img class="pdf-preview" src="${item.preview}" alt="Preview of ${item.title}" loading="lazy" />
        </div>
        <div class="card-copy">
          <p class="eyebrow">${item.eyebrow}</p>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="card-actions">
            <button class="button primary open-pdf" type="button" data-open-pdf="${index}">
              ${item.button}
            </button>
          </div>
        </div>
      `;

      const dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to ${item.title}`);
      dot.dataset.carouselDot = index;

      track.appendChild(card);
      dots.appendChild(dot);
    });
  }

  function renderResumeCard() {
    const card = $("[data-resume-card]");
    if (!card || !data.resume) return;

    const item = data.resume;
    card.style.setProperty("--card-accent", accentMap[item.accent] || accentMap.blue);
    card.innerHTML = `
      <div class="resume-preview-wrap">
        <img class="pdf-preview" src="${item.preview}" alt="Preview of ${item.title}" loading="lazy" />
      </div>
      <div class="card-copy">
        <p class="eyebrow">${item.eyebrow}</p>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="card-actions">
          <button class="button primary open-pdf" type="button" data-open-resume>
            ${item.button}
          </button>
        </div>
      </div>
    `;
  }

  function setupReveals() {
    const revealNodes = $$(".reveal");

    if (!("IntersectionObserver" in window)) {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealNodes.forEach((node) => observer.observe(node));
  }

  function setupBackgroundMotion() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let ticking = false;

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;

        window.requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--scroll-ribbon", `${window.scrollY * -0.055}px`);
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  function setupScrollProgress() {
    const fill = $("[data-scroll-progress-fill]");
    const label = $("[data-scroll-progress-label]");
    if (!fill || !label) return;

    let ticking = false;

    function update() {
      const scrollableHeight = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const progress = scrollableHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100)) : 100;

      document.documentElement.style.setProperty("--scroll-progress", `${progress}%`);
      label.textContent = `${Math.round(progress)}%`;
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
  }

  function setupCarousel() {
    const track = $("[data-carousel-track]");
    const prev = $("[data-carousel-prev]");
    const next = $("[data-carousel-next]");
    const dots = $$("[data-carousel-dot]");
    let activeIndex = 0;
    let autoplay;
    let carouselInView = false;
    let isPaused = false;
    const mobileCarouselQuery = window.matchMedia("(max-width: 720px)");
    const autoplayDelay = () => (mobileCarouselQuery.matches ? 5000 : 3500);

    function cardAt(index) {
      return $(`.portfolio-card[data-index="${index}"]`, track);
    }

    function goTo(index) {
      const bounded = (index + data.portfolio.length) % data.portfolio.length;
      const card = cardAt(bounded);
      if (!card) return;
      activeIndex = bounded;
      const targetLeft = card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2;
      track.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
      updateDots();
    }

    function updateDots() {
      dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === activeIndex);
        dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
      });
    }

    function inferActiveCard() {
      const cards = $$(".portfolio-card", track);
      const trackBox = track.getBoundingClientRect();
      const trackCenter = trackBox.left + trackBox.width / 2;
      let closestIndex = activeIndex;
      let closestDistance = Infinity;

      cards.forEach((card, index) => {
        const box = card.getBoundingClientRect();
        const cardCenter = box.left + box.width / 2;
        const distance = Math.abs(trackCenter - cardCenter);

        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      });

      activeIndex = closestIndex;
      updateDots();
    }

    function canAutoplay() {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      return carouselInView && !isPaused && !reduceMotion;
    }

    function startAutoplay() {
      stopAutoplay();
      if (!canAutoplay()) return;
      autoplay = window.setTimeout(() => {
        goTo(activeIndex + 1);
        startAutoplay();
      }, autoplayDelay());
    }

    function stopAutoplay() {
      if (autoplay) window.clearTimeout(autoplay);
    }

    prev.addEventListener("click", () => {
      goTo(activeIndex - 1);
      startAutoplay();
    });
    next.addEventListener("click", () => {
      goTo(activeIndex + 1);
      startAutoplay();
    });

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        goTo(Number(dot.dataset.carouselDot));
        startAutoplay();
      });
    });

    track.addEventListener("scroll", () => {
      window.clearTimeout(track._scrollTimer);
      track._scrollTimer = window.setTimeout(inferActiveCard, 80);
    });

    track.addEventListener("mouseenter", () => {
      isPaused = true;
      stopAutoplay();
    });
    track.addEventListener("mouseleave", () => {
      isPaused = false;
      startAutoplay();
    });
    track.addEventListener("focusin", () => {
      isPaused = true;
      stopAutoplay();
    });
    track.addEventListener("focusout", () => {
      isPaused = false;
      startAutoplay();
    });
    track.addEventListener("pointerdown", () => {
      isPaused = true;
      stopAutoplay();
    });
    track.addEventListener("pointerup", () => {
      isPaused = false;
      startAutoplay();
    });
    track.addEventListener("pointercancel", () => {
      isPaused = false;
      startAutoplay();
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            carouselInView = entry.isIntersecting;
            if (carouselInView) startAutoplay();
            else stopAutoplay();
          });
        },
        { threshold: 0.38 }
      );
      observer.observe(track);
    } else {
      carouselInView = true;
      startAutoplay();
    }

    updateDots();
  }

  function setupPdfModal() {
    const modal = $("[data-pdf-modal]");
    const modalPanel = $(".modal-panel", modal);
    const frame = $("[data-modal-frame]");
    const pageViewer = $("[data-modal-pages]");
    const title = $("[data-modal-title]");
    const eyebrow = $("[data-modal-eyebrow]");
    const download = $("[data-modal-download]");
    const prev = $("[data-modal-prev]");
    const next = $("[data-modal-next]");
    const zoomOut = $("[data-modal-zoom-out]");
    const zoomIn = $("[data-modal-zoom-in]");
    const zoomLevel = $("[data-modal-zoom-level]");
    const closeButtons = $$("[data-pdf-close]");
    const documents = [...data.portfolio, data.resume].filter(Boolean);
    const mobileZoomQuery = window.matchMedia("(max-width: 720px)");
    const minZoom = 75;
    const maxZoom = 200;
    const zoomStep = 25;
    let activeIndex = 0;
    let lastFocused = null;
    let zoomPercent = 100;

    function shouldUseRenderedPages(item) {
      const hasPages = Array.isArray(item.pages) && item.pages.length > 0;
      const mobileWidth = window.matchMedia("(max-width: 820px)").matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      return hasPages && (mobileWidth || coarsePointer);
    }

    function renderPageStack(item) {
      pageViewer.innerHTML = "";

      item.pages.forEach((pageSrc, pageIndex) => {
        const figure = document.createElement("figure");
        figure.className = "modal-page";

        const img = document.createElement("img");
        img.src = pageSrc;
        img.alt = `${item.title} page ${pageIndex + 1}`;
        img.loading = pageIndex < 2 ? "eager" : "lazy";

        const caption = document.createElement("figcaption");
        caption.textContent = `Page ${pageIndex + 1} of ${item.pages.length}`;

        figure.append(img, caption);
        pageViewer.appendChild(figure);
      });

      pageViewer.scrollTop = 0;
    }

    function updateZoomControls() {
      zoomLevel.textContent = `${zoomPercent}%`;
      zoomOut.disabled = zoomPercent <= minZoom;
      zoomIn.disabled = zoomPercent >= maxZoom;
    }

    function setZoom(nextZoom, preservePosition = true) {
      if (!mobileZoomQuery.matches || !modalPanel.classList.contains("has-page-viewer")) return;

      const oldScrollWidth = pageViewer.scrollWidth || 1;
      const oldScrollHeight = pageViewer.scrollHeight || 1;
      const horizontalRatio =
        (pageViewer.scrollLeft + pageViewer.clientWidth / 2) / oldScrollWidth;
      const verticalRatio =
        (pageViewer.scrollTop + pageViewer.clientHeight / 2) / oldScrollHeight;

      zoomPercent = Math.min(maxZoom, Math.max(minZoom, nextZoom));
      pageViewer.style.setProperty("--mobile-pdf-zoom", `${zoomPercent}%`);
      updateZoomControls();

      if (!preservePosition) {
        pageViewer.scrollLeft = 0;
        pageViewer.scrollTop = 0;
        return;
      }

      window.requestAnimationFrame(() => {
        pageViewer.scrollLeft = Math.max(
          0,
          horizontalRatio * pageViewer.scrollWidth - pageViewer.clientWidth / 2
        );
        pageViewer.scrollTop = Math.max(
          0,
          verticalRatio * pageViewer.scrollHeight - pageViewer.clientHeight / 2
        );
      });
    }

    function resetZoom() {
      zoomPercent = 100;
      pageViewer.style.setProperty("--mobile-pdf-zoom", "100%");
      updateZoomControls();
    }

    function open(index) {
      const item = documents[index];
      if (!item) return;

      activeIndex = index;
      lastFocused = document.activeElement;
      eyebrow.textContent = item.eyebrow;
      title.textContent = item.title;
      resetZoom();

      if (shouldUseRenderedPages(item)) {
        modalPanel.classList.add("has-page-viewer");
        frame.src = "about:blank";
        renderPageStack(item);
      } else {
        modalPanel.classList.remove("has-page-viewer");
        pageViewer.innerHTML = "";
        frame.src = `${item.pdf}#view=FitH`;
      }

      download.href = item.pdf;
      download.setAttribute("download", item.pdf.split("/").pop());
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      $(".close-button", modal).focus();
    }

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      modalPanel.classList.remove("has-page-viewer");
      frame.src = "about:blank";
      pageViewer.innerHTML = "";
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    function shift(delta) {
      const nextIndex = (activeIndex + delta + documents.length) % documents.length;
      open(nextIndex);
    }

    document.addEventListener("click", (event) => {
      const resumeTrigger = event.target.closest("[data-open-resume]");
      if (resumeTrigger) {
        open(documents.length - 1);
        return;
      }

      const trigger = event.target.closest("[data-open-pdf]");
      if (trigger) open(Number(trigger.dataset.openPdf));
    });

    closeButtons.forEach((button) => button.addEventListener("click", close));
    prev.addEventListener("click", () => shift(-1));
    next.addEventListener("click", () => shift(1));
    zoomOut.addEventListener("click", () => setZoom(zoomPercent - zoomStep));
    zoomIn.addEventListener("click", () => setZoom(zoomPercent + zoomStep));
    updateZoomControls();

    document.addEventListener("keydown", (event) => {
      if (!modal.classList.contains("is-open")) return;

      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") shift(-1);
      if (event.key === "ArrowRight") shift(1);
    });
  }

  function init() {
    bindStaticContent();
    renderCredentials();
    renderPortfolio();
    renderResumeCard();
    setupReveals();
    setupBackgroundMotion();
    setupScrollProgress();
    setupCarousel();
    setupPdfModal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
