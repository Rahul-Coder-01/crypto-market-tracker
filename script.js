
// ==========================================
// 1. GET HTML ELEMENTS
// ==========================================

const coinContainer = document.getElementById("coinContainer");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const empty = document.getElementById("empty");

const detailView = document.getElementById("detailView");
const sectionTitle = document.getElementById("sectionTitle");

const refreshBtn = document.getElementById("refreshBtn");
const watchlistBtn = document.getElementById("watchlistBtn");
const homeBtn = document.getElementById("homeBtn");

// ==========================================
// 2. API URL AND VARIABLES
// ==========================================

const API_URL = "https://api.coingecko.com/api/v3";

let currentCoins = [];
let watchlist = [];

let currentView = "home";
let searchTimer;

let requestNumber = 0;

// ==========================================
// 3. LOAD WATCHLIST FROM LOCAL STORAGE
// ==========================================

try {
    const savedCoins = localStorage.getItem("cryptoWatchlist");

    if (savedCoins) {
        watchlist = JSON.parse(savedCoins);
    }

    if (!Array.isArray(watchlist)) {
        watchlist = [];
    }

} catch (error) {
    watchlist = [];
}

// ==========================================
// 4. FONT AWESOME ICON FUNCTION
// ==========================================

function createIcon(iconName) {
    const icon = document.createElement("i");
    icon.className = iconName;
    return icon;
}

// ==========================================
// 5. API FETCH FUNCTION
// ==========================================

async function fetchAPI(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("API limit reached. Please try again later.");
            }

            throw new Error("API Error: " + response.status);
        }

        return await response.json();

    } catch (error) {
        throw new Error(error.message || "Network error. Please try again.");
    }
}

// ==========================================
// 6. LOADING, ERROR AND EMPTY STATES
// ==========================================

function showLoading() {
    loading.classList.remove("hidden");

    errorBox.classList.add("hidden");
    empty.classList.add("hidden");

    coinContainer.replaceChildren();

    detailView.classList.add("hidden");
    coinContainer.classList.remove("hidden");
}

function hideLoading() {
    loading.classList.add("hidden");
}

function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function showEmpty(message) {
    empty.textContent = message;
    empty.classList.remove("hidden");
}


// ==========================================
// 7. LOAD TOP 20 COINS
// ==========================================

async function fetchCoins() {

    const thisRequest = ++requestNumber;

    currentView = "home";
    searchInput.value = "";

    showLoading();

    const url =
        API_URL +
        "/coins/markets" +
        "?vs_currency=inr" +
        "&order=market_cap_desc" +
        "&per_page=20" +
        "&page=1" +
        "&sparkline=false";

    try {
        const data = await fetchAPI(url);

        if (thisRequest !== requestNumber) {
            return;
        }

        currentCoins = data;

        hideLoading();
        displayCoins();

    } catch (error) {

        if (thisRequest !== requestNumber) {
            return;
        }

        hideLoading();
        showError(error.message);
    }
}

// ==========================================
// 8. SEARCH COINS
// ==========================================

async function searchCoins() {

    const query = searchInput.value.trim();

    if (query === "") {
        fetchCoins();
        return;
    }

    const thisRequest = ++requestNumber;

    currentView = "search";

    showLoading();

    try {

        const searchData = await fetchAPI(
            API_URL + "/search?query=" + encodeURIComponent(query)
        );

        if (thisRequest !== requestNumber) {
            return;
        }

        const matchingCoins = searchData.coins || [];

        if (matchingCoins.length === 0) {
            currentCoins = [];
            hideLoading();
            displayCoins();
            return;
        }

        const coinIds = matchingCoins
            .slice(0, 20)
            .map(function (coin) {
                return coin.id;
            });

        const marketData = await fetchAPI(
            API_URL +
            "/coins/markets" +
            "?vs_currency=inr" +
            "&ids=" + coinIds.join(",") +
            "&sparkline=false"
        );

        if (thisRequest !== requestNumber) {
            return;
        }

        currentCoins = marketData;

        hideLoading();
        displayCoins();

    } catch (error) {

        if (thisRequest !== requestNumber) {
            return;
        }

        hideLoading();
        showError(error.message);
    }
}
