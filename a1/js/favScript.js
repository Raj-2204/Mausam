window.onload = () => {
    let favCities = JSON.parse(localStorage.getItem("favCities")) || [];
    favCities.forEach(city => {
        document.getElementById("favourite-list").innerHTML += `
        <div class="card p-3 text-center" style="width: 15rem;">
                <h1>${city}</h1>
            </div>
        `
    });
};