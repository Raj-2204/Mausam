/**
 * This if statement is getting the current location of the user and putting the name of the 
 * city in getWeather function also 
 * The geolocation is referred from https://www.w3schools.com/html/html5_geolocation.asp
 * Also it is using https://nominatim.openstreetmap.org/ui/reverse.html to get the city name from the coodinates of the user.
 */

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`);
        const data = await response.json();
        let location = data.address.city;
        getWeather(position.coords.latitude, position.coords.longitude, location);
    }, () => {
        alert("No location Found.");
    });
}

/**
 * When the search button is clicked it raises a function which than get the name value 
 * add it to the url to fetch data from the nominatim to get the codinates from it.
 */
document.getElementById("search-btn").addEventListener("click", async () => {
    let cityName = document.getElementById("city").value;
    if (cityName) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${cityName}&format=json&limit=1`);
        const data = await response.json();
        let cordinates = { lat: data[0].lat, lon: data[0].lon };
        if (cordinates) {
            getWeather(cordinates.lat, cordinates.lon, cityName);
        } else {
            alert("City not found");
        }
    }
});
/**
 * This fuction get weather will get the latitude, longitude and city name of the 
 * city and present the data according to the current city.
 * @param {*} latitude of the city need to be searched.
 * @param {*} longitude of the city need to be searched.
 * @param {*} cityName name of the city.
 */
async function getWeather(latitude, longitude, cityName) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,cloud_cover_mean,windspeed_10m_max,precipitation_sum,rain_sum,visibility_mean&timezone=auto`);
        const data = await response.json();
        
        document.getElementById("currentTem").innerHTML = `<h1><strong>${cityName}</strong></h1><h2>${data.current_weather.temperature}°C</h2>
        <h3>Max: ${data.daily.temperature_2m_max[0]}</h3>
        <h3>Min: ${data.daily.temperature_2m_min[0]}</h3>`;
        
        let hourly = data.hourly.temperature_2m;
        let timek = data.hourly.time;
        let apparentTemp = data.hourly.apparent_temperature;

        //Hourly forecast
        for (let i = 0; i < 5; i++) {
            // This is refered from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
            let time = new Date(timek[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            document.getElementById(`card${i}`).innerHTML = `<h5>${time}</h5><p>${hourly[i]}°C</p><p>Feels like ${apparentTemp[i]}°C</p>`;
        }

        
        let weekContainer = document.getElementById("weekly-weather");
        weekContainer.innerHTML = "";  

        let dates = data.daily.time;
        let maxT = data.daily.temperature_2m_max;
        let minT = data.daily.temperature_2m_min;

        for (let i = 0; i < 7; i++) {
            // This is refered from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
            let dayName = new Date(dates[i]).toLocaleDateString("en-US", { weekday: "long" }); 
            let maxTemp = maxT[i];
            let minTemp = minT[i];

            let card = document.createElement("div");
            card.classList.add("card", "p-3", "text-center");
            card.style.width = "12rem";
            card.innerHTML = `<h5>${dayName}</h5><p>Max: ${maxTemp}°C</p><p>Min: ${minTemp}°C</p>`;

            weekContainer.appendChild(card);
        }
        document.getElementById('detailed').innerHTML = `
        <div class="card p-3 text-center" style="width: 15rem;">
                <h5>Clouds</h5>
                <p>${data.daily.cloud_cover_mean[0]} %</p>
                <p></p>
            </div>
            <div class="card p-3 text-center" style="width: 15rem;">
                <h5>Winds</h5>
                <p>${data.daily.windspeed_10m_max[0]} km/h</p>
                <p></p>
            </div>
            <div class="card p-3 text-center" style="width: 15rem;">
                <h5>Precipitation</h5>
                <p>${data.daily.precipitation_sum[0]} mm</p>
            </div>
            <div class="card p-3 text-center" style="width: 15rem;">
                <h5>Rain</h5>
                <p>${data.daily.rain_sum[0]} mm</p>
            </div>
            <div class="card p-3 text-center" style="width: 15rem;">
                <h5>Visibility</h5>
                <p>${data.daily.visibility_mean[0]} meters</p>
            </div>
        `;
        
    } catch (error) {
        console.error("Failed", error);
        alert("Error in fetching data.");
    }
}


document.getElementById("fav-btn").addEventListener("click", () => {
    let cityName = document.getElementById("city").value.trim();

    if (cityName) {
        //This is referred form https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
        let favCities = JSON.parse(localStorage.getItem("favCities") || "[]");

        if (!favCities.includes(cityName)) {
            favCities.push(cityName);
            localStorage.setItem("favCities", JSON.stringify(favCities));
            alert(`${cityName} added to favorites!`);
        } else {
            alert(`${cityName} is already in favorites!`);
        }
    } else {
        alert("Please enter a city name.");
    }
});