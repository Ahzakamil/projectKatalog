/* =========================================================
   KlikBaca - script.js (dipakai di index.html & hasil.html)
   Data buku: Open Library API (gratis, tanpa API key)
   ========================================================= */

// ---------- PENGATURAN ----------
const RESULTS_PAGE = "hasil.html";           // fungsi: nama halaman hasil | guna: tujuan perpindahan saat orang mencari buku
const DETAIL_PAGE = "olah.html";             // fungsi: nama halaman detail | guna: halaman yang terbuka saat sampul buku diklik

// ---------- PERALATAN KECIL ----------
const $ = (id) => document.getElementById(id);   // fungsi: singkatan getElementById | guna: kode jadi lebih pendek
const bookBox = $("book");                       // fungsi: ambil wadah grid buku | guna: hanya ada di hasil.html
const searchInput = $("searchInput");            // fungsi: ambil kolom pencarian | guna: membaca kata kunci
const searchBtn = $("searchBtn");                // fungsi: ambil tombol Cari | guna: memicu pencarian saat diklik
const resultTitle = $("resultTitle");            // fungsi: ambil judul hasil | guna: hanya ada di hasil.html
const resultCount = $("resultCount");            // fungsi: ambil teks jumlah hasil | guna: hanya ada di hasil.html
const isResultsPage = Boolean(resultTitle);      // fungsi: cek apakah ini hasil.html | guna: supaya kode bisa dipakai di dua halaman

let requestId = 0;                               // fungsi: penghitung permintaan | guna: mencegah hasil lama menimpa hasil yang lebih baru

const escapeHTML = (str = "") =>                 // fungsi: ubah karakter berbahaya jadi aman | guna: mencegah teks dari API merusak halaman (XSS)
  String(str).replace(/[&<>"']/g, (c) => ({      // fungsi: cari karakter & < > " ' | guna: tiap karakter diganti kode aman
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

// "/works/OL45883W" -> "olah.html?id=OL45883W"
const detailLink = (key = "") =>                                                    // fungsi: buat link ke halaman detail | guna: sampul bisa diklik
  `${DETAIL_PAGE}?id=${encodeURIComponent(key.replace("/works/", ""))}`;            // fungsi: buang "/works/" dari ID | guna: ID bersih di alamat

// ---------- KARTU BUKU ----------
const renderBook = (book) => {                                                      // fungsi: bikin HTML satu kartu buku | guna: dipakai untuk semua buku
  const title = escapeHTML(book.title || "Tanpa judul");                            // fungsi: ambil judul yang aman | guna: cadangan bila judul kosong
  const author = escapeHTML(book.author_name?.[0] || "Penulis tidak diketahui");    // fungsi: ambil penulis pertama | guna: cadangan bila kosong
  const year = book.first_publish_year ? ` · ${book.first_publish_year}` : "";      // fungsi: tahun terbit | guna: hanya tampil kalau datanya ada
  const link = detailLink(book.key);                                                // fungsi: link detail | guna: tujuan klik kartu
  const hasCover = Boolean(book.cover_i);                                           // fungsi: cek ada sampul atau tidak | guna: menentukan tampilan kotak
  const coverStyle = hasCover                                                       // fungsi: siapkan gambar sampul | guna: dipasang sebagai background kotak
    ? `style="background-image:url('https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg')"`
    : "";                                                                           // fungsi: tanpa sampul = tanpa style | guna: kotak dibiarkan kosong, tanpa tulisan

  return `
 <a class="api-book-card" href="${link}">
    <div class="book-cover" ${coverStyle}></div>
    <p class="book-name">${title}</p>
    <p class="book-author">${author}${year}</p>
  </a>`;                                                                            // fungsi: susun kartu | guna: class sesuai style.css
};

// ---------- SKELETON SHIMMER ----------
const renderSkeleton = (count = 14) =>                         // fungsi: bikin kerangka kartu abu-abu | guna: tampil selama buku dimuat
  Array.from({ length: count }, () => `
 <div class="api-book-card skeleton-card" aria-hidden="true">
    <div class="book-cover skeleton"></div>
    <div class="skeleton skeleton-line"></div>
    <div class="skeleton skeleton-line short"></div>
  </div>`).join("");                                           // fungsi: ulang sebanyak count lalu gabung | guna: jumlahnya sama dengan kartu asli

// ---------- AMBIL & TAMPILKAN BUKU (hasil.html) ----------
const loadBooks = async (keyword = "novel", limit = 28) => {   // fungsi: ambil buku dari API | guna: dipakai di hasil.html
  if (!bookBox) return 0;                                      // fungsi: berhenti kalau wadah tidak ada | guna: aman di halaman lain

  const myId = ++requestId;                                    // fungsi: nomor permintaan ini | guna: tanda untuk membuang hasil lama
  bookBox.setAttribute("aria-busy", "true");                   // fungsi: tandai sedang memuat | guna: info untuk pembaca layar
  bookBox.innerHTML = renderSkeleton(limit);                   // fungsi: tampilkan skeleton | guna: ganti teks "Memuat..." dengan efek shimmer

  try {
    const url =
      `https://openlibrary.org/search.json?q=${encodeURIComponent(keyword)}` +      // fungsi: kata kunci pencarian | guna: aman dipakai di alamat
      `&limit=${limit}` +                                                           // fungsi: jumlah hasil | guna: batas buku ditampilkan
      `&fields=key,title,author_name,first_publish_year,cover_i`;                   // fungsi: hanya minta data yang dipakai | guna: respons lebih ringan

    const response = await fetch(url);                         // fungsi: kirim permintaan ke API | guna: mengambil data buku
    if (!response.ok) throw new Error(`HTTP ${response.status}`);   // fungsi: lempar error kalau gagal | guna: masuk ke blok catch
    const data = await response.json();                        // fungsi: ubah respons jadi objek | guna: data siap dipakai

    if (myId !== requestId) return 0;                          // fungsi: cek ada pencarian lebih baru | guna: buang hasil yang sudah usang

    const docs = data.docs || [];                              // fungsi: daftar buku (kosong bila tak ada) | guna: mencegah error
    if (!docs.length) {                                        // fungsi: cek hasil kosong | guna: tampilkan pesan ramah
      bookBox.innerHTML = `<p class="book-message">Buku "${escapeHTML(keyword)}" tidak ditemukan. Coba kata kunci lain.</p>`;
      return 0;
    }
    bookBox.innerHTML = docs.map(renderBook).join("");         // fungsi: ubah tiap buku jadi kartu | guna: ganti skeleton dengan buku asli
    return data.numFound || docs.length;                       // fungsi: kembalikan jumlah buku | guna: dipakai untuk teks "Ditemukan ... buku"

  } catch (error) {
    if (myId !== requestId) return 0;                          // fungsi: abaikan error permintaan lama | guna: tidak menimpa hasil baru
    console.error("Error fetching books:", error);             // fungsi: catat error di konsol | guna: memudahkan pencarian masalah
    bookBox.innerHTML = `<p class="book-message">Terjadi kesalahan saat mengambil data. Periksa koneksi internet lalu coba lagi.</p>`;
    return 0;
  } finally {
    if (myId === requestId) bookBox.removeAttribute("aria-busy");   // fungsi: lepas tanda memuat | guna: loading selesai
  }
};

// ---------- PENCARIAN ----------
const doSearch = () => {                                       // fungsi: jalankan pencarian | guna: dipanggil ikon cari / tombol Enter
  const keyword = searchInput.value.trim();                    // fungsi: ambil teks tanpa spasi pinggir | guna: kata kunci bersih
  if (!keyword) return;                                        // fungsi: berhenti kalau kosong | guna: cegah pencarian kosong
  window.location.href = `${RESULTS_PAGE}?q=${encodeURIComponent(keyword)}`;   // fungsi: pindah ke halaman hasil | guna: kata kunci dikirim lewat alamat
};

if (searchInput) {                                             // fungsi: pastikan kolom pencarian ada | guna: aman di halaman tanpa pencarian
  searchBtn?.addEventListener("click", doSearch);              // fungsi: klik ikon kaca pembesar (bila ada) | guna: menjalankan pencarian
  searchInput.addEventListener("keydown", (e) => {             // fungsi: pantau tombol keyboard | guna: cari dengan Enter
    if (e.key === "Enter") doSearch();
  });
}

// ---------- SAAT HALAMAN HASIL DIBUKA ----------
if (isResultsPage) {                                           // fungsi: khusus hasil.html | guna: baca kata kunci dari alamat
  const keyword = (new URLSearchParams(window.location.search).get("q") || "").trim();   // fungsi: ambil ?q=... | guna: tahu apa yang dicari

  if (!keyword) {                                              // fungsi: tidak ada kata kunci | guna: beri petunjuk
    resultTitle.textContent = "Cari buku";
    if (bookBox) bookBox.innerHTML = `<p class="book-message">Ketik judul, penulis, atau topik di kolom pencarian.</p>`;
  } else {
    if (searchInput) searchInput.value = keyword;              // fungsi: isi kolom pencarian | guna: kata kunci tetap terlihat
    document.title = `${keyword} - KlikBaca`;                  // fungsi: ubah judul tab | guna: tab menunjukkan apa yang dicari
    resultTitle.textContent = `Hasil untuk "${keyword}"`;      // fungsi: ubah judul halaman | guna: konfirmasi pencarian

    loadBooks(keyword, 28).then((total) => {                   // fungsi: muat 28 buku | guna: halaman hasil lebih banyak dari beranda
      if (total && resultCount) {
        resultCount.textContent = `Ditemukan ${total.toLocaleString("id-ID")} buku, menampilkan 28 teratas.`;   // fungsi: tulis jumlah hasil | guna: info total buku
      }
    });
  }
}

/* =========================================================
   NAVBAR: menu hamburger
   ========================================================= */
const navbar = $("navbar");                                    // fungsi: ambil navbar | guna: class "open" dipasang di sini untuk buka/tutup menu
const navToggle = $("navToggle");                              // fungsi: ambil tombol hamburger | guna: pemicu buka/tutup menu

if (navbar && navToggle) {                                     // fungsi: pastikan keduanya ada | guna: aman di halaman lain
  const setMenu = (open) => {                                  // fungsi: buka atau tutup menu | guna: satu fungsi dipakai semua pemicu
    navbar.classList.toggle("open", open);                     // fungsi: pasang/cabut class open | guna: CSS menampilkan atau menyembunyikan menu
    navToggle.setAttribute("aria-expanded", String(open));     // fungsi: info status menu | guna: pembaca layar tahu menu terbuka/tertutup
    navToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");   // fungsi: ganti label tombol | guna: label sesuai fungsinya
  };
  navToggle.addEventListener("click", () => setMenu(!navbar.classList.contains("open")));   // fungsi: klik hamburger | guna: balik status menu
  document.querySelectorAll(".nav-links a").forEach((a) =>    // fungsi: loop semua link menu | guna: tutup menu setelah link dipilih
    a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });   // fungsi: tombol Esc | guna: tutup menu lewat keyboard
  document.addEventListener("click", (e) => { if (!navbar.contains(e.target)) setMenu(false); });   // fungsi: klik di luar navbar | guna: menu tertutup sendiri, tidak menutupi halaman
}

/* =========================================================
   HERO: kata terakhir judul yang berganti (GSAP)
   ========================================================= */
const heroRotator = $("heroRotator");                          // fungsi: ambil wadah kata yang berganti | guna: tempat semua kata bertumpuk
const canAnimate = Boolean(window.gsap) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;   // fungsi: cek GSAP termuat & gerakan diizinkan | guna: bila tidak, kata pertama tampil diam

if (heroRotator && canAnimate) {                               // fungsi: jalan hanya di halaman yang punya hero | guna: aman di hasil.html
  const words = [...heroRotator.querySelectorAll(".rw")];      // fungsi: daftar kata | guna: dirangkai jadi satu putaran
  const pick = (el, sel) => el.querySelectorAll(sel);          // fungsi: singkatan querySelectorAll | guna: kode adegan lebih pendek
  const SQUASH = { scaleX: 1.3, scaleY: .25 };                 // fungsi: bentuk "gepeng dan melebar" | guna: kata masuk/keluar seperti morph

  gsap.defaults({ overwrite: "auto" });                        // fungsi: tween baru menggantikan yang bertabrakan | guna: tidak ada gerakan saling tarik
  gsap.set(words, { transformOrigin: "0% 85%" });              // fungsi: titik tumpu di kiri dekat garis dasar | guna: kata melebar ke kanan
  gsap.set(pick(heroRotator, ".rw-text"), { transformOrigin: "50% 85%" });   // fungsi: titik tumpu teks | guna: miring dan denyut tebal terlihat natural
  gsap.set(pick(heroRotator, ".rw-bar"), { xPercent: -50 });   // fungsi: toolbar berada di tengah kata | guna: pengganti translate di CSS
  gsap.set(pick(heroRotator, ".rw-fill"), { yPercent: -50 });  // fungsi: panel warna sejajar tengah kata | guna: sama seperti di atas

  const scenes = {
    select(tl, w, hold) {                                      // fungsi: seret-sorot, lalu ganti warna lewat panel ala Figma, lalu tebal | guna: kata "mudah"
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
    circle(tl, w, hold) {                                      // fungsi: garis digambar melingkar pelan, kursor menelusurinya | guna: kata "cepat"
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
    cursors(tl, w, hold) {                                     // fungsi: kursor kolaborator bermunculan | guna: kata "praktis" dan "nyaman"
      const tags = pick(w, ".rw-tag");
      tl.set(tags, { y: 0 }, 0)
        .fromTo(tags, { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .3, ease: "back.out(2.4)", stagger: .25 }, .4)
        .to(tags, { y: 3, duration: 1, ease: "sine.inOut", yoyo: true, repeat: 1, stagger: .25 }, .4)
        .to(tags, { autoAlpha: 0, duration: .25 }, hold - .45);
    },
  };

  const buildWord = (w) => {                                   // fungsi: rakit timeline satu kata | guna: masuk -> adegan -> keluar
    const hold = (Number(w.dataset.hold) || 3000) / 1000;
    const tl = gsap.timeline();
    tl.fromTo(w, { ...SQUASH, skewX: -14 }, { scaleX: 1, scaleY: 1, skewX: 0, duration: .7, ease: "expo.out" }, 0)
      .fromTo(w, { autoAlpha: 0 }, { autoAlpha: 1, duration: .25, ease: "power1.out" }, 0);
    scenes[w.dataset.scene]?.(tl, w, hold);
    tl.to(w, { ...SQUASH, skewX: 14, duration: .32, ease: "power3.in" }, hold)
      .to(w, { autoAlpha: 0, duration: .2, ease: "power1.in" }, hold + .12);
    return tl;
  };

  const master = gsap.timeline({ repeat: -1 });                // fungsi: satu putaran tanpa henti | guna: semua kata bergantian
  words.forEach((w, i) => master.add(buildWord(w), i ? "-=.12" : 0));

  const remeasure = () => master.invalidate();                 // fungsi: hitung ulang ukuran kata | guna: gerak kursor ikut lebar kata setelah layar/font berubah
  window.addEventListener("resize", remeasure);
  document.fonts?.ready.then(remeasure);

  new IntersectionObserver(([entry]) =>                        // fungsi: pantau apakah hero terlihat | guna: animasi berhenti saat hero di luar layar
    entry.isIntersecting ? master.play() : master.pause()
  ).observe(heroRotator);
}

/* =========================================================
   KlikBaca - tren.js
   Section "Sedang tren": buku yang sedang ramai di Open Library.
   Data: https://openlibrary.org/trending/{daily|weekly|monthly}.json
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

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. NAVBAR TOGGLE (Navigasi Mobile)
  // ==========================================
  const navToggle = document.getElementById("navToggle");
  const navbar = document.getElementById("navbar");

  if (navToggle && navbar) {
    navToggle.addEventListener("click", () => {
      const isOpen = navbar.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen);
    });
  }


  // ==========================================
  // 3. ANIMASI GSAP (HANYA FADE + TYPING)
  // ==========================================
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, TextPlugin);


    // A. ANIMASI TYPING (Khusus Sub-Judul Section)
    const subTitles = document.querySelectorAll(  ".about-platform-title, .features-main-title, .features-side-desc,.about-title,.services-title,.section-title");

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

    // B. ANIMASI FADE-IN (Muncul Perlahan Saat Di-Scroll)
    const fadeElements = document.querySelectorAll(
      ".about-platform-grid, .service-card, .feature-card, .borrow-card, .event-col, .statement-grid, .card-text, .faq-container,.about-container"
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