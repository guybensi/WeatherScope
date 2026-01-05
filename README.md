# Weather Capstone (Express + Axios + EJS)

A simple capstone-style project that shows the **7‑day weather forecast** for a specific location using the **Open‑Meteo** public APIs (no API key needed).

## Tech
- Express (server)
- Axios (HTTP client)
- EJS (templating)

## Run locally
1. Install dependencies:
```bash
npm i
```

2. Start the server:
```bash
npm start
```

3. Open:
- http://localhost:3000

## Dev mode (optional)
If you have nodemon installed globally:
```bash
nodemon index.js
```

## APIs used
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`

## Project structure
```
weather-capstone/
  index.js
  package.json
  public/
    styles.css
  views/
    index.ejs
```
