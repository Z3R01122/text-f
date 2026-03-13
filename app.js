const DB_NAME = "new-tab-db";
const STORE_NAME = "settings";
const STATE_KEY = "dashboard-state";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchEngine = document.getElementById("search-engine");
const addGridBtn = document.getElementById("add-grid");
const gridWrapper = document.getElementById("grid-wrapper");
const bgUrlInput = document.getElementById("bg-url");
const bgFileInput = document.getElementById("bg-file");
const applyBgBtn = document.getElementById("apply-bg");
const clearBgBtn = document.getElementById("clear-bg");
const statusText = document.getElementById("status");
const settingsToggle = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");

const defaultGrid = () =>
  Array.from({ length: 35 }, (_, idx) => ({
    label: `Slot ${idx + 1}`,
    url: "",
  }));

let state = {
  selectedEngine: searchEngine.value,
  lastQuery: "",
  backgroundImage: "",
  grids: [defaultGrid()],
  settingsOpen: false,
};

function setStatus(message) {
  statusText.textContent = message;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIndexedDb(data) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(data, STATE_KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadFromIndexedDb() {
  const db = await openDb();
  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(STATE_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

function saveToCookie(data) {
  const serialized = encodeURIComponent(JSON.stringify(data));
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `dashboardState=${serialized}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function loadFromCookie() {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("dashboardState="));
  if (!cookie) return null;

  try {
    return JSON.parse(decodeURIComponent(cookie.split("=")[1]));
  } catch {
    return null;
  }
}

async function persistState() {
  try {
    await saveToIndexedDb(state);
    setStatus("Auto-saved to IndexedDB.");
  } catch {
    saveToCookie(state);
    setStatus("IndexedDB unavailable; auto-saved to cookies.");
  }
}

function applyBackground(imageValue) {
  document.body.style.backgroundImage = imageValue ? `url("${imageValue}")` : "none";
}

function syncSettingsPanel() {
  settingsPanel.hidden = !state.settingsOpen;
  settingsToggle.setAttribute("aria-expanded", String(state.settingsOpen));
}

function createSquareButton(gridIndex, itemIndex, item) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "square-btn";
  btn.textContent = item.label || `Slot ${itemIndex + 1}`;
  if (!item.url) {
    btn.classList.add("empty");
  }

  btn.addEventListener("click", () => {
    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }

    const label = window.prompt("Button label", item.label || "");
    if (label === null) return;
    const url = window.prompt("Button URL (include https://)", item.url || "");
    if (url === null) return;

    state.grids[gridIndex][itemIndex] = {
      label: label.trim() || `Slot ${itemIndex + 1}`,
      url: url.trim(),
    };

    renderGrids();
    persistState();
  });

  return btn;
}

function renderGrids() {
  gridWrapper.textContent = "";

  state.grids.forEach((grid, gridIndex) => {
    const block = document.createElement("article");
    block.className = "grid-block";

    const title = document.createElement("p");
    title.className = "grid-title";
    title.textContent = `Grid ${gridIndex + 1}`;

    const squareGrid = document.createElement("div");
    squareGrid.className = "square-grid";

    grid.forEach((item, itemIndex) => {
      squareGrid.appendChild(createSquareButton(gridIndex, itemIndex, item));
    });

    block.append(title, squareGrid);
    gridWrapper.appendChild(block);
  });
}

function mergeState(saved) {
  if (!saved || typeof saved !== "object") return;

  state = {
    ...state,
    ...saved,
    grids:
      Array.isArray(saved.grids) && saved.grids.length
        ? saved.grids.map((grid) =>
            Array.from({ length: 35 }, (_, idx) => ({
              label: grid?.[idx]?.label || `Slot ${idx + 1}`,
              url: grid?.[idx]?.url || "",
            }))
          )
        : state.grids,
  };
}

async function init() {
  try {
    const dbData = await loadFromIndexedDb();
    mergeState(dbData || loadFromCookie());
  } catch {
    mergeState(loadFromCookie());
  }

  searchInput.value = state.lastQuery || "";
  searchEngine.value = state.selectedEngine || searchEngine.value;
  bgUrlInput.value = state.backgroundImage || "";
  applyBackground(state.backgroundImage || "");
  syncSettingsPanel();

  renderGrids();
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const query = searchInput.value.trim();
  if (!query) return;

  state.lastQuery = query;
  state.selectedEngine = searchEngine.value;
  persistState();

  const searchUrl = `${searchEngine.value}${encodeURIComponent(query)}`;
  window.location.href = searchUrl;
});

searchEngine.addEventListener("change", () => {
  state.selectedEngine = searchEngine.value;
  persistState();
});

addGridBtn.addEventListener("click", () => {
  state.grids.push(defaultGrid());
  renderGrids();
  persistState();
});

applyBgBtn.addEventListener("click", () => {
  const url = bgUrlInput.value.trim();
  if (!url && !bgFileInput.files?.length) {
    setStatus("Provide an image URL or choose a file.");
    return;
  }

  if (bgFileInput.files?.length) {
    const reader = new FileReader();
    reader.onload = () => {
      state.backgroundImage = String(reader.result || "");
      bgUrlInput.value = "";
      applyBackground(state.backgroundImage);
      persistState();
    };
    reader.readAsDataURL(bgFileInput.files[0]);
    return;
  }

  state.backgroundImage = url;
  applyBackground(url);
  persistState();
});

clearBgBtn.addEventListener("click", () => {
  state.backgroundImage = "";
  bgUrlInput.value = "";
  bgFileInput.value = "";
  applyBackground("");
  persistState();
});


settingsToggle.addEventListener("click", () => {
  state.settingsOpen = !state.settingsOpen;
  syncSettingsPanel();
  persistState();
});

init();
