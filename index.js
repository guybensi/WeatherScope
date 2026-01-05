import express from "express";
import axios from "axios";

const app = express();
const port = 3000;

// Open-Meteo (no auth, CORS-friendly)
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Views
app.set("view engine", "ejs");

// Small helper: map Open-Meteo weather codes to text + emoji
function weatherCodeToText(code) {
  const map = {
    0: { text: "Clear sky", emoji: "☀️" },
    1: { text: "Mainly clear", emoji: "🌤️" },
    2: { text: "Partly cloudy", emoji: "⛅" },
    3: { text: "Overcast", emoji: "☁️" },
    45: { text: "Fog", emoji: "🌫️" },
    48: { text: "Depositing rime fog", emoji: "🌫️" },
    51: { text: "Light drizzle", emoji: "🌦️" },
    53: { text: "Moderate drizzle", emoji: "🌦️" },
    55: { text: "Dense drizzle", emoji: "🌧️" },
    56: { text: "Light freezing drizzle", emoji: "🌧️" },
    57: { text: "Dense freezing drizzle", emoji: "🌧️" },
    61: { text: "Slight rain", emoji: "🌧️" },
    63: { text: "Moderate rain", emoji: "🌧️" },
    65: { text: "Heavy rain", emoji: "🌧️" },
    66: { text: "Light freezing rain", emoji: "🌧️" },
    67: { text: "Heavy freezing rain", emoji: "🌧️" },
    71: { text: "Slight snow fall", emoji: "🌨️" },
    73: { text: "Moderate snow fall", emoji: "🌨️" },
    75: { text: "Heavy snow fall", emoji: "❄️" },
    77: { text: "Snow grains", emoji: "🌨️" },
    80: { text: "Slight rain showers", emoji: "🌦️" },
    81: { text: "Moderate rain showers", emoji: "🌦️" },
    82: { text: "Violent rain showers", emoji: "⛈️" },
    85: { text: "Slight snow showers", emoji: "🌨️" },
    86: { text: "Heavy snow showers", emoji: "❄️" },
    95: { text: "Thunderstorm", emoji: "⛈️" },
    96: { text: "Thunderstorm with slight hail", emoji: "⛈️" },
    99: { text: "Thunderstorm with heavy hail", emoji: "⛈️" },
  };

  return map[code] ?? { text: `Weather code ${code}`, emoji: "🌡️" };
}

async function geocodeCity(city) {
  const geo = await axios.get(GEO_URL, {
    params: {
      name: city,
      count: 1,
      language: "en",
      format: "json",
    },
    timeout: 10000,
  });

  const first = geo.data?.results?.[0];
  if (!first) return null;

  return {
    name: first.name,
    country: first.country,
    admin1: first.admin1,
    latitude: first.latitude,
    longitude: first.longitude,
  };
}

async function get7DayForecast({ latitude, longitude }) {
  const forecast = await axios.get(FORECAST_URL, {
    params: {
      latitude,
      longitude,
      daily: [
        "weathercode",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
      ].join(","),
      timezone: "auto",
    },
    timeout: 10000,
  });

  const d = forecast.data?.daily;
  if (!d?.time?.length) return null;

  const days = d.time.map((date, i) => {
    const code = d.weathercode?.[i];
    const info = weatherCodeToText(code);
    return {
      date,
      tMax: d.temperature_2m_max?.[i],
      tMin: d.temperature_2m_min?.[i],
      precip: d.precipitation_probability_max?.[i],
      code,
      summary: info.text,
      emoji: info.emoji,
    };
  });

  return days;
}

app.get("/", (req, res) => {
  res.render("index", {
    title: "7‑Day Weather Forecast",
    city: "Tel Aviv",
    locationLabel: null,
    forecastDays: null,
    error: null,
  });
});

app.post("/forecast", async (req, res) => {
  const city = (req.body.city || "").trim();

  if (!city) {
    return res.status(400).render("index", {
      title: "7‑Day Weather Forecast",
      city: "",
      locationLabel: null,
      forecastDays: null,
      error: "Please enter a city name.",
    });
  }

  try {
    const location = await geocodeCity(city);

    if (!location) {
      return res.status(404).render("index", {
        title: "7‑Day Weather Forecast",
        city,
        locationLabel: null,
        forecastDays: null,
        error: "Couldn't find that location. Try a different spelling or a larger city.",
      });
    }

    const forecastDays = await get7DayForecast(location);

    if (!forecastDays) {
      return res.status(502).render("index", {
        title: "7‑Day Weather Forecast",
        city,
        locationLabel: `${location.name}${location.admin1 ? ", " + location.admin1 : ""}, ${location.country}`,
        forecastDays: null,
        error: "Weather service returned an unexpected response. Please try again.",
      });
    }

    res.render("index", {
      title: "7‑Day Weather Forecast",
      city,
      locationLabel: `${location.name}${location.admin1 ? ", " + location.admin1 : ""}, ${location.country}`,
      forecastDays,
      error: null,
    });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).render("index", {
      title: "7‑Day Weather Forecast",
      city,
      locationLabel: null,
      forecastDays: null,
      error: "Something went wrong while contacting the API. Check the server console for details.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
