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
const shouldResetHomeOnLoad = pageInfo.isHome;

if (shouldResetHomeOnLoad && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
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
        <img src="assets/pedal-peak-logo.png" alt="Pedal & Peak logo" />
        <span class="brand-text">
          <strong>Pedal & Peak</strong>
          <small>Cycling. Hiking. Adventure.</small>
        </span>
      </a>

      <button class="menu-button" id="menuButton" type="button" aria-expanded="false" aria-controls="mainNav" aria-label="Open menu">☰</button>

      <nav class="nav-links" id="mainNav" aria-label="Main navigation">
        <a class="${isHome ? "active" : ""}" href="${homeLink("#top")}" data-nav-section="top">Home</a>
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
const menuButton = document.getElementById("menuButton");
const nav = document.getElementById("mainNav");
const navLinks = document.querySelectorAll(".nav-links a");
const cardGrid = document.getElementById("cardGrid");
const cardTemplate = document.getElementById("cardTemplate");
const filters = document.querySelectorAll(".filter");
const adventureDropdown = document.getElementById("adventureDropdown");
const adventureMenuButton = document.getElementById("adventureMenuButton");
const navTrackedItems = document.querySelectorAll("[data-nav-section]");
const testimonialCarousel = document.getElementById("testimonialCarousel");
const testimonialTemplate = document.getElementById("testimonialTemplate");
const testimonialPrev = document.getElementById("testimonialPrev");
const testimonialNext = document.getElementById("testimonialNext");
const testimonialPage = document.getElementById("testimonialPage");
const heroQuoteText = document.getElementById("heroQuoteText");
const heroQuoteAuthor = document.getElementById("heroQuoteAuthor");
const statElements = {
  totalRides: document.getElementById("totalRides"),
  totalHikes: document.getElementById("totalHikes"),
  totalDistance: document.getElementById("totalDistance"),
  totalElevation: document.getElementById("totalElevation"),
  totalTime: document.getElementById("totalTime")
};

let adventures = [];
let currentFilter = "all";
let testimonials = [];
let currentTestimonialPage = 0;
const testimonialsPerPage = 3;
const gpxTrackCache = new Map();

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

// Builds the correct detail-page URL for an adventure card.
function getAdventureDetailUrl(item) {
  const detailPage = item.type === "ride" ? "rides.html" : "hikes.html";
  const activityId = getActivityIdFromGpx(item.gpx);
  return activityId ? `${detailPage}?activity=${encodeURIComponent(activityId)}` : detailPage;
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
      fetch(gpxPath)
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
  map.fitBounds(latLngs, { padding: [18, 18] });
}

// Finds the lowest and highest value for one chart metric.
function getMetricRange(track, key) {
  const values = track.map(point => point[key]).filter(Number.isFinite);
  if (!values.length) return { min: 0, max: 1 };

  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? { min: min - 1, max: max + 1 } : { min, max };
}

// Converts one chart metric into SVG polyline points.
function getMetricPolyline(track, key, width, height, padding) {
  const range = getMetricRange(track, key);
  const totalDistance = track[track.length - 1]?.distance || 1;
  const chartPadding = typeof padding === "number"
    ? { top: padding, right: padding, bottom: padding, left: padding }
    : padding;

  return track
    .filter(point => Number.isFinite(point[key]))
    .map(point => {
      const x = chartPadding.left + (point.distance / totalDistance) * (width - chartPadding.left - chartPadding.right);
      const y = height - chartPadding.bottom - ((point[key] - range.min) / (range.max - range.min)) * (height - chartPadding.top - chartPadding.bottom);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

// Draws the detail-page chart with elevation, speed, heart rate, air temperature, and distance.
function renderActivityMetricsChart(container, track) {
  if (!track.length) return;

  const width = 960;
  const height = 220;
  const padding = { top: 18, right: 24, bottom: 36, left: 54 };
  const metrics = [
    { key: "ele", color: "#E2572B", label: "Elevation", slug: "elevation" },
    { key: "speed", color: "#D2ED69", label: "Speed", slug: "speed" },
    { key: "heartRate", color: "#E0CDFF", label: "Heart rate", slug: "heart-rate" },
    { key: "airTemp", color: "#FFE251", label: "Air temp", slug: "air-temp" },
    { key: "distance", color: "#FDC2F5", label: "Distance", slug: "distance" }
  ];
  const totalDistance = track[track.length - 1]?.distance || 0;
  const elevationRange = getMetricRange(track, "ele");
  const xTicks = [0, .25, .5, .75, 1].map(ratio => {
    const x = padding.left + ratio * (width - padding.left - padding.right);
    const label = `${(totalDistance * ratio).toFixed(totalDistance >= 10 ? 0 : 1)}km`;
    return { x, label };
  });
  const yTicks = [0, .25, .5, .75, 1].map(ratio => {
    const y = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
    const value = elevationRange.min + ratio * (elevationRange.max - elevationRange.min);
    return { y, label: `${Math.round(value)}m` };
  });
  const grid = [
    ...xTicks.map(tick => `<line x1="${tick.x.toFixed(1)}" y1="${padding.top}" x2="${tick.x.toFixed(1)}" y2="${height - padding.bottom}" stroke="currentColor" opacity=".08"></line>`),
    ...yTicks.map(tick => `<line x1="${padding.left}" y1="${tick.y.toFixed(1)}" x2="${width - padding.right}" y2="${tick.y.toFixed(1)}" stroke="currentColor" opacity=".08"></line>`)
  ].join("");
  const labels = [
    ...xTicks.map(tick => `<text x="${tick.x.toFixed(1)}" y="${height - 10}" text-anchor="middle">${tick.label}</text>`),
    ...yTicks.map(tick => `<text x="${padding.left - 10}" y="${(tick.y + 4).toFixed(1)}" text-anchor="end">${tick.label}</text>`)
  ].join("");
  const lines = metrics.map(metric => {
    const points = getMetricPolyline(track, metric.key, width, height, padding);
    if (!points) return "";
    return `<polyline class="metric-line metric-${metric.slug}" data-metric="${metric.slug}" points="${points}" fill="none" stroke="${metric.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><title>${metric.label}</title></polyline>`;
  }).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="currentColor" opacity=".04"></rect>
      <g class="chart-grid">${grid}</g>
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="currentColor" opacity=".28"></line>
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="currentColor" opacity=".28"></line>
      ${lines}
      <g class="chart-axis-labels">${labels}</g>
    </svg>
  `;
}

// Lets the user show or hide each chart line by clicking the legend buttons.
function initMetricToggles(container) {
  const toggles = container.querySelectorAll(".metric-toggle");
  const chart = container.querySelector(".detail-elevation-chart");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      const metric = toggle.dataset.metric;
      const line = chart?.querySelector(`[data-metric="${metric}"]`);
      const willShow = !toggle.classList.contains("is-active");

      toggle.classList.toggle("is-active", willShow);
      toggle.setAttribute("aria-pressed", String(willShow));
      line?.classList.toggle("is-hidden", !willShow);
    });

    toggle.setAttribute("aria-pressed", "true");
  });
}

// Builds the HTML for the activity photo carousel and delays loading hidden images.
function renderActivityImageCarousel(images = [], title = "Adventure") {
  if (!Array.isArray(images) || images.length === 0) return "";

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
        <button class="activity-carousel-button activity-carousel-prev" type="button" aria-label="Previous photo">Previous</button>
        <button class="activity-carousel-button activity-carousel-next" type="button" aria-label="Next photo">Next</button>
      </div>
      <div class="activity-carousel-dots" aria-label="Photo carousel navigation">${dots}</div>
    </section>
  `;
}

// Adds previous/next/dot controls to the activity image carousel.
function initActivityImageCarousel(container) {
  const carousel = container.querySelector(".activity-carousel");
  if (!carousel) return;

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

// Gets the image list for one activity ID from data/activity-images.json.
function getActivityImages(data, activityId) {
  return Array.isArray(data?.activities?.[activityId]) ? data.activities[activityId] : [];
}

// Converts a normal YouTube URL into an embeddable iframe URL.
function getYoutubeEmbedUrl(videoUrl) {
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
    return `https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1`;
  } catch {
    return "";
  }
}

// Builds the optional embedded YouTube video block for an adventure detail page.
function renderAdventureVideo(videoUrl, title) {
  const embedUrl = getYoutubeEmbedUrl(videoUrl);
  if (!embedUrl) return "";
  const safeVideoUrl = videoUrl.replace(/"/g, "&quot;");

  return `
    <div class="adventure-video">
      <p class="chart-label">Ride video</p>
      <div class="youtube-frame">
        <iframe src="${embedUrl}" title="${title} video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>
      <a class="youtube-fallback-link" href="${safeVideoUrl}" target="_blank" rel="noopener">Open video on YouTube</a>
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
    <article class="adventure-story-card">
      <p class="eyebrow">Story</p>
      <h2>The day on the route</h2>
      ${paragraphs.map(paragraph => `<p>${paragraph}</p>`).join("")}
    </article>
  `;
}

// Builds the full ride/hike detail page: text, video, map, chart, and photo carousel.
function renderAdventureDetail(adventure, container, activityImages = []) {
  container.innerHTML = `
    <article class="adventure-detail-card">
      <div class="adventure-detail-copy">
        <p class="eyebrow">${adventure.type}</p>
        <h1>${adventure.title}</h1>
        <p>${adventure.description}</p>
        <div class="adventure-detail-meta">
          <span>${adventure.date}</span>
          <span>${adventure.distance}</span>
          <span>${adventure.elevation} gain</span>
          <span>${adventure.time}</span>
        </div>
      </div>
      <div class="adventure-detail-media">
        ${renderAdventureVideo(adventure.youtube, adventure.title)}
        <div class="detail-map" id="detailMap"></div>
        <div>
          <p class="chart-label">Activity metrics from GPX</p>
          <div class="metric-legend" aria-label="Chart legend">
            <button class="metric-toggle is-active" type="button" data-metric="elevation"><i class="legend-elevation"></i>Elevation</button>
            <button class="metric-toggle is-active" type="button" data-metric="speed"><i class="legend-speed"></i>Speed</button>
            <button class="metric-toggle is-active" type="button" data-metric="heart-rate"><i class="legend-heart-rate"></i>Heart rate</button>
            <button class="metric-toggle is-active" type="button" data-metric="air-temp"><i class="legend-air-temp"></i>Air temp</button>
            <button class="metric-toggle is-active" type="button" data-metric="distance"><i class="legend-distance"></i>Distance</button>
          </div>
          <div class="detail-elevation-chart elevation-chart" id="detailElevationChart" role="img" aria-label="Elevation profile"></div>
        </div>
      </div>
    </article>
    ${renderAdventureStory(adventure)}
    ${renderActivityImageCarousel(activityImages, adventure.title)}
  `;

  initActivityImageCarousel(container);

  if (!adventure.gpx) return;

  loadGpxTrack(adventure.gpx)
    .then(track => {
      renderLeafletMap(document.getElementById("detailMap"), track);
      renderActivityMetricsChart(document.getElementById("detailElevationChart"), track);
      initMetricToggles(container);
    })
    .catch(() => {
      const map = document.getElementById("detailMap");
      if (map) {
        map.textContent = "Could not load GPX map for this activity.";
      }
    });
}

// Reads the activity ID from the URL and loads the matching ride or hike into the detail page.
function initAdventureDetailPage() {
  const detailRoot = document.getElementById("adventureDetail");
  if (!detailRoot) return;

  const activityId = new URLSearchParams(window.location.search).get("activity");
  if (!activityId) return;

  Promise.all([
    fetch("data/adventures.json").then(response => response.json()),
    fetch("data/activity-images.json").then(response => response.ok ? response.json() : { activities: {} }).catch(() => ({ activities: {} }))
  ])
    .then(([data, imageData]) => {
      const pageType = detailRoot.dataset.type;
      const items = getDataList(data, "adventures");
      const adventure = items.find(item => {
        return item.type === pageType && getActivityIdFromGpx(item.gpx) === activityId;
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

      renderAdventureDetail(adventure, detailRoot, getActivityImages(imageData, activityId));
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
  const isOpen = adventureDropdown.classList.toggle("open");
  adventureMenuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

document.addEventListener("click", event => {
  if (!adventureDropdown?.contains(event.target)) {
    adventureDropdown?.classList.remove("open");
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
  const activeItem = Array.from(navTrackedItems).find(item => item.dataset.navSection === sectionId);
  activeItem?.classList.add("active");
}

// Smoothly scrolls to a section while accounting for the fixed header height.
function scrollToSection(target, hash, replaceHash = false) {
  if (!target) return;

  requestAnimationFrame(() => {
    const headerOffset = document.querySelector(".site-header")?.offsetHeight || 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset + 2;
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
      setAdventureFilter(adventureFilter);
    } else {
      link.classList.add("active");
    }

    if (href === "#top") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", "#top");
    } else if (href?.startsWith("#")) {
      const target = document.querySelector(href);
      if (target) {
        event.preventDefault();
        scrollToSection(target, href);
      }
    }
  });
});

// Watches scroll position and updates the active navigation item on the homepage.
function initScrollSpy() {
  if (!getPageInfo().isHome) return;

  const watchedSections = [
    { id: "top", element: document.querySelector(".hero") },
    { id: "Adventures", element: document.getElementById("Adventures") },
    { id: "Testimonials", element: document.getElementById("Testimonials") },
    { id: "contact", element: document.getElementById("contact") }
  ].filter(item => item.element);

  // Chooses the section currently closest to the visitor's reading position.
  function updateScrollSpy() {
    const headerOffset = document.querySelector(".site-header")?.offsetHeight || 0;
    const readingLine = window.scrollY + headerOffset + window.innerHeight * 0.32;
    let currentSection = "top";

    watchedSections.forEach(item => {
      if (item.element.offsetTop <= readingLine) {
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

// Renders adventure cards from data/adventures.json and applies the selected filter.
function renderCards(filter = "all") {
  if (!cardGrid || !cardTemplate) return;

  cardGrid.innerHTML = "";
  const filtered = filter === "all" ? adventures : adventures.filter(item => item.type === filter);

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

if (heroQuoteText) {
  fetch("data/quotes.json")
    .then(response => response.json())
    .then(data => renderRandomHeroQuote(getDataList(data, "quotes")))
    .catch(() => {
      heroQuoteText.textContent = "“The best views come after the hardest climbs.”";
      if (heroQuoteAuthor) {
        heroQuoteAuthor.textContent = "Jesse";
      }
    });
}

if (cardGrid && cardTemplate) {
  fetch("data/adventures.json")
    .then(response => response.json())
    .then(data => {
      adventures = getDataList(data, "adventures");
      renderCards(currentFilter);
      scrollToHashTarget();
    })
    .catch(() => {
      adventures = [];
      cardGrid.innerHTML = "<p>Could not load adventure data. Open through a local server or upload to GitHub Pages.</p>";
      scrollToHashTarget();
    });
}

if (testimonialCarousel && testimonialTemplate) {
  fetch("data/testimonials.json")
    .then(response => response.json())
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
  try {
    const response = await fetch("./data/adventures.json");

    if (!response.ok) {
      throw new Error("Could not load adventures.json");
    }

    const adventuresData = await response.json();
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
