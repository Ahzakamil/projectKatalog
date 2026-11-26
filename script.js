/* =========================================================
   KlikBaca - script.js (dipakai di index.html & hasil.html)
   Data buku: Open Library API (gratis, tanpa API key)
   ========================================================= */

// ---------- PENGATURAN ----------
const RESULTS_PAGE = "hasil.html";
const DETAIL_PAGE = "olah.html";

// ---------- PERALATAN KECIL ----------
const $ = (id) => document.getElementById(id);
const bookBox = $("book");
const searchInput = $("searchInput");
const searchBtn = $("searchBtn");
const resultTitle = $("resultTitle");
const resultCount = $("resultCount");
const isResultsPage = Boolean(resultTitle);

let requestId = 0;

const escapeHTML = (str = "") =>
  String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const detailLink = (key = "") =>
  `${DETAIL_PAGE}?id=${encodeURIComponent(key.replace("/works/", ""))}`;

// ---------- KARTU BUKU ----------
const renderBook = (book) => {
  const title = escapeHTML(book.title || "Tanpa judul");
  const author = escapeHTML(book.author_name?.[0] || "Penulis tidak diketahui");
  const year = book.first_publish_year ? ` · ${book.first_publish_year}` : "";
  const link = detailLink(book.key);
  const hasCover = Boolean(book.cover_i);
  const coverStyle = hasCover
    ? `style="background-image:url('https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg')"`
    : "";

  return `
 <a class="api-book-card" href="${link}">
    <div class="book-cover" ${coverStyle}></div>
    <p class="book-name">${title}</p>
    <p class="book-author">${author}${year}</p>
  </a>`;
};

// ---------- SKELETON SHIMMER ----------
const renderSkeleton = (count = 14) =>
  Array.from({ length: count }, () => `
 <div class="api-book-card skeleton-card" aria-hidden="true">
    <div class="book-cover skeleton"></div>
    <div class="skeleton skeleton-line"></div>
    <div class="skeleton skeleton-line short"></div>
  </div>`).join("");

// ---------- AMBIL & TAMPILKAN BUKU (hasil.html) ----------
const loadBooks = async (keyword = "novel", limit = 28) => {
  if (!bookBox) return 0;

  const myId = ++requestId;
  bookBox.setAttribute("aria-busy", "true");
  bookBox.innerHTML = renderSkeleton(limit);

  try {
    const url =
      `https://openlibrary.org/search.json?q=${encodeURIComponent(keyword)}` +
      `&limit=${limit}` +
      `&fields=key,title,author_name,first_publish_year,cover_i`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (myId !== requestId) return 0;

    const docs = data.docs || [];
    if (!docs.length) {
      bookBox.innerHTML = `<p class="book-message">Buku "${escapeHTML(keyword)}" tidak ditemukan. Coba kata kunci lain.</p>`;
      return 0;
    }
    bookBox.innerHTML = docs.map(renderBook).join("");
    return data.numFound || docs.length;

  } catch (error) {
    if (myId !== requestId) return 0;
    console.error("Error fetching books:", error);
    bookBox.innerHTML = `<p class="book-message">Terjadi kesalahan saat mengambil data. Periksa koneksi internet lalu coba lagi.</p>`;
    return 0;
  } finally {
    if (myId === requestId) bookBox.removeAttribute("aria-busy");
  }
};

// ---------- PENCARIAN ----------
const doSearch = () => {
  const keyword = searchInput.value.trim();
  if (!keyword) return;
  window.location.href = `${RESULTS_PAGE}?q=${encodeURIComponent(keyword)}`;
};

if (searchInput) {
  searchBtn?.addEventListener("click", doSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });
}

// ---------- SAAT HALAMAN HASIL DIBUKA ----------
if (isResultsPage) {
  const keyword = (new URLSearchParams(window.location.search).get("q") || "").trim();

  if (!keyword) {
    resultTitle.textContent = "Cari buku";
    if (bookBox) bookBox.innerHTML = `<p class="book-message">Ketik judul, penulis, atau topik di kolom pencarian.</p>`;
  } else {
    if (searchInput) searchInput.value = keyword;
    document.title = `${keyword} - KlikBaca`;
    resultTitle.textContent = `Hasil untuk "${keyword}"`;

    loadBooks(keyword, 28).then((total) => {
      if (total && resultCount) {
        resultCount.textContent = `Ditemukan ${total.toLocaleString("id-ID")} buku, menampilkan 28 teratas.`;
      }
    });
  }
}

/* =========================================================
   NAVBAR: menu hamburger (Satu-satunya pengendali menu)
   ========================================================= */
const navbar = $("navbar");
const navToggle = $("navToggle");

if (navbar && navToggle) {
  const setMenu = (open) => {
    navbar.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  };
  navToggle.addEventListener("click", () => setMenu(!navbar.classList.contains("open")));
  document.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  document.addEventListener("click", (e) => { if (!navbar.contains(e.target)) setMenu(false); });
}

/* =========================================================
   HERO: kata terakhir judul yang berganti (GSAP)
   ========================================================= */
const heroRotator = $("heroRotator");
const canAnimate = Boolean(window.gsap) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (heroRotator && canAnimate) {
  const words = [...heroRotator.querySelectorAll(".rw")];
  const pick = (el, sel) => el.querySelectorAll(sel);
  const SQUASH = { scaleX: 1.3, scaleY: .25 };

  gsap.defaults({ overwrite: "auto" });
  gsap.set(words, { transformOrigin: "0% 85%" });
  gsap.set(pick(heroRotator, ".rw-text"), { transformOrigin: "50% 85%" });
  gsap.set(pick(heroRotator, ".rw-bar"), { xPercent: -50 });
  gsap.set(pick(heroRotator, ".rw-fill"), { yPercent: -50 });

  const scenes = {
    select(tl, w, hold) {
      const [text] = pick(w, ".rw-text"), [hl] = pick(w, ".rw-hl"), [bar] = pick(w, ".rw-bar");
      const [tag] = pick(w, ".rw-tag"), [boldBtn] = pick(w, ".rw-bar b"), [swatchBtn] = pick(w, ".rw-bar > :last-child");
      const [dot] = pick(w, ".rw-swatch"), [fill] = pick(w, ".rw-fill"), [fillDot] = pick(w, ".rw-fill-dot");
      const ink = getComputedStyle(text).color;
      const blue = getComputedStyle(heroRotator).getPropertyValue("--rw-blue").trim();
      tl.set(text, { color: ink, fontWeight: 500, scaleY: 1 }, 0)
        .set([dot, fillDot], { backgroundColor: ink }, 0)
        .set([boldBtn, swatchBtn], { backgroundColor: "transparent" }, 0)
        .set(tag, { x: 0, y: 0 }, 0)
        .fromTo(tag, { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .3, ease: "back.out(2.4)" }, .5)
        .to(tag, { x: () => text.offsetWidth, duration: .85, ease: "power3.inOut" }, .62)
        .fromTo(hl, { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: .85, ease: "power3.inOut" }, .62)
        .fromTo(bar, { autoAlpha: 0, y: -4, scale: .9 }, { autoAlpha: 1, y: 0, scale: 1, duration: .3, ease: "back.out(1.7)" }, 1.6)
        .to(swatchBtn, { backgroundColor: "#444", duration: .12 }, 2.1)
        .fromTo(fill, { autoAlpha: 0, x: -6, scale: .92 }, { autoAlpha: 1, x: 0, scale: 1, duration: .3, ease: "back.out(1.7)" }, 2.15)
        .to(text, { color: blue, duration: .6, ease: "power2.inOut" }, 2.3)
        .to([dot, fillDot], { backgroundColor: blue, duration: .6, ease: "power2.inOut" }, 2.3)
        .to(fill, { autoAlpha: 0, x: -6, duration: .25 }, 3)
        .to(swatchBtn, { backgroundColor: "transparent", duration: .15 }, 3)
        .to(boldBtn, { backgroundColor: "#444", duration: .12 }, 3.1)
        .to(text, { scaleY: 1.06, duration: .09, yoyo: true, repeat: 1, ease: "power1.out" }, 3.1)
        .set(text, { fontWeight: 700 }, 3.15)
        .to([hl, bar, tag], { autoAlpha: 0, duration: .3, ease: "power1.out" }, hold - .45);
    },
    circle(tl, w, hold) {
      const [text] = pick(w, ".rw-text"), [path] = pick(w, ".rw-ring path"), [tag] = pick(w, ".rw-tag");
      const pen = { p: 0 };
      const place = () => {
        const pt = path.getPointAtLength(pen.p * path.getTotalLength());
        const fs = parseFloat(getComputedStyle(text).fontSize);
        const sx = (text.offsetWidth + .6 * fs) / 260, sy = (text.offsetHeight + .44 * fs) / 100;
        gsap.set(tag, { x: -.3 * fs + pt.x * sx + 4, y: -.22 * fs + pt.y * sy + 7 - (text.offsetHeight + 6) });
      };
      tl.set(text, { skewX: 0, scaleX: 1 }, 0)
        .set(pen, { p: 0 }, 0)
        .set(path, { autoAlpha: 1, strokeDashoffset: 1, strokeWidth: 5 }, .4)
        .fromTo(tag, { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .3, ease: "back.out(2.4)" }, .3)
        .to(path, { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut" }, .4)
        .to(pen, { p: 1, duration: 1.5, ease: "power1.inOut", onUpdate: place }, .4)
        .to(text, { skewX: -12, scaleX: 1.05, duration: .45, ease: "power3.out" }, 2)
        .to(path, { strokeWidth: 11, opacity: .35, duration: .4, ease: "power2.out" }, 2)
        .to([path, tag], { autoAlpha: 0, duration: .3 }, hold - .45);
    },
    cursors(tl, w, hold) {
      const tags = pick(w, ".rw-tag");
      tl.set(tags, { y: 0 }, 0)
        .fromTo(tags, { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .3, ease: "back.out(2.4)", stagger: .25 }, .4)
        .to(tags, { y: 3, duration: 1, ease: "sine.inOut", yoyo: true, repeat: 1, stagger: .25 }, .4)
        .to(tags, { autoAlpha: 0, duration: .25 }, hold - .45);
    },
  };

  const buildWord = (w) => {
    const hold = (Number(w.dataset.hold) || 3000) / 1000;
    const tl = gsap.timeline();
    tl.fromTo(w, { ...SQUASH, skewX: -14 }, { scaleX: 1, scaleY: 1, skewX: 0, duration: .7, ease: "expo.out" }, 0)
      .fromTo(w, { autoAlpha: 0 }, { autoAlpha: 1, duration: .25, ease: "power1.out" }, 0);
    scenes[w.dataset.scene]?.(tl, w, hold);
    tl.to(w, { ...SQUASH, skewX: 14, duration: .32, ease: "power3.in" }, hold)
      .to(w, { autoAlpha: 0, duration: .2, ease: "power1.in" }, hold + .12);
    return tl;
  };

  const master = gsap.timeline({ repeat: -1 });
  words.forEach((w, i) => master.add(buildWord(w), i ? "-=.12" : 0));

  const remeasure = () => master.invalidate();
  window.addEventListener("resize", remeasure);
  document.fonts?.ready.then(remeasure);

  new IntersectionObserver(([entry]) =>
    entry.isIntersecting ? master.play() : master.pause()
  ).observe(heroRotator);
}

/* =========================================================
   KlikBaca - tren.js
   Section "Sedang tren": buku yang sedang ramai di Open Library.
   ========================================================= */
(() => {
  const grid = document.getElementById("trenGrid");
  const bar = document.querySelector(".tren-bar");
  const note = document.getElementById("trenNote");
  if (!grid || !bar) return;

  const PERIODE = { daily: "hari ini", weekly: "minggu ini", monthly: "bulan ini" };
  const TAMPIL = 14;
  const cache = {};
  let token = 0;

  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const skeleton = () => Array.from({ length: TAMPIL }, () => `
    <div class="api-book-card skeleton-card" aria-hidden="true">
      <div class="book-cover skeleton"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>`).join("");

  const kartu = (b) => `
    <a class="api-book-card" href="olah.html?id=${encodeURIComponent(String(b.key).replace("/works/", ""))}">
      <div class="book-cover" style="background-image:url('https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg')"></div>
      <p class="book-name">${esc(b.title || "Tanpa judul")}</p>
      <p class="book-author">${esc(b.author_name?.[0] || "Penulis tidak diketahui")}${b.first_publish_year ? ` · ${b.first_publish_year}` : ""}</p>
    </a>`;

  const ambil = async (periode) => {
    if (cache[periode]) return cache[periode];
    const res = await fetch(`https://openlibrary.org/trending/${periode}.json?limit=40`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache[periode] = (data.works || []).filter((b) => b.cover_i && b.key).slice(0, TAMPIL);
    return cache[periode];
  };

  const muat = async (periode) => {
    const saya = ++token;
    grid.setAttribute("aria-busy", "true");
    grid.innerHTML = cache[periode] ? "" : skeleton();
    bar.querySelectorAll(".tren-chip").forEach((c) => {
      const on = c.dataset.period === periode;
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-pressed", String(on));
    });
    if (note) note.textContent = `Buku yang sedang ramai di Open Library ${PERIODE[periode]}. Klik sampul untuk melihat detailnya.`;
    try {
      const buku = await ambil(periode);
      if (saya !== token) return;
      grid.innerHTML = buku.length ? buku.map(kartu).join("") : `<p class="book-message">Belum ada data tren untuk periode ini.</p>`;
    } catch (err) {
      if (saya !== token) return;
      console.error("Gagal memuat tren:", err);
      grid.innerHTML = `<p class="book-message">Daftar tren belum bisa dimuat. Periksa koneksi internet, lalu pilih periode lagi.</p>`;
    } finally {
      if (saya === token) grid.removeAttribute("aria-busy");
    }
  };

  bar.addEventListener("click", (e) => {
    const c = e.target.closest(".tren-chip");
    if (c) muat(c.dataset.period);
  });

  const pantau = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    pantau.disconnect();
    muat(bar.querySelector(".tren-chip.is-on")?.dataset.period || "weekly");
  }, { rootMargin: "300px" });
  pantau.observe(grid);
})();

/* =========================================================
   ANIMASI GSAP (FADE + TYPING)
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    // Typing animasi sub-judul
    const subTitles = document.querySelectorAll(
      ".about-platform-title, .features-main-title, .features-side-desc, .about-title, .services-title, .section-title"
    );

    subTitles.forEach((subtitle) => {
      const textContent = subtitle.textContent.trim();
      subtitle.textContent = "";

      gsap.to(subtitle, {
        text: {
          value: textContent,
          delimiter: ""
        },
        duration: 1.5,
        ease: "none",
        scrollTrigger: {
          trigger: subtitle,
          start: "top 65%",
          once: true
        }
      });
    });

    // Fade-in animasi elemen
    const fadeElements = document.querySelectorAll(
      ".about-platform-grid, .service-card, .feature-card, .borrow-card, .event-col, .statement-grid, .card-text, .faq-container, .about-container"
    );

    fadeElements.forEach((element) => {
      gsap.from(element, {
        opacity: 0,
        y: 55,
        duration: 1.3,
        ease: "power1.out",
        scrollTrigger: {
          trigger: element,
          start: "top 66%",
          once: true
        }
      });
    });
  }
});