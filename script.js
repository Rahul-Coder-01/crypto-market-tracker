
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


// ==========================================
// 12. ADD OR REMOVE WATCHLIST
// ==========================================

function toggleWatchlist(id) {

    if (watchlist.includes(id)) {

        watchlist = watchlist.filter(function (coinId) {
            return coinId !== id;
        });

    } else {
        watchlist.push(id);
    }

    try {
        localStorage.setItem(
            "cryptoWatchlist",
            JSON.stringify(watchlist)
        );

    } catch (error) {
        showError("Unable to save watchlist.");
    }

    displayCoins();
}

// ==========================================
// 13. LOAD WATCHLIST
// ==========================================

async function loadWatchlist() {

    const thisRequest = ++requestNumber;

    currentView = "watchlist";
    searchInput.value = "";

    showLoading();

    if (watchlist.length === 0) {
        currentCoins = [];
        hideLoading();
        displayCoins();
        return;
    }

    try {

        const ids = watchlist.join(",");

        const data = await fetchAPI(
            API_URL +
            "/coins/markets" +
            "?vs_currency=inr" +
            "&ids=" + ids +
            "&sparkline=false"
        );

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
// 14. SHOW COIN DETAILS
// ==========================================

async function showDetails(id) {

    const coin = currentCoins.find(function (item) {
        return item.id === id;
    });

    if (!coin) {
        return;
    }

    const thisRequest = ++requestNumber;

    coinContainer.classList.add("hidden");
    detailView.classList.remove("hidden");
    detailView.replaceChildren();

    const loadingText = document.createElement("p");
    loadingText.textContent = "Loading coin details...";
    loadingText.className = "text-yellow-400";

    detailView.appendChild(loadingText);

    try {

        const details = await fetchAPI(
            API_URL +
            "/coins/" + id +
            "?localization=false" +
            "&tickers=false" +
            "&market_data=true" +
            "&community_data=false" +
            "&developer_data=false"
        );

        if (thisRequest !== requestNumber) {
            return;
        }

        detailView.replaceChildren();

        const image = document.createElement("img");
        image.src = coin.image;
        image.alt = coin.name;
        image.className = "w-16 h-16 mb-4";

        const title = document.createElement("h2");

        title.textContent =
            coin.name + " (" + coin.symbol.toUpperCase() + ")";

        title.className = "text-2xl font-bold mb-4";

        const description = document.createElement("p");

        const descriptionText = details.description?.en || "";

        description.textContent = descriptionText
            ? descriptionText.replace(/<[^>]*>/g, "").slice(0, 600)
            : "Description not available.";

        description.className = "text-gray-300 mb-6";

        const market = details.market_data;

        const statItems = [
            ["Current Price", formatPrice(coin.current_price)],
            ["Market Cap", formatPrice(coin.market_cap)],
            ["24h High", formatPrice(market?.high_24h?.inr)],
            ["24h Low", formatPrice(market?.low_24h?.inr)],
            ["Total Volume", formatPrice(market?.total_volume?.inr)],
            [
                "Circulating Supply",
                Number(market?.circulating_supply || 0).toLocaleString("en-IN")
            ]
        ];

        const stats = document.createElement("div");
        stats.className = "space-y-3";

        const statElements = statItems.map(function (item) {

            const row = document.createElement("p");
            row.textContent = item[0] + ": " + item[1];
            row.className = "text-gray-300";

            return row;
        });

        stats.append(...statElements);

        const backButton = document.createElement("button");

        backButton.dataset.action = "back";
        backButton.className =
            "bg-blue-600 hover:bg-blue-700 rounded-lg px-5 py-3 mt-6";

        backButton.append(
            createIcon("fa-solid fa-arrow-left mr-2"),
            document.createTextNode("Back to Coins")
        );

        detailView.append(
            image,
            title,
            description,
            stats,
            backButton
        );

    } catch (error) {

        if (thisRequest !== requestNumber) {
            return;
        }

        detailView.replaceChildren();

        const message = document.createElement("p");
        message.textContent = error.message;
        message.className = "text-red-400";

        const backButton = document.createElement("button");

        backButton.dataset.action = "back";
        backButton.className = "bg-blue-600 rounded-lg p-3 mt-4";

        backButton.append(
            createIcon("fa-solid fa-arrow-left mr-2"),
            document.createTextNode("Back")
        );

        detailView.append(message, backButton);
    }
}
 

// ==========================================
// 15. EVENT DELEGATION
// ==========================================

coinContainer.addEventListener("click", function (event) {

    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const card = button.closest(".coin-card");

    if (!card) {
        return;
    }

    const id = card.dataset.id;

    if (button.dataset.action === "watch") {
        toggleWatchlist(id);
    }

    if (button.dataset.action === "details") {
        showDetails(id);
    }
});

// ==========================================
// 16. DETAIL PAGE BACK BUTTON
// ==========================================

detailView.addEventListener("click", function (event) {

    const button = event.target.closest(
        "button[data-action='back']"
    );

    if (button) {
        detailView.classList.add("hidden");
        coinContainer.classList.remove("hidden");
    }
});

// ==========================================
// 17. SEARCH WITH DEBOUNCE
// ==========================================

searchInput.addEventListener("input", function () {

    clearTimeout(searchTimer);

    searchTimer = setTimeout(function () {

        if (currentView === "watchlist") {
            displayCoins();
        } else {
            searchCoins();
        }

    }, 500);
});

// ==========================================
// 18. SORT COINS
// ==========================================

sortSelect.addEventListener("change", function () {
    displayCoins();
});

// ==========================================
// 19. REFRESH BUTTON
// ==========================================

refreshBtn.addEventListener("click", function () {

    if (currentView === "watchlist") {
        loadWatchlist();

    } else if (currentView === "search") {
        searchCoins();

    } else {
        fetchCoins();
    }
});

// ==========================================
// 20. WATCHLIST BUTTON
// ==========================================

watchlistBtn.addEventListener("click", function () {
    loadWatchlist();
});

// ==========================================
// 21. HOME BUTTON
// ==========================================

homeBtn.addEventListener("click", function () {
    fetchCoins();
});

// ==========================================
// 22. INITIAL PAGE LOAD
// ==========================================

errorBox.classList.add("hidden");
empty.classList.add("hidden");

// Load top 20 coins when website opens.
fetchCoins();



