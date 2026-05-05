// Reads the current page filename so the script knows which navigation item should be active.
function getPageInfo() {
  const fileName = window.location.pathname.split("/").pop().toLowerCase();
  const isPrivacy = fileName === "privacy.html";
  const isAbout = fileName === "about.html";
  const isHome = !fileName || fileName === "index.html";

  return { isHome, isPrivacy, isAbout };
}

// Builds a homepage section link that works whether the visitor is already on the homepage or another page.
function homeLink(hash) {
  return getPageInfo().isHome ? hash : `index.html${hash}`;
}

const pageInfo = getPageInfo();
const shouldResetHomeOnLoad = pageInfo.isHome && !window.location.hash;
const siteBaseUrl = new URL(".", document.baseURI);
const dataVersion = "20260505-18";

if (shouldResetHomeOnLoad && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Builds stable same-site URLs for GitHub Pages, local servers, and nested detail pages.
function siteUrl(path) {
  return new URL(path, siteBaseUrl).href;
}

// Fetches JSON data with a version query so GitHub Pages and browsers do not serve stale files.
function fetchJson(path) {
  const url = new URL(path, siteBaseUrl);
  url.searchParams.set("v", dataVersion);

  return fetch(url.href).then(response => {
    if (!response.ok) {
      throw new Error(`Could not load ${path}: ${response.status}`);
    }
    return response.json();
  });
}

// Creates the shared fixed header and inserts it into every page that has the siteHeader placeholder.
function renderSiteHeader() {
  const existingHeader = document.querySelector(".site-header");
  const placeholder = document.getElementById("siteHeader");
  const target = placeholder || existingHeader;
  if (!target) return;

  const { isHome, isPrivacy, isAbout } = getPageInfo();
  const header = document.createElement("header");
  header.className = "site-header";
  header.id = "top";
  header.innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="${isHome ? "#top" : "index.html"}" aria-label="Pedal & Peak home">
        <img src="assets/pedal-peak-logo-transparent.png" alt="Pedal & Peak logo" />
        <span class="brand-text">
          <strong>Pedal & Peak</strong>
          <small>Cycling. Hiking. Adventure.</small>
        </span>
      </a>

      <button class="menu-button" id="menuButton" type="button" aria-expanded="false" aria-controls="mainNav" aria-label="Open menu">☰</button>

      <nav class="nav-links" id="mainNav" aria-label="Main navigation">
        <a class="${isHome ? "active" : ""}" href="${homeLink("#top")}" data-nav-section="top">Home</a>
        <a href="${homeLink("#Toolkit")}" data-nav-section="Toolkit">Planning</a>
        <div class="nav-dropdown" id="adventureDropdown">
          <button class="nav-dropdown-button" id="adventureMenuButton" type="button" aria-expanded="false" aria-controls="adventureMenu" data-nav-section="Adventures">
            Adventures
          </button>
          <div class="dropdown-menu" id="adventureMenu" aria-label="Adventure menu">
            <a href="${homeLink("#Adventures")}" data-adventure-filter="all">Latest</a>
            <a href="${homeLink("#Adventures")}" data-adventure-filter="hike">Hikes</a>
            <a href="${homeLink("#Adventures")}" data-adventure-filter="ride">Rides</a>
          </div>
        </div>
        <a href="${homeLink("#Testimonials")}" data-nav-section="Testimonials">Testimonials</a>
        <a class="${isAbout ? "active" : ""}" href="about.html">About</a>
        <a class="${isPrivacy ? "active" : ""}" href="privacy.html">Privacy</a>
        <a href="${homeLink("#contact")}" data-nav-section="contact">Contact</a>
      </nav>

      <div class="header-actions">
        <button class="theme-toggle" id="themeToggle" type="button" aria-label="Turn dark mode on" aria-pressed="false">
          <span class="toggle-knob" aria-hidden="true">
            <svg class="toggle-symbol toggle-sun" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2"></path>
              <path d="M12 20v2"></path>
              <path d="m4.93 4.93 1.41 1.41"></path>
              <path d="m17.66 17.66 1.41 1.41"></path>
              <path d="M2 12h2"></path>
              <path d="M20 12h2"></path>
              <path d="m6.34 17.66-1.41 1.41"></path>
              <path d="m19.07 4.93-1.41 1.41"></path>
            </svg>
            <svg class="toggle-symbol toggle-moon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </span>
        </button>
        <img class="avatar" src="assets/avatar.svg" alt="Jesse profile avatar" />
      </div>
    </div>
  `;

  target.replaceWith(header);
}

renderSiteHeader();

// Creates the shared footer and inserts it into every page that has the siteFooter placeholder.
function renderSiteFooter() {
  const existingFooter = document.querySelector(".site-footer");
  const placeholder = document.getElementById("siteFooter");
  const target = placeholder || existingFooter;
  if (!target) return;

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container footer-inner">
      <span>📍 Philippines / Taiwan</span>
      <span>🚴 Ride. Hike. Respect nature. Leave no trace.</span>
      <span>© 2026 Pedal & Peak — by <strong>Jesse</strong></span>
    </div>
  `;

  target.replaceWith(footer);
}

renderSiteFooter();

const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const siteHeader = document.querySelector(".site-header");
const menuButton = document.getElementById("menuButton");
const nav = document.getElementById("mainNav");
const navLinks = document.querySelectorAll(".nav-links a");
const cardGrid = document.getElementById("cardGrid");
const cardTemplate = document.getElementById("cardTemplate");
const filters = document.querySelectorAll(".filter");
const adventureSearch = document.getElementById("adventureSearch");
const adventureResultCount = document.getElementById("adventureResultCount");
const adventureDropdown = document.getElementById("adventureDropdown");
const adventureMenuButton = document.getElementById("adventureMenuButton");
const navTrackedItems = document.querySelectorAll("[data-nav-section]");
const testimonialCarousel = document.getElementById("testimonialCarousel");
const testimonialTemplate = document.getElementById("testimonialTemplate");
const toolkitGrid = document.getElementById("toolkitGrid");
const testimonialPrev = document.getElementById("testimonialPrev");
const testimonialNext = document.getElementById("testimonialNext");
const testimonialPage = document.getElementById("testimonialPage");
const heroQuoteText = document.getElementById("heroQuoteText");
const heroQuoteAuthor = document.getElementById("heroQuoteAuthor");

let adventures = [];
let currentFilter = "all";
let currentSearch = "";
let testimonials = [];
let tripEssentials = [];
let currentTestimonialPage = 0;
const testimonialsPerPage = 3;
const gpxTrackCache = new Map();
let lastScrollY = window.scrollY;
let headerHideTimer = null;

if (shouldResetHomeOnLoad) {
  history.replaceState(null, "", window.location.pathname || "index.html");
  window.scrollTo(0, 0);
}

// Chooses one quote from data/quotes.json and places it inside the hero section.
function renderRandomHeroQuote(quotes) {
  if (!heroQuoteText || !Array.isArray(quotes) || quotes.length === 0) return;

  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  if (!quote?.text) return;

  heroQuoteText.textContent = `“${quote.text}”`;
  if (heroQuoteAuthor) {
    heroQuoteAuthor.textContent = quote.author || "Pedal & Peak";
  }
}

// Accepts either a plain array or a JSON object with a named array, then returns the usable list.
function getDataList(data, key) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.[key]) ? data[key] : [];
}

// Pulls the activity ID number from GPX filenames like ride_123.gpx, hike_123.gpx, or run_123.gpx.
function getActivityIdFromGpx(gpxPath = "") {
  const fileName = gpxPath.split("/").pop() || "";
  return fileName.match(/^(?:ride|hike|run)_(\d+)\.gpx$/i)?.[1] || "";
}

// Gets an activity ID from the explicit field first, then falls back to the GPX filename.
function getActivityId(item) {
  return item?.activityId || getActivityIdFromGpx(item?.gpx);
}

// Gets the prepared essentials stored in an activity folder's JSON file.
function getAdventureEssentials(item) {
  if (Array.isArray(item?.preparedWith) && item.preparedWith.length) {
    return item.preparedWith.map((essential, index) => ({
      ...essential,
      number: String(index + 1).padStart(2, "0")
    }));
  }

  return [];
}

// Builds the correct detail-page URL for an adventure card.
function getAdventureDetailUrl(item) {
  const detailPage = item.type === "ride" ? "rides.html" : "hikes.html";
  const activityId = getActivityId(item);
  return activityId ? `${detailPage}?activity=${encodeURIComponent(activityId)}` : detailPage;
}

// Returns the per-activity JSON path for a summary item.
function getAdventureDetailDataPath(item) {
  const activityId = getActivityId(item);
  return item?.detail || (activityId ? `adventures/activity_${activityId}/activity.json` : "");
}

// Calculates distance in kilometers between two latitude/longitude points.
function getDistanceKm(start, end) {
  const earthRadiusKm = 6371;
  const toRad = degrees => degrees * Math.PI / 180;
  const dLat = toRad(end.lat - start.lat);
  const dLon = toRad(end.lon - start.lon);
  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Converts raw GPX XML text into track points with distance, speed, elevation, heart rate, and temperature.
function parseGpxTrack(gpxText) {
  const xml = new DOMParser().parseFromString(gpxText, "application/xml");
  const points = Array.from(xml.getElementsByTagNameNS("*", "trkpt")).map(point => ({
    lat: Number(point.getAttribute("lat")),
    lon: Number(point.getAttribute("lon")),
    ele: Number(point.getElementsByTagNameNS("*", "ele")[0]?.textContent || 0),
    time: new Date(point.getElementsByTagNameNS("*", "time")[0]?.textContent || ""),
    heartRate: Number(point.getElementsByTagNameNS("*", "hr")[0]?.textContent || NaN),
    airTemp: Number(point.getElementsByTagNameNS("*", "atemp")[0]?.textContent || NaN)
  })).filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lon));
  let distance = 0;

  return points.map((point, index) => {
    let speed = 0;

    if (index > 0) {
      const segmentDistance = getDistanceKm(points[index - 1], point);
      const elapsedHours = (point.time - points[index - 1].time) / 3600000;
      distance += segmentDistance;
      speed = elapsedHours > 0 ? segmentDistance / elapsedHours : 0;
    }

    return { ...point, distance, speed };
  });
}

// Loads a GPX file once and keeps it in memory so repeated maps/charts do not fetch the same file again.
function loadGpxTrack(gpxPath) {
  if (!gpxTrackCache.has(gpxPath)) {
    gpxTrackCache.set(
      gpxPath,
      fetch(siteUrl(gpxPath))
        .then(response => {
          if (!response.ok) throw new Error(`Could not load ${gpxPath}`);
          return response.text();
        })
        .then(parseGpxTrack)
    );
  }

  return gpxTrackCache.get(gpxPath);
}

// Finds the minimum and maximum latitude, longitude, elevation, speed, heart rate, and air temperature in a track.
function getTrackBounds(track) {
  return track.reduce((bounds, point) => ({
    minLat: Math.min(bounds.minLat, point.lat),
    maxLat: Math.max(bounds.maxLat, point.lat),
    minLon: Math.min(bounds.minLon, point.lon),
    maxLon: Math.max(bounds.maxLon, point.lon),
    minEle: Math.min(bounds.minEle, point.ele),
    maxEle: Math.max(bounds.maxEle, point.ele),
    minSpeed: Math.min(bounds.minSpeed, point.speed),
    maxSpeed: Math.max(bounds.maxSpeed, point.speed),
    minHeartRate: Number.isFinite(point.heartRate) ? Math.min(bounds.minHeartRate, point.heartRate) : bounds.minHeartRate,
    maxHeartRate: Number.isFinite(point.heartRate) ? Math.max(bounds.maxHeartRate, point.heartRate) : bounds.maxHeartRate,
    minAirTemp: Number.isFinite(point.airTemp) ? Math.min(bounds.minAirTemp, point.airTemp) : bounds.minAirTemp,
    maxAirTemp: Number.isFinite(point.airTemp) ? Math.max(bounds.maxAirTemp, point.airTemp) : bounds.maxAirTemp
  }), {
    minLat: Infinity,
    maxLat: -Infinity,
    minLon: Infinity,
    maxLon: -Infinity,
    minEle: Infinity,
    maxEle: -Infinity,
    minSpeed: Infinity,
    maxSpeed: -Infinity,
    minHeartRate: Infinity,
    maxHeartRate: -Infinity,
    minAirTemp: Infinity,
    maxAirTemp: -Infinity
  });
}

// Converts GPX track coordinates into SVG polyline points for the fallback mini map.
function getSvgTrackPoints(track, width, height) {
  const bounds = getTrackBounds(track);
  const lonRange = bounds.maxLon - bounds.minLon || 1;
  const latRange = bounds.maxLat - bounds.minLat || 1;

  return track.map(point => {
    const x = ((point.lon - bounds.minLon) / lonRange) * width;
    const y = height - ((point.lat - bounds.minLat) / latRange) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

// Draws a simple SVG route map when Leaflet is not available.
function renderFallbackTrackMap(container, track) {
  const points = getSvgTrackPoints(track, 320, 190);
  container.innerHTML = `
    <svg class="fallback-track-map" viewBox="0 0 320 190" aria-hidden="true">
      <rect width="320" height="190" rx="0" fill="currentColor" opacity=".08"></rect>
      <polyline points="${points}" fill="none" stroke="#111" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".62"></polyline>
      <polyline points="${points}" fill="none" stroke="#D2ED69" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
  `;
}

// Draws the route on a Leaflet/OpenStreetMap map when Leaflet is available.
function renderLeafletMap(container, track) {
  if (!window.L || !track.length) {
    renderFallbackTrackMap(container, track);
    return;
  }

  const latLngs = track.map(point => [point.lat, point.lon]);
  const map = L.map(container, {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    touchZoom: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
  }).addTo(map);
  L.polyline(latLngs, { color: "#1E1D30", weight: 10, opacity: .68 }).addTo(map);
  L.polyline(latLngs, { color: "#D2ED69", weight: 6, opacity: 1 }).addTo(map);
  const fitRoute = () => map.fitBounds(latLngs, { padding: [52, 52], maxZoom: 14 });
  fitRoute();
  map.whenReady(() => {
    map.invalidateSize();
    fitRoute();
  });
  setTimeout(() => {
    map.invalidateSize();
    fitRoute();
  }, 250);
}

// Pulls one chartable metric series from a GPX track and optionally removes zero values.
function getMetricValues(track, key, onlyPositive = false) {
  return track
    .map(point => ({
      distance: Number(point.distance) || 0,
      value: Number(point[key])
    }))
    .filter(point => Number.isFinite(point.value) && (!onlyPositive || point.value > 0));
}

// Renders one compact SVG chart card for elevation, speed, heart rate, or air temperature.
function renderMetricChart(track, { key, title, unit = "", onlyPositive = false, precision = 0 }) {
  const values = getMetricValues(track, key, onlyPositive);
  if (values.length < 2) return "";

  const width = 360;
  const height = 140;
  const padding = 28;
  const bottomPadding = 26;
  const minDistance = values[0].distance;
  const maxDistance = values[values.length - 1].distance || 1;
  const rawValues = values.map(point => point.value);
  const minValue = Math.min(...rawValues);
  const maxValue = Math.max(...rawValues);
  const valueRange = maxValue - minValue || 1;
  const distanceRange = maxDistance - minDistance || 1;
  const formatValue = value => `${value.toFixed(precision)}${unit}`;
  const formatDistance = value => `${value.toFixed(value >= 10 ? 0 : 1)} km`;
  const points = values.map(point => {
    const x = padding + ((point.distance - minDistance) / distanceRange) * (width - padding * 2);
    const y = height - bottomPadding - ((point.value - minValue) / valueRange) * (height - padding - bottomPadding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const axisBottom = height - bottomPadding;
  const areaPoints = `${padding},${axisBottom} ${points} ${width - padding},${axisBottom}`;

  return `
    <article class="detail-chart-card">
      <div class="detail-chart-heading">
        <span>${title}</span>
        <strong>${formatValue(maxValue)}</strong>
      </div>
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${title} chart">
        <line class="detail-chart-axis" x1="${padding}" y1="${padding}" x2="${padding}" y2="${axisBottom}"></line>
        <line class="detail-chart-axis" x1="${padding}" y1="${axisBottom}" x2="${width - padding}" y2="${axisBottom}"></line>
        <text class="detail-chart-axis-label detail-chart-y-max" x="${padding + 6}" y="${padding + 4}">${formatValue(maxValue)}</text>
        <text class="detail-chart-axis-label detail-chart-y-min" x="${padding + 6}" y="${axisBottom - 2}">${formatValue(minValue)}</text>
        <text class="detail-chart-axis-label" x="${padding}" y="${height - 6}">${formatDistance(minDistance)}</text>
        <text class="detail-chart-axis-label detail-chart-x-max" x="${width - padding}" y="${height - 6}">${formatDistance(maxDistance)}</text>
        <polygon points="${areaPoints}" opacity=".22"></polygon>
        <polyline points="${points}" fill="none"></polyline>
      </svg>
      <div class="detail-chart-meta">
        <span>Low ${formatValue(minValue)}</span>
        <span>High ${formatValue(maxValue)}</span>
      </div>
    </article>
  `;
}

// Renders all available GPX metric charts into the activity detail page.
function renderRouteCharts(track) {
  const chartGrid = document.getElementById("detailCharts");
  if (!chartGrid || !track.length) return;

  const charts = [
    renderMetricChart(track, { key: "ele", title: "Elevation", unit: " m", precision: 0 }),
    renderMetricChart(track, { key: "speed", title: "Speed", unit: " km/h", onlyPositive: true, precision: 1 }),
    renderMetricChart(track, { key: "heartRate", title: "Heart rate", unit: " bpm", onlyPositive: true, precision: 0 }),
    renderMetricChart(track, { key: "airTemp", title: "Air temp", unit: "°C", onlyPositive: true, precision: 0 })
  ].filter(Boolean);

  chartGrid.innerHTML = charts.join("");
  chartGrid.hidden = charts.length === 0;
}

// Builds the HTML for the activity photo carousel and delays loading hidden images.
function renderActivityImageCarousel(images = [], title = "Adventure") {
  if (!Array.isArray(images) || images.length === 0) {
    return `
      <section class="activity-carousel is-empty" aria-label="${title} photo carousel">
        <div class="activity-carousel-viewport"></div>
        <div class="activity-carousel-dots" aria-hidden="true"></div>
      </section>
    `;
  }

  const slides = images.map((src, index) => `
    <figure class="activity-slide ${index === 0 ? "is-active" : ""}" data-slide-index="${index}">
      <img ${index === 0 ? `src="${src}" fetchpriority="high"` : `data-src="${src}"`} alt="${title} photo ${index + 1}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async" />
    </figure>
  `).join("");
  const dots = images.map((_, index) => `
    <button class="activity-carousel-dot ${index === 0 ? "is-active" : ""}" type="button" data-slide-index="${index}" aria-label="Show photo ${index + 1}"></button>
  `).join("");

  return `
    <section class="activity-carousel" aria-label="${title} photo carousel">
      <div class="activity-carousel-viewport">
        ${slides}
        <button class="activity-carousel-button activity-carousel-prev" type="button" aria-label="Previous photo">&lt;</button>
        <button class="activity-carousel-button activity-carousel-next" type="button" aria-label="Next photo">&gt;</button>
      </div>
      <div class="activity-carousel-dots" aria-label="Photo carousel navigation">${dots}</div>
    </section>
  `;
}

// Adds previous/next/dot controls to the activity image carousel.
function initActivityImageCarousel(container) {
  const carousel = container.querySelector(".activity-carousel");
  if (!carousel || carousel.classList.contains("is-empty")) return;

  const slides = Array.from(carousel.querySelectorAll(".activity-slide"));
  const dots = Array.from(carousel.querySelectorAll(".activity-carousel-dot"));
  const previous = carousel.querySelector(".activity-carousel-prev");
  const next = carousel.querySelector(".activity-carousel-next");
  let currentIndex = 0;

  // Loads a slide image only when it is needed.
  function loadSlideImage(index) {
    const slide = slides[index];
    const image = slide?.querySelector("img[data-src]");
    if (!image) return;

    image.src = image.dataset.src;
    image.removeAttribute("data-src");
  }

  // Loads the current image plus the previous and next images for smoother navigation.
  function preloadNearbyImages(index) {
    loadSlideImage(index);
    loadSlideImage((index + 1) % slides.length);
    loadSlideImage((index - 1 + slides.length) % slides.length);
  }

  // Shows one carousel slide and hides the rest.
  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    preloadNearbyImages(currentIndex);
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentIndex);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
    });
  }

  previous?.addEventListener("click", () => showSlide(currentIndex - 1));
  next?.addEventListener("click", () => showSlide(currentIndex + 1));
  dots.forEach(dot => {
    dot.addEventListener("click", () => showSlide(Number(dot.dataset.slideIndex)));
  });
  preloadNearbyImages(currentIndex);
}

// Replaces a card's static image with a route map when the adventure has a GPX file.
function renderGpxCard(item, card) {
  if (!item.gpx || !card) return;

  const image = card.querySelector(".card-image");
  const mapContainer = card.querySelector(".card-map");

  card.classList.add("has-gpx");
  image?.classList.add("is-hidden");

  loadGpxTrack(item.gpx)
    .then(track => {
      if (mapContainer) renderLeafletMap(mapContainer, track);
    })
    .catch(() => {
      card.classList.remove("has-gpx");
      image?.classList.remove("is-hidden");
    });
}

// Gets the YouTube video ID from a normal YouTube link.
function getYoutubeVideoId(videoUrl) {
  if (!videoUrl) return "";

  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/").filter(Boolean)[1] || "";
      } else {
        videoId = url.searchParams.get("v") || "";
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return "";
    return videoId;
  } catch {
    return "";
  }
}

// Converts a normal YouTube URL into an embeddable iframe URL.
function getYoutubeEmbedUrl(videoUrl) {
  const videoId = getYoutubeVideoId(videoUrl);
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1&autoplay=1` : "";
}

// Keeps text safe when used inside an HTML attribute.
function escapeAttribute(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Builds the optional embedded YouTube video block for an adventure detail page.
function renderAdventureVideo(videoUrl, title) {
  const embedUrl = getYoutubeEmbedUrl(videoUrl);
  const videoId = getYoutubeVideoId(videoUrl);
  if (!embedUrl) {
    return `
      <div class="adventure-video is-empty">
        <p class="chart-label">Ride video</p>
        <div class="youtube-frame"></div>
      </div>
    `;
  }

  return `
    <div class="adventure-video">
      <p class="chart-label">Ride video</p>
      <button class="youtube-frame youtube-lite" type="button" data-youtube-embed="${escapeAttribute(embedUrl)}" data-youtube-title="${escapeAttribute(`${title} video`)}" aria-label="Play ${escapeAttribute(title)} video">
        <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="" loading="lazy" decoding="async" aria-hidden="true" />
        <span class="youtube-play-button" aria-hidden="true"></span>
      </button>
    </div>
  `;
}

// Replaces the rounded thumbnail with the real YouTube iframe after the visitor clicks play.
function initYoutubeEmbeds(container) {
  container.querySelectorAll(".youtube-lite").forEach(button => {
    button.addEventListener("click", () => {
      const frame = document.createElement("div");
      const iframe = document.createElement("iframe");
      frame.className = "youtube-frame is-loaded";
      iframe.src = button.dataset.youtubeEmbed;
      iframe.title = button.dataset.youtubeTitle || "YouTube video";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      frame.appendChild(iframe);
      button.replaceWith(frame);
    }, { once: true });
  });
}

// Builds a compact stats panel for the activity detail page.
function renderAdventureMiniStats(adventure) {
  return `
    <div class="adventure-mini-stats" aria-label="Activity summary">
      <span><strong>${adventure.date}</strong><small>Date</small></span>
      <span><strong>${adventure.distance}</strong><small>Distance</small></span>
      <span><strong>${adventure.time}</strong><small>Moving Time</small></span>
    </div>
  `;
}

// Shows the planning icons connected to an adventure card or detail page.
function renderAdventureEssentialIcons(adventure, compact = false) {
  const essentials = getAdventureEssentials(adventure).slice(0, 6);
  if (!essentials.length) return "";

  return `
    <div class="${compact ? "card-essential-icons" : "adventure-essential-icons"}" aria-label="Suggested essentials">
      <strong>Prepared with:</strong>
      ${essentials.map(item => `
        <span class="adventure-essential-icon" title="${item.number} ${item.title || "Essential"}">
          <span aria-hidden="true">${item.icon || "✓"}</span>
          <small>${item.title || "Essential"}</small>
        </span>
      `).join("")}
    </div>
  `;
}

// Builds the written story section for a ride or hike detail page.
function renderAdventureStory(adventure) {
  const paragraphs = Array.isArray(adventure.story) && adventure.story.length
    ? adventure.story
    : [
      "This adventure is a placeholder story for now, but it gives the page the same shape that future real ride and hike stories will use. The goal is to capture not only the numbers from the GPX file, but also the feeling of the day: the weather, the route, the climb, the quiet moments, and the small details that make the activity worth remembering.",
      "Later, this section can include what happened during the ride or hike, where the route started, what felt difficult, what surprised you, and what you would tell another person who wants to try the same route."
    ];

  return `
    <section class="adventure-story-panel">
      <p class="eyebrow">Story</p>
      <h2>The day on the route</h2>
      ${paragraphs.map(paragraph => `<p>${paragraph}</p>`).join("")}
    </section>
  `;
}

// Locks the story panel and video column to the graph-column bottom so long stories scroll internally.
function syncAdventureDetailHeight(container) {
  const card = container.querySelector(".adventure-detail-card");
  const copy = container.querySelector(".adventure-detail-copy");
  const media = container.querySelector(".adventure-detail-media");
  const narrative = container.querySelector(".adventure-narrative-grid");
  const story = container.querySelector(".adventure-story-panel");
  const video = container.querySelector(".adventure-video");
  if (!card || !copy || !media || !story) return;

  const setHeight = () => {
    if (!window.matchMedia("(min-width: 1101px)").matches) {
      card.style.removeProperty("--detail-column-height");
      card.style.removeProperty("--story-panel-height");
      media.style.removeProperty("height");
      narrative?.style.removeProperty("height");
      narrative?.style.removeProperty("max-height");
      story.style.removeProperty("height");
      story.style.removeProperty("max-height");
      story.style.removeProperty("overflow-y");
      return;
    }

    const visibleCopyChildren = Array.from(copy.children).filter(child => {
      const rect = child.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const copyRect = copy.getBoundingClientRect();
    const finalCopyChild = visibleCopyChildren[visibleCopyChildren.length - 1];
    const finalCopyRect = finalCopyChild?.getBoundingClientRect();
    const columnHeight = Math.ceil(finalCopyRect ? finalCopyRect.bottom - copyRect.top : copyRect.height);
    const rowGap = parseFloat(getComputedStyle(media).rowGap || getComputedStyle(media).gap) || 0;
    const videoFrame = video?.querySelector(".youtube-frame");
    const videoFallbackHeight = video ? Math.ceil((media.getBoundingClientRect().width * 9 / 16) + 34) : 0;
    const videoHeight = video ? Math.ceil(Math.max(
      video.getBoundingClientRect().height,
      videoFrame?.getBoundingClientRect().height || 0,
      videoFallbackHeight
    )) : 0;
    const storyHeight = Math.max(260, columnHeight - videoHeight - rowGap);

    card.style.setProperty("--detail-column-height", `${columnHeight}px`);
    card.style.setProperty("--story-panel-height", `${storyHeight}px`);
    media.style.height = `${columnHeight}px`;
    if (narrative) {
      narrative.style.height = `${storyHeight}px`;
      narrative.style.maxHeight = `${storyHeight}px`;
    }
    story.style.height = `${storyHeight}px`;
    story.style.maxHeight = `${storyHeight}px`;
    story.style.overflowY = "scroll";
  };

  requestAnimationFrame(setHeight);
  setTimeout(setHeight, 250);
  setTimeout(setHeight, 900);
  window.addEventListener("resize", () => requestAnimationFrame(setHeight), { passive: true });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => requestAnimationFrame(setHeight));
    observer.observe(copy);
    if (video) observer.observe(video);
  }

  container.querySelectorAll("img").forEach(image => {
    if (!image.complete) {
      image.addEventListener("load", () => requestAnimationFrame(setHeight), { once: true });
    }
  });
}

// Builds the full ride/hike detail page: text, video, map, chart, and photo carousel.
function renderAdventureDetail(adventure, container) {
  container.classList.add("activity-detail-layout");
  container.closest(".simple-page")?.classList.add("activity-page");
  container.innerHTML = `
    <article class="adventure-detail-card">
      <div class="adventure-detail-copy">
        <p class="eyebrow">${adventure.type}</p>
        <h1>${adventure.title}</h1>
        ${renderAdventureMiniStats(adventure)}
        ${renderAdventureEssentialIcons(adventure)}
        <p>${adventure.description}</p>
        ${renderActivityImageCarousel(adventure.images, adventure.title)}
        <div class="detail-map" id="detailMap"></div>
        <div class="detail-chart-grid" id="detailCharts" hidden></div>
      </div>
      <div class="adventure-detail-media">
        <div class="adventure-narrative-grid has-no-video">
          ${renderAdventureStory(adventure)}
        </div>
        ${renderAdventureVideo(adventure.youtube, adventure.title)}
      </div>
    </article>
  `;

  initActivityImageCarousel(container);
  initYoutubeEmbeds(container);
  syncAdventureDetailHeight(container);

  if (!adventure.gpx) return;

  loadGpxTrack(adventure.gpx)
    .then(track => {
      renderLeafletMap(document.getElementById("detailMap"), track);
      renderRouteCharts(track);
      syncAdventureDetailHeight(container);
    })
    .catch(() => {
      const map = document.getElementById("detailMap");
      if (map) {
        map.textContent = "Could not load GPX map for this activity.";
      }
    });
}

// Reads the activity ID from the URL, finds its index entry, then loads that activity folder's JSON.
function initAdventureDetailPage() {
  const detailRoot = document.getElementById("adventureDetail");
  if (!detailRoot) return;

  const activityId = new URLSearchParams(window.location.search).get("activity");
  if (!activityId) return;

  fetchJson("data/adventures-index.json")
    .then(data => {
      const pageType = detailRoot.dataset.type;
      const items = getDataList(data, "adventures");
      const adventure = items.find(item => {
        return item.type === pageType && getActivityId(item) === activityId;
      });

      if (!adventure) {
        detailRoot.innerHTML = `
          <article class="simple-card">
            <p class="eyebrow">${pageType}</p>
            <h1>Activity not found</h1>
            <p>No ${pageType} matched activity_${activityId}. Return to the homepage and choose another card.</p>
            <p><a href="index.html#Adventures">View latest adventures</a></p>
          </article>
        `;
        return;
      }

      return fetchJson(getAdventureDetailDataPath(adventure))
        .then(detailData => {
          renderAdventureDetail({ ...adventure, ...detailData }, detailRoot);
        });
    })
    .catch(() => {
      detailRoot.innerHTML = `
        <article class="simple-card">
          <p class="eyebrow">Error</p>
          <h1>Could not load activity</h1>
          <p>The adventure data could not be loaded right now.</p>
        </article>
      `;
    });
}

// Applies a lazy-loaded background image to a page or section.
function loadLazyBackground(element) {
  const imagePath = element.dataset.bg;
  if (!imagePath) return;

  const targetProperty = element === document.body ? "--page-bg-image" : "--section-bg";
  element.style.setProperty(targetProperty, `url("${imagePath}")`);
  element.classList.add("bg-loaded");
}

// Lazily loads section/page backgrounds, while loading priority backgrounds right away.
function initLazySectionBackgrounds() {
  const lazySections = document.querySelectorAll(".has-section-bg[data-bg], .has-page-bg[data-bg]");
  if (!lazySections.length) return;

  lazySections.forEach(section => {
    if (section.classList.contains("bg-priority")) {
      loadLazyBackground(section);
    }
  });

  if (!("IntersectionObserver" in window)) {
    lazySections.forEach(loadLazyBackground);
    return;
  }

  const observer = new IntersectionObserver((entries, sectionObserver) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      loadLazyBackground(entry.target);
      sectionObserver.unobserve(entry.target);
    });
  }, { rootMargin: "450px 0px" });

  lazySections.forEach(section => {
    if (!section.classList.contains("bg-loaded")) {
      observer.observe(section);
    }
  });
}

initLazySectionBackgrounds();
initAdventureDetailPage();

// THEME TOGGLE LOGIC
// Updates the theme toggle label so screen readers know whether dark mode is on or off.
function updateThemeIcon() {
  if (!themeToggle) return;

  if (body.classList.contains("dark-mode")) {
    themeToggle.setAttribute("aria-label", "Turn dark mode off");
    themeToggle.setAttribute("aria-pressed", "true");
  } else {
    themeToggle.setAttribute("aria-label", "Turn dark mode on");
    themeToggle.setAttribute("aria-pressed", "false");
  }
}
const savedTheme = localStorage.getItem("pedalPeakTheme");
if (savedTheme === "dark") {
  body.classList.add("dark-mode");
}
updateThemeIcon();
themeToggle?.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  localStorage.setItem("pedalPeakTheme", body.classList.contains("dark-mode") ? "dark" : "light");
  updateThemeIcon();
});

// MENU BUTTON
menuButton?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

adventureMenuButton?.addEventListener("click", event => {
  event.stopPropagation();
  adventureDropdown?.classList.remove("is-click-closed");

  if (!getPageInfo().isHome) {
    window.location.href = "index.html#Adventures";
    return;
  }

  const isOpen = adventureDropdown.classList.toggle("open");
  adventureMenuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

document.addEventListener("click", event => {
  if (!adventureDropdown?.contains(event.target)) {
    adventureDropdown?.classList.remove("open");
    adventureDropdown?.classList.remove("is-click-closed");
    adventureMenuButton?.setAttribute("aria-expanded", "false");
  }
});

// Removes active styling from all main navigation links.
function clearNavActive() {
  navLinks.forEach(item => item.classList.remove("active"));
  adventureMenuButton?.classList.remove("active");
}

// Marks the navigation item that matches the current section.
function setActiveNav(sectionId) {
  clearNavActive();
  if (sectionId === "Adventures") {
    adventureMenuButton?.classList.add("active");
    return;
  }

  const activeItem = Array.from(navTrackedItems).find(item => item.dataset.navSection === sectionId);
  activeItem?.classList.add("active");
}

// Checks whether the hero is still visible enough to keep the auto-hide header shown.
function isHeroVisible() {
  const hero = document.querySelector(".hero");
  if (!hero) return window.scrollY < 40;

  const heroBottom = hero.getBoundingClientRect().bottom;
  return heroBottom > window.innerHeight * 0.34;
}

// Reveals the fixed header.
function showSiteHeader() {
  siteHeader?.classList.remove("is-hidden");
}

// Hides the fixed header when the visitor is away from the hero and the mobile menu is closed.
function hideSiteHeader() {
  if (!siteHeader || isHeroVisible() || nav?.classList.contains("open")) return;
  siteHeader.classList.add("is-hidden");
}

// Delays header hiding so it does not disappear immediately after a navigation click or upward scroll.
function scheduleHeaderHide(delay = 650) {
  window.clearTimeout(headerHideTimer);
  headerHideTimer = window.setTimeout(hideSiteHeader, delay);
}

// Shows or hides the fixed header based on scroll direction and hero visibility.
function updateAutoHideHeader() {
  if (!siteHeader) return;

  const currentY = window.scrollY;
  const isScrollingUp = currentY < lastScrollY - 4;
  const isScrollingDown = currentY > lastScrollY + 4;
  lastScrollY = currentY;

  if (isHeroVisible() || isScrollingUp || currentY < 12) {
    showSiteHeader();
    if (!isHeroVisible() && isScrollingUp) scheduleHeaderHide(1100);
    return;
  }

  if (isScrollingDown) {
    hideSiteHeader();
  }
}

// Smoothly scrolls to a section without reserving space for the overlay header.
function scrollToSection(target, hash, replaceHash = false) {
  if (!target) return;

  requestAnimationFrame(() => {
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  });

  if (hash) {
    const historyMethod = replaceHash ? "replaceState" : "pushState";
    history[historyMethod](null, "", hash);
  }
}

// NAV LINK ACTIVE STATE
navLinks.forEach(link => {
  link.addEventListener("click", event => {
    const href = link.getAttribute("href");
    const adventureFilter = link.dataset.adventureFilter;

    clearNavActive();
    adventureDropdown?.classList.remove("open");
    adventureMenuButton?.setAttribute("aria-expanded", "false");
    nav?.classList.remove("open");

    if (adventureFilter) {
      adventureMenuButton?.classList.add("active");
      adventureDropdown?.classList.add("is-click-closed");
      window.setTimeout(() => adventureDropdown?.classList.remove("is-click-closed"), 450);
      setAdventureFilter(adventureFilter);
    } else {
      adventureDropdown?.classList.remove("is-click-closed");
      link.classList.add("active");
    }

    if (href === "#top") {
      event.preventDefault();
      showSiteHeader();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", "#top");
    } else if (href?.startsWith("#")) {
      const target = document.querySelector(href);
      if (target) {
        event.preventDefault();
        scrollToSection(target, href);
        scheduleHeaderHide(900);
      }
    }
  });
});

siteHeader?.addEventListener("mouseenter", showSiteHeader);
siteHeader?.addEventListener("focusin", showSiteHeader);

document.addEventListener("pointermove", event => {
  if (event.clientY <= 18) {
    showSiteHeader();
  }
});

window.addEventListener("scroll", updateAutoHideHeader, { passive: true });
updateAutoHideHeader();

// Watches scroll position and updates the active navigation item on the homepage.
function initScrollSpy() {
  if (!getPageInfo().isHome) return;

  const watchedSections = [
    { id: "top", element: document.querySelector(".hero") },
    { id: "Toolkit", element: document.getElementById("Toolkit") },
    { id: "Adventures", element: document.getElementById("Adventures") },
    { id: "Testimonials", element: document.getElementById("Testimonials") },
    { id: "contact", element: document.getElementById("contact") }
  ].filter(item => item.element);

  // Chooses the section currently closest to the visitor's reading position.
  function updateScrollSpy() {
    const readingLine = window.scrollY + Math.min(window.innerHeight * 0.18, 160);
    let currentSection = "top";

    watchedSections.forEach(item => {
      const sectionTop = item.element.getBoundingClientRect().top + window.scrollY;
      if (sectionTop <= readingLine) {
        currentSection = item.id;
      }
    });

    setActiveNav(currentSection);
  }

  window.addEventListener("scroll", updateScrollSpy, { passive: true });
  window.addEventListener("resize", updateScrollSpy);
  updateScrollSpy();
}

initScrollSpy();

// Changes the adventure filter and redraws the cards.
function setAdventureFilter(filter) {
  currentFilter = filter;
  filters.forEach(button => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderCards(currentFilter);
}

// Builds the searchable text used by the adventure search box.
function getAdventureSearchText(item) {
  return [
    item.title,
    item.type,
    item.date,
    item.distance,
    item.elevation,
    item.time,
    item.description,
    ...(Array.isArray(item.story) ? item.story : [])
  ].join(" ").toLowerCase();
}

// Applies the current type filter and search query to the adventure list.
function getFilteredAdventures(filter = "all") {
  const query = currentSearch.trim().toLowerCase();
  return adventures.filter(item => {
    const matchesFilter = filter === "all" || item.type === filter;
    const matchesSearch = !query || getAdventureSearchText(item).includes(query);
    return matchesFilter && matchesSearch;
  });
}

// Updates the small adventure count line under the section title.
function updateAdventureResultCount(count) {
  if (!adventureResultCount) return;

  const typeLabel = currentFilter === "all" ? "adventure" : currentFilter;
  const plural = count === 1 ? typeLabel : `${typeLabel}s`;
  adventureResultCount.textContent = currentSearch
    ? `${count} matching ${plural}`
    : `${count} ${plural} ready to explore`;
}

// Stores the current search text and redraws the adventure cards.
function updateAdventureSearch(value) {
  currentSearch = value;
  renderCards(currentFilter);
}

// Renders the planning essentials infographic cards.
function renderTripEssentials(items) {
  if (!toolkitGrid) return;

  const essentials = Array.isArray(items) && items.length ? items : [];
  tripEssentials = essentials;
  toolkitGrid.innerHTML = essentials.map((item, index) => `
    <article class="toolkit-card">
      <span class="toolkit-icon" aria-hidden="true">${item.icon || "✓"}</span>
      <span class="toolkit-number">${String(index + 1).padStart(2, "0")}</span>
      <h3>${item.title || "Essential"}</h3>
      <p>${item.description || ""}</p>
    </article>
  `).join("");

  if (cardGrid && cardTemplate && adventures.length) {
    renderCards(currentFilter);
  }
}

// Returns the inline SVG icon for a testimonial social platform.
function getSocialIcon(platform) {
  const icons = {
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3 0-5 2-5 5v2H6v4h3v5h4v-5h3l1-4h-4V9c0-.6.4-1 1-1Z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.8 4 12 4 12 4s-3.8 0-6.7.2c-.4.1-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2 9 2 10.8v1.7c0 1.8.4 3.6.4 3.6s.2 1.5.8 2.1c.8.8 1.9.8 2.4.9 1.7.2 6.4.2 6.4.2s3.8 0 6.7-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.4-1.8.4-3.6v-1.7c0-1.8-.4-3.6-.4-3.6ZM10 14.8V8.9l5.2 3-5.2 2.9Z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3c.3 2.4 1.7 4 4 4.3v3.6c-1.5 0-2.8-.4-4-1.2v5.6c0 3.3-2.4 5.7-5.8 5.7A5.2 5.2 0 0 1 4 15.8c0-3 2.4-5.3 5.4-5.3.4 0 .8 0 1.1.1v3.8a2.4 2.4 0 0 0-1.1-.2 1.7 1.7 0 1 0 1.7 1.7V3h3.9Z"/></svg>'
  };

  return icons[platform] || "";
}

// Creates one social link for a testimonial card.
function renderSocialLink(platform, href) {
  const link = document.createElement("a");
  link.href = href || "#";
  link.setAttribute("aria-label", platform);
  link.innerHTML = getSocialIcon(platform);

  if (href && href !== "#") {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  return link;
}

// Renders the current page of testimonial cards.
function renderTestimonials() {
  if (!testimonialCarousel || !testimonialTemplate) return;

  testimonialCarousel.innerHTML = "";
  const totalPages = Math.max(1, Math.ceil(testimonials.length / testimonialsPerPage));
  currentTestimonialPage = Math.min(currentTestimonialPage, totalPages - 1);

  const start = currentTestimonialPage * testimonialsPerPage;
  const currentTestimonials = testimonials.slice(start, start + testimonialsPerPage);

  currentTestimonials.forEach(item => {
    const clone = testimonialTemplate.content.cloneNode(true);
    const image = clone.querySelector(".testimonial-image");
    const socials = clone.querySelector(".social-icons");

    clone.querySelector(".testimonial-name").textContent = item.name;
    clone.querySelector(".testimonial-title").textContent = item.title;
    clone.querySelector(".testimonial-text").textContent = item.text;
    image.src = item.image || "assets/avatar.svg";
    image.alt = `${item.name} photo`;

    ["facebook", "youtube", "tiktok"].forEach(platform => {
      socials.appendChild(renderSocialLink(platform, item.socials?.[platform]));
    });

    testimonialCarousel.appendChild(clone);
  });

  if (testimonialPage) {
    testimonialPage.textContent = `Page ${currentTestimonialPage + 1} of ${totalPages}`;
  }

  if (testimonialPrev) {
    testimonialPrev.disabled = currentTestimonialPage === 0;
  }

  if (testimonialNext) {
    testimonialNext.disabled = currentTestimonialPage >= totalPages - 1;
  }
}

testimonialPrev?.addEventListener("click", () => {
  if (currentTestimonialPage > 0) {
    currentTestimonialPage -= 1;
    renderTestimonials();
  }
});

testimonialNext?.addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(testimonials.length / testimonialsPerPage));
  if (currentTestimonialPage < totalPages - 1) {
    currentTestimonialPage += 1;
    renderTestimonials();
  }
});

// Scrolls to the page hash after JSON content has loaded.
function scrollToHashTarget() {
  const hash = window.location.hash;
  if (!hash) return;

  if (hash === "#top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const target = document.querySelector(hash);
  scrollToSection(target, hash, true);
}

// Renders adventure cards from the lightweight adventure index and applies the selected filter.
function renderCards(filter = "all") {
  if (!cardGrid || !cardTemplate) return;

  cardGrid.innerHTML = "";
  const filtered = getFilteredAdventures(filter);
  updateAdventureResultCount(filtered.length);

  if (!filtered.length) {
    cardGrid.innerHTML = `
      <div class="empty-state">
        <h3>No adventures found</h3>
        <p>Try a different keyword or switch back to all adventures.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const clone = cardTemplate.content.cloneNode(true);
    const badge = clone.querySelector(".badge");
    const image = clone.querySelector(".card-image");
    const cardLink = clone.querySelector(".card-button");

    cardLink.href = getAdventureDetailUrl(item);
    cardLink.setAttribute("aria-label", `Open ${item.title} ${item.type} page`);
    image.src = item.image;
    image.alt = item.title;
    badge.textContent = item.type;
    badge.classList.add(item.type === "ride" ? "badge-ride" : "badge-hike");
    clone.querySelector(".date-badge").textContent = item.date;
    clone.querySelector(".distance").textContent = item.distance;
    clone.querySelector("h3").textContent = item.title;
    clone.querySelector(".card-description").textContent = item.description;
    clone.querySelector(".card-essential-icons").outerHTML = renderAdventureEssentialIcons(item, true);
    clone.querySelector(".elevation").textContent = item.elevation;
    clone.querySelector(".time").textContent = item.time;

    cardGrid.appendChild(clone);
    renderGpxCard(item, cardGrid.lastElementChild);
  });
}

filters.forEach(button => {
  button.addEventListener("click", () => {
    setAdventureFilter(button.dataset.filter);
  });
});

adventureSearch?.addEventListener("input", () => {
  updateAdventureSearch(adventureSearch.value);
});

if (heroQuoteText) {
  fetchJson("data/quotes.json")
    .then(data => renderRandomHeroQuote(getDataList(data, "quotes")))
    .catch(() => {
      heroQuoteText.textContent = "“The best views come after the hardest climbs.”";
      if (heroQuoteAuthor) {
        heroQuoteAuthor.textContent = "Jesse";
      }
    });
}

if (cardGrid && cardTemplate) {
  fetchJson("data/adventures-index.json")
    .then(data => {
      const summaries = getDataList(data, "adventures");
      return Promise.all(summaries.map(item => {
        const detailPath = getAdventureDetailDataPath(item);
        return detailPath
          ? fetchJson(detailPath).then(detail => ({ ...item, ...detail })).catch(() => item)
          : Promise.resolve(item);
      }));
    })
    .then(items => {
      adventures = items;
      renderCards(currentFilter);
      scrollToHashTarget();
    })
    .catch(() => {
      adventures = [];
      cardGrid.innerHTML = "<p>Could not load adventure data. Open through a local server or upload to GitHub Pages.</p>";
      updateAdventureResultCount(0);
      scrollToHashTarget();
    });
}

if (testimonialCarousel && testimonialTemplate) {
  fetchJson("data/testimonials.json")
    .then(data => {
      testimonials = getDataList(data, "testimonials");
      renderTestimonials();
      scrollToHashTarget();
    })
    .catch(() => {
      testimonials = [];
      testimonialCarousel.innerHTML = "<p>Could not load testimonials data. Open through a local server or upload to GitHub Pages.</p>";
      if (testimonialPage) {
        testimonialPage.textContent = "Page 0 of 0";
      }
      if (testimonialPrev) testimonialPrev.disabled = true;
      if (testimonialNext) testimonialNext.disabled = true;
      scrollToHashTarget();
    });
}

if (toolkitGrid) {
  fetchJson("data/trip-essentials.json")
    .then(data => renderTripEssentials(getDataList(data, "essentials")))
    .catch(() => {
      toolkitGrid.innerHTML = "<p>Could not load trip essentials.</p>";
    });
}

// Extracts a number from text like "4.2 km" or "44 m".
function getNumber(value) {
  return Number(String(value).replace(/[^0-9.]/g, "")) || 0;
}

// Breaks total minutes into readable year/month/day/hour/minute parts.
function formatDurationParts(totalMinutes) {
  const roundedMinutes = Math.round(totalMinutes);
  const minutesPerHour = 60;
  const minutesPerDay = minutesPerHour * 24;
  const minutesPerMonth = minutesPerDay * 30;
  const minutesPerYear = minutesPerDay * 365;
  const units = [
    { label: "y", minutes: minutesPerYear },
    { label: "mo", minutes: minutesPerMonth },
    { label: "d", minutes: minutesPerDay },
    { label: "h", minutes: minutesPerHour },
    { label: "m", minutes: 1 }
  ];
  let remainingMinutes = roundedMinutes;

  return units
    .map(unit => {
      const value = Math.floor(remainingMinutes / unit.minutes);
      remainingMinutes %= unit.minutes;
      return { value, label: unit.label };
    })
    .filter((part, index, parts) => part.value > 0 || index === parts.length - 1);
}

// Converts total minutes into the styled moving-time HTML shown in the stats bar.
function renderDuration(totalMinutes) {
  return formatDurationParts(totalMinutes)
    .map(part => `${part.value}<small class="stat-value-unit">${part.label}</small>`)
    .join(' ');
}

// Loads adventure data and calculates the homepage stats bar totals.
async function loadAdventureStats() {
  if (!document.getElementById("totalRides")) return;

  try {
    const adventuresData = await fetchJson("data/adventures-index.json");
    const adventures = getDataList(adventuresData, "adventures");

    let totalRides = 0;
    let totalHikes = 0;
    let totalDistance = 0;
    let totalElevation = 0;
    let totalMovingMinutes = 0;

    adventures.forEach((adventure) => {
      const type = String(adventure.type || "").toLowerCase();

      if (type === "ride") totalRides++;
      if (type === "hike") totalHikes++;

      totalDistance += getNumber(adventure.distance);
      totalElevation += getNumber(adventure.elevation);
      totalMovingMinutes += getNumber(adventure.time);
    });

    document.getElementById("totalRides").innerHTML = `${totalRides} <small class="stat-value-unit">Rides</small>`;
    document.getElementById("totalHikes").innerHTML = `${totalHikes} <small class="stat-value-unit">Hikes</small>`;
    document.getElementById("totalDistance").innerHTML = `${totalDistance.toFixed(1)} <small class="stat-value-unit">km</small>`;
    document.getElementById("totalElevation").innerHTML = `${Math.round(totalElevation).toLocaleString()} <small class="stat-value-unit">m</small>`;
    document.getElementById("totalTime").innerHTML = renderDuration(totalMovingMinutes);

  } catch (error) {
    console.error("Could not load adventure stats:", error);
  }
}

loadAdventureStats();
