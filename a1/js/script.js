// Weather icon mapping
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

function showSuccess(message) {
    const successElement = document.getElementById('success-message');
    successElement.textContent = message;
    successElement.style.display = 'block';
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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

/**
 * This if statement is getting the current location of the user and putting the name of the 
 * city in getWeather function also 
 * The geolocation is referred from https://www.w3schools.com/html/html5_geolocation.asp
 * Also it is using https://nominatim.openstreetmap.org/ui/reverse.html to get the city name from the coordinates of the user.
 */
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            showLoading();
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`);
            
            if (!response.ok) {
                throw new Error('Failed to get location data');
            }
            
            const data = await response.json();
            let location = data.address.city || data.address.town || data.address.village || 'Unknown Location';
            await getWeather(position.coords.latitude, position.coords.longitude, location);
        } catch (error) {
            console.error('Geolocation error:', error);
            showError("Failed to get your location. Please search for a city manually.");
        } finally {
            hideLoading();
        }
    }, (error) => {
        console.error('Geolocation permission denied:', error);
        showError("Location access denied. Please search for a city manually.");
        hideLoading();
    });
}

/**
 * When the search button is clicked it raises a function which than get the name value 
 * add it to the url to fetch data from the nominatim to get the coordinates from it.
 */
const searchWeather = async () => {
    let cityName = document.getElementById("city").value.trim();
    
    if (!cityName) {
        showError("Please enter a city name");
        return;
    }

    try {
        showLoading();
        const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&format=json&limit=1`);
        
        if (!response.ok) {
            throw new Error('Failed to search for city');
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            showError("City not found. Please try a different city name.");
            return;
        }
        
        let coordinates = { lat: data[0].lat, lon: data[0].lon };
        await getWeather(coordinates.lat, coordinates.lon, cityName);
        
    } catch (error) {
        console.error('Search error:', error);
        showError("Failed to search for city. Please try again.");
    } finally {
        hideLoading();
    }
};

// Debounced search function
const debouncedSearch = debounce(searchWeather, 300);

document.getElementById("search-btn").addEventListener("click", searchWeather);

// Add Enter key support for search
document.getElementById("city").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        searchWeather();
    }
});

// Add real-time search suggestions (optional)
document.getElementById("city").addEventListener("input", (event) => {
    const value = event.target.value.trim();
    if (value.length > 2) {
        // Could add search suggestions here
    }
});
/**
 * This function gets weather data for the given latitude, longitude and city name
 * and presents the data according to the current city.
 * @param {number} latitude of the city to be searched.
 * @param {number} longitude of the city to be searched.
 * @param {string} cityName name of the city.
 */
async function getWeather(latitude, longitude, cityName) {
    try {
        // Check cache first
        const cachedData = getCachedWeather(latitude, longitude);
        let data;
        
        if (cachedData) {
            data = cachedData;
        } else {
            showLoading();
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,cloud_cover_mean,windspeed_10m_max,precipitation_sum,rain_sum,visibility_mean&timezone=auto`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            data = await response.json();
            setCachedWeather(latitude, longitude, data);
        }
        
        // Update current temperature with enhanced styling and icons
        const currentTemp = data.current_weather.temperature;
        const weatherIcon = getWeatherIcon(currentTemp);
        
        document.getElementById("currentTem").innerHTML = `
            <div class="weather-icon" style="font-size: 4rem;">${weatherIcon}</div>
            <h1><strong>${cityName}</strong></h1>
            <h2>${currentTemp}°C</h2>
            <div style="display: flex; justify-content: space-around; margin-top: 20px;">
                <div>
                    <h4>Max</h4>
                    <h3>${data.daily.temperature_2m_max[0].toFixed(1)}°C</h3>
                </div>
                <div>
                    <h4>Min</h4>
                    <h3>${data.daily.temperature_2m_min[0].toFixed(1)}°C</h3>
                </div>
            </div>
        `;
        
        let hourly = data.hourly.temperature_2m;
        let timek = data.hourly.time;
        let apparentTemp = data.hourly.apparent_temperature;

        // Enhanced hourly forecast with more hours (24 hours)
        const hourlyContainer = document.getElementById('hourly-cards');
        hourlyContainer.innerHTML = ''; // Clear existing cards
        
        const hoursToShow = Math.min(24, hourly.length); // Show up to 24 hours
        
        for (let i = 0; i < hoursToShow; i++) {
            let time = new Date(timek[i]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
            let date = new Date(timek[i]);
            let dayLabel = '';
            
            // Add day labels for better clarity
            if (i === 0) {
                dayLabel = '<small>Now</small><br>';
            } else if (date.getHours() === 0) {
                dayLabel = `<small>${date.toLocaleDateString('en-US', { weekday: 'short' })}</small><br>`;
            }
            
            let temp = hourly[i];
            let icon = getWeatherIcon(temp);
            
            const card = document.createElement('div');
            card.className = 'hourly-card slide-in';
            card.style.animationDelay = `${i * 0.1}s`; // Stagger animations
            
            card.innerHTML = `
                <div class="weather-icon">${icon}</div>
                ${dayLabel}
                <h6>${time}</h6>
                <p><strong>${temp.toFixed(1)}°C</strong></p>
                <p><small>Feels ${apparentTemp[i].toFixed(1)}°C</small></p>
            `;
            
            hourlyContainer.appendChild(card);
        }

        // Enhanced weekly forecast
        let weekContainer = document.getElementById("weekly-weather");
        weekContainer.innerHTML = "";  

        let dates = data.daily.time;
        let maxT = data.daily.temperature_2m_max;
        let minT = data.daily.temperature_2m_min;

        for (let i = 0; i < 7; i++) {
            let dayName = new Date(dates[i]).toLocaleDateString("en-US", { weekday: "long" }); 
            let maxTemp = maxT[i];
            let minTemp = minT[i];
            let avgTemp = (maxTemp + minTemp) / 2;
            let icon = getWeatherIcon(avgTemp);

            let card = document.createElement("div");
            card.classList.add("weekly-card", "fade-in");
            card.innerHTML = `
                <div class="weather-icon">${icon}</div>
                <h5>${dayName}</h5>
                <p><strong>Max: ${maxTemp.toFixed(1)}°C</strong></p>
                <p>Min: ${minTemp.toFixed(1)}°C</p>
            `;

            weekContainer.appendChild(card);
        }
        
        // Enhanced detailed observations
        document.getElementById('detailed').innerHTML = `
            <div class="detailed-card">
                <div class="weather-icon">☁️</div>
                <h5>Cloud Cover</h5>
                <p><strong>${data.daily.cloud_cover_mean[0].toFixed(1)}%</strong></p>
                <p><small>Average daily coverage</small></p>
            </div>
            <div class="detailed-card">
                <div class="weather-icon">💨</div>
                <h5>Wind Speed</h5>
                <p><strong>${data.daily.windspeed_10m_max[0].toFixed(1)} km/h</strong></p>
                <p><small>Maximum today</small></p>
            </div>
            <div class="detailed-card">
                <div class="weather-icon">🌧️</div>
                <h5>Precipitation</h5>
                <p><strong>${data.daily.precipitation_sum[0].toFixed(1)} mm</strong></p>
                <p><small>Total expected</small></p>
            </div>
            <div class="detailed-card">
                <div class="weather-icon">☔</div>
                <h5>Rain</h5>
                <p><strong>${data.daily.rain_sum[0].toFixed(1)} mm</strong></p>
                <p><small>Rain only</small></p>
            </div>
            <div class="detailed-card">
                <div class="weather-icon">👁️</div>
                <h5>Visibility</h5>
                <p><strong>${(data.daily.visibility_mean[0] / 1000).toFixed(1)} km</strong></p>
                <p><small>Average range</small></p>
            </div>
        `;
        
        // Add animation classes to containers
        document.querySelector('.hourly-container').classList.add('fade-in');
        document.querySelector('.weekly-container').classList.add('fade-in');
        document.querySelector('.detailed-container').classList.add('fade-in');
        
    } catch (error) {
        console.error("Weather fetch failed:", error);
        showError("Failed to fetch weather data. Please try again.");
    } finally {
        hideLoading();
    }
}


// Enhanced favorite functionality
document.getElementById("fav-btn").addEventListener("click", () => {
    let cityName = document.getElementById("city").value.trim();

    if (!cityName) {
        showError("Please enter a city name first.");
        return;
    }

    try {
        // This is referred from https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
        let favCities = JSON.parse(localStorage.getItem("favCities") || "[]");

        if (!favCities.includes(cityName)) {
            favCities.push(cityName);
            localStorage.setItem("favCities", JSON.stringify(favCities));
            showSuccess(`${cityName} added to favorites!`);
            
            // Update button state
            const favBtn = document.getElementById("fav-btn");
            favBtn.innerHTML = "⭐ Added!";
            favBtn.style.background = "linear-gradient(135deg, #00b894 0%, #00a085 100%)";
            favBtn.style.color = "white";
            
            setTimeout(() => {
                favBtn.innerHTML = "⭐ Favourite";
                favBtn.style.background = "";
                favBtn.style.color = "";
            }, 2000);
            
        } else {
            showError(`${cityName} is already in favorites!`);
        }
    } catch (error) {
        console.error('Favorites error:', error);
        showError("Failed to add to favorites.");
    }
});

// Input validation and formatting
document.getElementById("city").addEventListener("blur", (event) => {
    const input = event.target;
    const value = input.value.trim();
    
    if (value) {
        // Capitalize first letter of each word
        const formatted = value.replace(/\b\w/g, letter => letter.toUpperCase());
        input.value = formatted;
    }
});

// Clear error messages when user starts typing
document.getElementById("city").addEventListener("focus", () => {
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('success-message').style.display = 'none';
});