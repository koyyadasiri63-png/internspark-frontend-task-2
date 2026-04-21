const weatherCodes = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Heavy thunderstorm with hail"
};

const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const statusEl = document.getElementById("status");
const emptyState = document.getElementById("empty-state");
const weatherCard = document.getElementById("weather-card");
const locationNameEl = document.getElementById("location-name");
const localTimeEl = document.getElementById("local-time");
const temperatureEl = document.getElementById("temperature");
const conditionEl = document.getElementById("condition");
const metricsEl = document.getElementById("metrics");
const forecastGridEl = document.getElementById("forecast-grid");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    setStatus("Please enter a city name first.", "error");
    return;
  }

  await fetchWeather(city);
});

async function fetchWeather(city) {
  toggleLoading(true);
  setStatus("Fetching weather data...", "success");

  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );

    if (!geoResponse.ok) {
      throw new Error("City lookup failed. Please try again.");
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Try another name.");
    }

    const location = geoData.results[0];

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`
    );

    if (!weatherResponse.ok) {
      throw new Error("Weather request failed. Please try again.");
    }

    const weatherData = await weatherResponse.json();
    renderWeather(location, weatherData.current, weatherData.daily);
    setStatus(`Weather loaded for ${location.name}.`, "success");
  } catch (error) {
    hideWeatherCard();
    setStatus(error.message || "Something went wrong.", "error");
  } finally {
    toggleLoading(false);
  }
}

function renderWeather(location, current, daily) {
  locationNameEl.textContent = `${location.name}, ${location.country}`;

  const admin = location.admin1 ? `${location.admin1} | ` : "";
  localTimeEl.textContent = `${admin}Local time: ${formatDateTime(current.time)}`;

  temperatureEl.textContent = `${Math.round(current.temperature_2m)}°C`;
  conditionEl.textContent = `${weatherCodes[current.weather_code] || "Weather unavailable"} | Humidity: ${current.relative_humidity_2m}%`;

  metricsEl.innerHTML = "";
  forecastGridEl.innerHTML = "";

  const metrics = [
    {
      title: "Wind",
      value: `${Math.round(current.wind_speed_10m)} km/h`,
      note: "Current wind speed"
    },
    {
      title: "Humidity",
      value: `${current.relative_humidity_2m}%`,
      note: "Moisture in the air"
    },
    {
      title: "Day / Night",
      value: current.is_day ? "Daytime" : "Nighttime",
      note: "Based on local sunrise cycle"
    }
  ];

  metrics.forEach((metric) => {
    metricsEl.appendChild(createCard("metric-card", metric.title, metric.value, metric.note));
  });

  daily.time.slice(0, 3).forEach((date, index) => {
    const tempRange = `${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(daily.temperature_2m_min[index])}°`;
    const description = weatherCodes[daily.weather_code[index]] || "Forecast unavailable";

    forecastGridEl.appendChild(createCard("forecast-card", formatDay(date), tempRange, description));
  });

  emptyState.classList.add("hidden");
  weatherCard.classList.remove("hidden");
}

function createCard(className, title, value, note) {
  const card = document.createElement("article");
  card.className = className;

  const heading = document.createElement("h3");
  heading.textContent = title;

  const valueEl = document.createElement("p");
  valueEl.textContent = value;

  const noteEl = document.createElement("p");
  noteEl.textContent = note;

  card.append(heading, valueEl, noteEl);
  return card;
}

function hideWeatherCard() {
  weatherCard.classList.add("hidden");
  emptyState.classList.remove("hidden");
}

function toggleLoading(isLoading) {
  searchBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? "Loading..." : "Get Weather";
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function formatDay(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(dateString));
}

function formatDateTime(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateString));
}