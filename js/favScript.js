// Weather icon mapping (same as main script)
const weatherIcons = {
    clear: '☀️',
    sunny: '☀️',
    clouds: '☁️',
    cloudy: '☁️',
    rain: '🌧️',
    rainy: '🌧️',
    snow: '❄️',
    snowy: '❄️',
    storm: '⛈️',
    thunderstorm: '⛈️',
    mist: '🌫️',
    fog: '🌫️',
    wind: '💨',
    hot: '🔥',
    cold: '🧊',
    default: '🌤️'
};

// Utility functions
function showLoading() {
    document.getElementById('loading-spinner').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function getWeatherIcon(temperature, condition = '') {
    if (temperature > 30) return weatherIcons.hot;
    if (temperature < 0) return weatherIcons.cold;
    if (condition.toLowerCase().includes('rain')) return weatherIcons.rain;
    if (condition.toLowerCase().includes('cloud')) return weatherIcons.clouds;
    if (condition.toLowerCase().includes('snow')) return weatherIcons.snow;
    if (condition.toLowerCase().includes('storm')) return weatherIcons.storm;
    if (condition.toLowerCase().includes('mist') || condition.toLowerCase().includes('fog')) return weatherIcons.mist;
    return weatherIcons.default;
}

// Cache system
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

function getCacheKey(lat, lon) {
    return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function getCachedWeather(lat, lon) {
    const key = getCacheKey(lat, lon);
    const cached = weatherCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedWeather(lat, lon, data) {
    const key = getCacheKey(lat, lon);
    weatherCache.set(key, {
        data: data,
        timestamp: Date.now()
    });
}

// Get coordinates for a city
async function getCityCoordinates(cityName) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&format=json&limit=1`);
        if (!response.ok) {
            throw new Error('Failed to get city coordinates');
        }
        const data = await response.json();
        if (data.length === 0) {
            throw new Error('City not found');
        }
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } catch (error) {
        console.error(`Error getting coordinates for ${cityName}:`, error);
        throw error;
    }
}

// Get weather data for a city
async function getCityWeather(cityName, coordinates) {
    try {
        // Check cache first
        const cachedData = getCachedWeather(coordinates.lat, coordinates.lon);
        if (cachedData) {
            return cachedData;
        }

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,cloud_cover_mean,windspeed_10m_max,precipitation_sum,rain_sum&timezone=auto`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        setCachedWeather(coordinates.lat, coordinates.lon, data);
        return data;
        
    } catch (error) {
        console.error(`Error getting weather for ${cityName}:`, error);
        throw error;
    }
}

// Create a favourite city card
function createFavouriteCard(cityName, weatherData, index) {
    const currentTemp = weatherData.current_weather.temperature;
    const maxTemp = weatherData.daily.temperature_2m_max[0];
    const minTemp = weatherData.daily.temperature_2m_min[0];
    const windSpeed = weatherData.daily.windspeed_10m_max[0];
    const cloudCover = weatherData.daily.cloud_cover_mean[0];
    const precipitation = weatherData.daily.precipitation_sum[0];
    const weatherIcon = getWeatherIcon(currentTemp);

    const card = document.createElement('div');
    card.className = 'favourite-card bounce-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="favourite-card-header">
            <h3 class="favourite-card-title">${cityName}</h3>
            <button class="remove-btn" onclick="removeFromFavourites('${cityName}')" title="Remove from favourites">
                ×
            </button>
        </div>
        
        <div class="favourite-card-content">
            <div class="weather-icon" style="font-size: 3rem;">${weatherIcon}</div>
            <div class="current-temp">${currentTemp.toFixed(1)}°C</div>
            
            <div class="temp-range">
                <div>
                    <div style="color: #666;">Max</div>
                    <div style="font-weight: bold;">${maxTemp.toFixed(1)}°C</div>
                </div>
                <div>
                    <div style="color: #666;">Min</div>
                    <div style="font-weight: bold;">${minTemp.toFixed(1)}°C</div>
                </div>
            </div>
            
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-label">💨 Wind</div>
                    <div class="weather-detail-value">${windSpeed.toFixed(1)} km/h</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">☁️ Clouds</div>
                    <div class="weather-detail-value">${cloudCover.toFixed(0)}%</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">🌧️ Rain</div>
                    <div class="weather-detail-value">${precipitation.toFixed(1)} mm</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">📅 Today</div>
                    <div class="weather-detail-value">${new Date().toLocaleDateString('en-US', { weekday: 'short' })}</div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Create loading card placeholder
function createLoadingCard(cityName, index) {
    const card = document.createElement('div');
    card.className = 'loading-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    card.innerHTML = `
        <h3>${cityName}</h3>
        <div style="margin: 20px 0;">
            <div class="loading-spinner" style="display: block; margin: 0 auto;"></div>
            <p style="margin-top: 15px; color: #666;">Loading weather data...</p>
        </div>
    `;
    return card;
}

// Remove city from favourites
function removeFromFavourites(cityName) {
    try {
        let favCities = JSON.parse(localStorage.getItem("favCities")) || [];
        favCities = favCities.filter(city => city !== cityName);
        localStorage.setItem("favCities", JSON.stringify(favCities));
        
        // Reload the page to refresh the list
        location.reload();
    } catch (error) {
        console.error('Error removing city from favourites:', error);
        showError('Failed to remove city from favourites');
    }
}

// Load and display favourite cities with weather data
async function loadFavouriteCities() {
    try {
        showLoading();
        const favCities = JSON.parse(localStorage.getItem("favCities")) || [];
        const favouritesList = document.getElementById("favourite-list");
        const emptyState = document.getElementById("empty-state");
        
        if (favCities.length === 0) {
            emptyState.style.display = 'block';
            hideLoading();
            return;
        }
        
        emptyState.style.display = 'none';
        favouritesList.innerHTML = '';
        
        // Create loading cards first
        favCities.forEach((city, index) => {
            const loadingCard = createLoadingCard(city, index);
            favouritesList.appendChild(loadingCard);
        });
        
        // Load weather data for each city
        const weatherPromises = favCities.map(async (city, index) => {
            try {
                const coordinates = await getCityCoordinates(city);
                const weatherData = await getCityWeather(city, coordinates);
                
                // Replace loading card with actual weather card
                const loadingCards = favouritesList.querySelectorAll('.loading-card');
                if (loadingCards[index]) {
                    const weatherCard = createFavouriteCard(city, weatherData, index);
                    favouritesList.replaceChild(weatherCard, loadingCards[index]);
                }
                
            } catch (error) {
                console.error(`Failed to load weather for ${city}:`, error);
                // Replace loading card with error card
                const loadingCards = favouritesList.querySelectorAll('.loading-card');
                if (loadingCards[index]) {
                    const errorCard = document.createElement('div');
                    errorCard.className = 'favourite-card fade-in';
                    errorCard.innerHTML = `
                        <div class="favourite-card-header">
                            <h3 class="favourite-card-title">${city}</h3>
                            <button class="remove-btn" onclick="removeFromFavourites('${city}')" title="Remove from favourites">×</button>
                        </div>
                        <div class="favourite-card-content" style="text-align: center; padding: 30px;">
                            <div style="font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                            <p style="color: #666;">Failed to load weather data</p>
                            <button onclick="location.reload()" class="btn btn-outline-primary btn-sm" style="margin-top: 15px;">Retry</button>
                        </div>
                    `;
                    favouritesList.replaceChild(errorCard, loadingCards[index]);
                }
            }
        });
        
        // Wait for all weather data to load
        await Promise.all(weatherPromises);
        
    } catch (error) {
        console.error('Error loading favourite cities:', error);
        showError('Failed to load favourite cities');
    } finally {
        hideLoading();
    }
}

// Initialize when page loads
window.onload = () => {
    loadFavouriteCities();
};