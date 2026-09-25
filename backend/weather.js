import axios from 'axios';
import { config } from './config.js';
import { db } from './database.js';

class WeatherService {
  constructor() {
    this.currentWeather = {
      siteId: config.defaultSiteId,
      visibilityMeters: 4.2,
      fogLevelPercent: 78,
      humidityPercent: 88,
      temperatureCelsius: 22,
      windSpeedKmh: 12,
      pressureHpa: 1012,
      status: 'DENSE_FOG',
      lastUpdated: new Date().toISOString(),
      source: 'WEATHER_API',
      isStale: false,
    };
    this.lastFetchedAt = 0;
    this.timer = null;
  }

  startPolling() {
    this.fetchWeather();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.fetchWeather();
    }, config.weather.updateIntervalMs);
  }

  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async fetchWeather() {
    const now = Date.now();
    // Cache check
    if (now - this.lastFetchedAt < config.weather.cacheTtlMs && this.lastFetchedAt > 0) {
      return this.currentWeather;
    }

    try {
      const { latitude, longitude } = config.weather;
      // Open-Meteo free API for live meteorological observation
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code,visibility&timezone=auto`;

      const response = await axios.get(url, { timeout: 5000 });
      const current = response.data?.current;

      if (current) {
        const temp = Math.round(current.temperature_2m ?? 24);
        const humidity = Math.round(current.relative_humidity_2m ?? 80);
        const wind = Math.round(current.wind_speed_10m ?? 10);
        const pressure = Math.round(current.surface_pressure ?? 1013);
        
        // Convert visibility in meters (if API reports in meters e.g. 50000m, scale down to mining pit scale or use raw)
        // In mining pit fog scenarios, visibility is critical (e.g. 3.2m to 25m)
        let rawVisMeters = current.visibility ? current.visibility / 1000 : 25; // km
        let visMeters = Math.min(25.0, Math.max(3.0, rawVisMeters));
        
        // Calculate fog level percentage from humidity and visibility
        let fogLevel = Math.min(95, Math.max(5, Math.round((100 - visMeters * 3) + (humidity > 80 ? 20 : 0))));

        let status = 'CLEAR';
        if (visMeters < 5.0 || fogLevel > 70) {
          status = 'DENSE_FOG';
        } else if (visMeters < 12.0 || fogLevel > 40) {
          status = 'MODERATE_FOG';
        } else if (current.weather_code >= 61 && current.weather_code <= 65) {
          status = 'HEAVY_RAIN';
        }

        this.currentWeather = {
          siteId: config.defaultSiteId,
          visibilityMeters: parseFloat(visMeters.toFixed(1)),
          fogLevelPercent: fogLevel,
          humidityPercent: humidity,
          temperatureCelsius: temp,
          windSpeedKmh: wind,
          pressureHpa: pressure,
          status,
          lastUpdated: new Date().toISOString(),
          source: 'WEATHER_API',
          isStale: false,
        };

        this.lastFetchedAt = now;

        // Persist reading to Supabase Cloud
        db.logWeatherReading(this.currentWeather);
      }
    } catch (err) {
      console.warn('⚠️ Weather API fetch failed (using cached/fallback condition):', err.message);
      this.currentWeather.isStale = true;
      this.currentWeather.lastUpdated = new Date().toISOString();
    }

    return this.currentWeather;
  }

  getCondition() {
    return this.currentWeather;
  }

  setSimulatedCondition(condition) {
    this.currentWeather = {
      ...this.currentWeather,
      ...condition,
      source: 'SIMULATION',
      lastUpdated: new Date().toISOString(),
      isStale: false,
    };
  }
}

export const weatherService = new WeatherService();
