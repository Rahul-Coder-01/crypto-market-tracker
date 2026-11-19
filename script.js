
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


// ==========================================
// 9. DISPLAY COIN CARDS
// ==========================================

function displayCoins() {

    coinContainer.replaceChildren();

    errorBox.classList.add("hidden");
    empty.classList.add("hidden");

    detailView.classList.add("hidden");
    coinContainer.classList.remove("hidden");

    let coins = [...currentCoins];

    const query = searchInput.value.toLowerCase().trim();

    if (currentView === "watchlist") {
        coins = coins.filter(function (coin) {
            return watchlist.includes(coin.id);
        });
    }

    if (query !== "") {
        coins = coins.filter(function (coin) {
            return (
                coin.name.toLowerCase().includes(query) ||
                coin.symbol.toLowerCase().includes(query)
            );
        });
    }

    const sortValue = sortSelect.value;

    if (sortValue === "price_desc") {
        coins.sort((a, b) => b.current_price - a.current_price);

    } else if (sortValue === "price_asc") {
        coins.sort((a, b) => a.current_price - b.current_price);

    } else if (sortValue === "change_desc") {
        coins.sort((a, b) =>
            (b.price_change_percentage_24h || 0) -
            (a.price_change_percentage_24h || 0)
        );

    } else {
        coins.sort((a, b) => b.market_cap - a.market_cap);
    }

    if (currentView === "watchlist") {
        sectionTitle.textContent = "My Watchlist";

    } else if (currentView === "search") {
        sectionTitle.textContent = "Search Results";

    } else {
        sectionTitle.textContent = "Top 20 Cryptocurrencies";
    }

    if (coins.length === 0) {

        if (currentView === "watchlist" && watchlist.length === 0) {
            showEmpty("Your watchlist is empty.");
        } else {
            showEmpty("No results found.");
        }

        return;
    }

    const cards = coins.map(function (coin) {
        return createCoinCard(coin);
    });

    cards.forEach(function (card) {
        coinContainer.appendChild(card);
    });
}

// ==========================================
// 10. CREATE ONE COIN CARD
// ==========================================

function createCoinCard(coin) {

    const card = document.createElement("div");

    card.className =
        "coin-card bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-yellow-400 transition";

    card.dataset.id = coin.id;

    const image = document.createElement("img");
    image.src = coin.image;
    image.alt = coin.name;
    image.className = "w-12 h-12";

    const name = document.createElement("h3");
    name.textContent = coin.name;
    name.className = "font-bold text-lg";

    const symbol = document.createElement("p");
    symbol.textContent = coin.symbol.toUpperCase();
    symbol.className = "text-gray-400 text-sm";

    const top = document.createElement("div");
    top.className = "flex items-center gap-3 mb-4";

    const coinInfo = document.createElement("div");
    coinInfo.append(name, symbol);

    top.append(image, coinInfo);

    const price = document.createElement("p");
    price.textContent = formatPrice(coin.current_price);
    price.className = "text-xl font-bold mb-3";

    const changeValue = coin.price_change_percentage_24h || 0;

    const change = document.createElement("p");
    change.textContent =
        "24h Change: " + changeValue.toFixed(2) + "%";

    change.className = changeValue >= 0
        ? "text-green-400 mb-3"
        : "text-red-400 mb-3";

    const marketCap = document.createElement("p");
    marketCap.textContent =
        "Market Cap: " + formatPrice(coin.market_cap);

    marketCap.className = "text-gray-400 text-sm mb-4";

    const watchButton = document.createElement("button");

    watchButton.dataset.action = "watch";
    watchButton.className =
        "w-full bg-yellow-600 hover:bg-yellow-700 rounded-lg p-2";

    const starIcon = createIcon(
        watchlist.includes(coin.id)
            ? "fa-solid fa-star mr-2"
            : "fa-regular fa-star mr-2"
    );

    const watchText = document.createTextNode(
        watchlist.includes(coin.id)
            ? "Remove from Watchlist"
            : "Add to Watchlist"
    );

    watchButton.append(starIcon, watchText);

    const detailButton = document.createElement("button");

    detailButton.dataset.action = "details";
    detailButton.className =
        "w-full bg-blue-600 hover:bg-blue-700 rounded-lg p-2 mt-2";

    detailButton.append(
        createIcon("fa-solid fa-circle-info mr-2"),
        document.createTextNode("View Details")
    );

    card.append(
        top,
        price,
        change,
        marketCap,
        watchButton,
        detailButton
    );

    return card;
}

// ==========================================
// 11. FORMAT PRICE IN INDIAN RUPEES
// ==========================================

function formatPrice(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}


