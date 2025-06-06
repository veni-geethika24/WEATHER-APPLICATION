
// 🌦️ Constants & DOM Selectors
const apiKey = '11aa20bac11ba6c13c81cee172a9ac78';
const weatherInfo = document.getElementById('weatherInfo');
const forecastContainer = document.getElementById('forecast');
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('city');
const geoBtn = document.getElementById('geoBtn');
const darkToggle = document.getElementById('darkToggle');
const unitToggle = document.getElementById('unitToggle');
const loading = document.getElementById('loading');
const tempChartCanvas = document.getElementById('tempChart');

let currentUnit = 'metric';
let tempChart;

// 🌐 Fetch Weather by City
async function fetchWeather(city) {
  toggleLoading(true);
  try {
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${currentUnit}&appid=${apiKey}`);
    const weatherData = await weatherRes.json();
    if (weatherData.cod !== 200) throw new Error(weatherData.message);
    const { lat, lon } = weatherData.coord;
    renderCurrentWeather(weatherData);
    fetchForecast(lat, lon);
    cacheWeather(weatherData.name, weatherData);
  } catch (err) {
    alert('Error fetching weather: ' + err.message);
  }
  toggleLoading(false);
}

// 🗺️ Geolocation Weather
function getLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      toggleLoading(true);
      try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${currentUnit}&appid=${apiKey}`);
        const weatherData = await weatherRes.json();
        renderCurrentWeather(weatherData);
        fetchForecast(latitude, longitude);
        cacheWeather(weatherData.name, weatherData);
      } catch (err) {
        alert('Location fetch failed.');
      }
      toggleLoading(false);
    });
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}

// 📆 Fetch Forecast
async function fetchForecast(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`);
    const data = await res.json();
    renderForecast(data);
    renderChart(data);
  } catch (err) {
    console.error('Forecast error:', err);
  }
}

// 🌤️ Render Current Weather
function renderCurrentWeather(data) {
  const temp = data.main.temp.toFixed(1);
  const desc = data.weather[0].description;
  const icon = data.weather[0].icon;
  const city = data.name;

  weatherInfo.innerHTML = `
    <h2>${city}</h2>
    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" />
    <h3>${temp}°${currentUnit === 'metric' ? 'C' : 'F'}</h3>
    <p>${desc}</p>
  `;
}

// 📅 Render Forecast (5 Days)
function renderForecast(data) {
  forecastContainer.innerHTML = '';
  const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));
  dailyData.forEach(day => {
    const date = new Date(day.dt_txt).toDateString().slice(0, 10);
    const icon = day.weather[0].icon;
    const temp = day.main.temp.toFixed(0);
    forecastContainer.innerHTML += `
      <div class="card">
        <p>${date}</p>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon" />
        <p>${temp}°</p>
      </div>
    `;
  });
}

// 📊 Chart.js Temp Trend
function renderChart(data) {
  const labels = data.list.slice(0, 10).map(i => i.dt_txt.split(" ")[1]);
  const temps = data.list.slice(0, 10).map(i => i.main.temp);

  if (tempChart) tempChart.destroy();
  tempChart = new Chart(tempChartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temp Trend',
        data: temps,
        borderColor: '#f8b500',
        backgroundColor: 'rgba(248,181,0,0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

// 🌘 Toggle Dark Mode
darkToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

// 🌡️ Toggle °C / °F
unitToggle.addEventListener('click', () => {
  currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
  const city = cityInput.value || localStorage.getItem('lastCity');
  if (city) fetchWeather(city);
});

// 🔁 Cache
function cacheWeather(city, data) {
  localStorage.setItem('lastCity', city);
  localStorage.setItem('lastData', JSON.stringify(data));
}

// ⏳ Loading Spinner
function toggleLoading(show) {
  loading.classList.toggle('hidden', !show);
}

// 🧠 Load Theme
window.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') document.body.classList.add('dark');

  const lastCity = localStorage.getItem('lastCity');
  if (lastCity) fetchWeather(lastCity);
});

// 🛠️ Listeners
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});

geoBtn.addEventListener('click', getLocationWeather);
