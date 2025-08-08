
import React, { useEffect, useMemo, useState } from 'react';
import { CloudSun, Thermometer, Droplets, Wind, Umbrella } from 'lucide-react';

interface WeatherDay {
  date: string;
  high: number;
  low: number;
  condition: string;
  precipitation: number;
  wind: number;
  recommendation: string;
}

type CityWeather = { city: string; days: WeatherDay[] };

const WeatherInsights: React.FC = () => {
  const [cityWeathers, setCityWeathers] = useState<CityWeather[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { destination, startDate, endDate, cityHint, countryHint } = useMemo(() => {
    // Read destination and dates from trip planning localStorage
    let dest = 'Tokyo';
    let start = new Date();
    let end = new Date();
    end.setDate(start.getDate() + 3);
    let cityHintLocal: string | undefined;
    let countryHintLocal: string | undefined;
    const raw = localStorage.getItem('tripPlanningData');
    if (raw && raw !== 'null' && raw !== 'undefined') {
      try {
        const parsed = JSON.parse(raw);
        dest = parsed.destination || dest;
        cityHintLocal = parsed.cityHint || cityHintLocal;
        countryHintLocal = parsed.countryHint || countryHintLocal;
        const s = parsed.startDate || parsed.start_date;
        const e = parsed.endDate || parsed.end_date;
        if (s) start = new Date(s);
        if (e) end = new Date(e);
      } catch {}
    }
    return { destination: String(dest), startDate: start, endDate: end, cityHint: cityHintLocal, countryHint: countryHintLocal };
  }, []);

  // Haversine distance (km)
  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(d);

  const toIso = (d: Date) => d.toISOString().slice(0, 10);

  const weatherCodeToCondition = (code: number): string => {
    if ([0].includes(code)) return 'Sunny';
    if ([1, 2].includes(code)) return 'Partly Cloudy';
    if ([3].includes(code)) return 'Cloudy';
    if ([45, 48].includes(code)) return 'Foggy';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
    if ([61, 63, 65, 80, 81, 82].includes(code)) return 'Rain';
    if ([66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
    if ([95, 96, 99].includes(code)) return 'Thunderstorm';
    return 'Partly Cloudy';
  };

  const getRecommendation = (day: { high: number; precipitation: number; wind: number; condition: string }) => {
    if (day.precipitation >= 50) return 'Indoor activities recommended';
    if (day.wind >= 25) return 'Windy day, plan accordingly';
    if (day.high >= 28 || day.condition === 'Sunny') return 'Perfect for outdoor sightseeing';
    return 'Great day for sightseeing';
  };

  useEffect(() => {
    let cancelled = false;
    const fetchForecastForCity = async (
      city: string,
      lat: number,
      lon: number,
      startISO: string,
      endISO: string
    ): Promise<CityWeather | null> => {
      const tryOpenWeatherMap = async (): Promise<CityWeather | null> => {
        const apiKey = (import.meta as any)?.env?.VITE_OPENWEATHER_API_KEY;
        if (!apiKey) return null;
        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const daily = data?.daily;
        if (!Array.isArray(daily)) return null;

        const start = new Date(startISO);
        const end = new Date(endISO);
        // Normalize dates to YYYY-MM-DD for matching (UTC)
        const withinRange = (dt: number) => {
          const d = new Date(dt * 1000);
          const iso = d.toISOString().slice(0, 10);
          return iso >= startISO && iso <= endISO;
        };

        const days: WeatherDay[] = daily
          .filter((d: any) => withinRange(d.dt))
          .map((d: any) => {
            const dateStr = formatDate(new Date(d.dt * 1000));
            const high = Number(d?.temp?.max ?? 0);
            const low = Number(d?.temp?.min ?? 0);
            const precipitation = Math.round(Number(d?.pop ?? 0) * 100);
            const wind = Math.round(Number(d?.wind_speed ?? 0) * 3.6 * 10) / 10; // m/s -> km/h
            const main = String(d?.weather?.[0]?.main || '');
            const condition =
              main === 'Clear'
                ? 'Sunny'
                : main === 'Clouds'
                ? 'Cloudy'
                : main === 'Drizzle'
                ? 'Drizzle'
                : main === 'Rain'
                ? 'Rain'
                : main === 'Snow'
                ? 'Snow'
                : main === 'Thunderstorm'
                ? 'Thunderstorm'
                : 'Partly Cloudy';
            const recommendation = getRecommendation({ high, precipitation, wind, condition });
            return { date: dateStr, high, low, condition, precipitation, wind, recommendation };
          });

        // If OWM response does not contain specific dates in range (e.g., end < today), fallback to first N
        const finalDays = days.length > 0 ? days : daily.slice(0, 7).map((d: any) => {
          const dateStr = formatDate(new Date(d.dt * 1000));
          const high = Number(d?.temp?.max ?? 0);
          const low = Number(d?.temp?.min ?? 0);
          const precipitation = Math.round(Number(d?.pop ?? 0) * 100);
          const wind = Math.round(Number(d?.wind_speed ?? 0) * 3.6 * 10) / 10;
          const main = String(d?.weather?.[0]?.main || '');
          const condition =
            main === 'Clear'
              ? 'Sunny'
              : main === 'Clouds'
              ? 'Cloudy'
              : main === 'Drizzle'
              ? 'Drizzle'
              : main === 'Rain'
              ? 'Rain'
              : main === 'Snow'
              ? 'Snow'
              : main === 'Thunderstorm'
              ? 'Thunderstorm'
              : 'Partly Cloudy';
          const recommendation = getRecommendation({ high, precipitation, wind, condition });
          return { date: dateStr, high, low, condition, precipitation, wind, recommendation };
        });

        return { city, days: finalDays };
      };

      const tryOpenMeteo = async (): Promise<CityWeather | null> => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max&timezone=auto&start_date=${startISO}&end_date=${endISO}`;
        const wxRes = await fetch(url);
        if (!wxRes.ok) return null;
        const wx = await wxRes.json();
        const daily = wx?.daily;
        if (!daily) return null;
        const days: WeatherDay[] = (daily.time || []).map((iso: string, idx: number) => {
          const high = Number(daily.temperature_2m_max?.[idx] ?? 0);
          const low = Number(daily.temperature_2m_min?.[idx] ?? 0);
          const precipitation = Number(daily.precipitation_probability_max?.[idx] ?? 0);
          const wind = Number(daily.windspeed_10m_max?.[idx] ?? 0);
          const cond = weatherCodeToCondition(Number(daily.weathercode?.[idx] ?? 0));
          const recommendation = getRecommendation({ high, precipitation, wind, condition: cond });
          return { date: formatDate(new Date(iso)), high, low, condition: cond, precipitation, wind, recommendation };
        });
        return { city, days };
      };

      try {
        // Prefer OpenWeatherMap if key provided; otherwise fallback to Open-Meteo
        const viaOWM = await tryOpenWeatherMap();
        if (viaOWM) return viaOWM;
        const viaOM = await tryOpenMeteo();
        if (viaOM) return viaOM;
        return null;
      } catch {
        return null;
      }
    };

    const searchPlaces = async (query: string, count: number) => {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`
      );
      const data = await res.json();
      return (data?.results || []) as Array<any>;
    };

    const parseDestination = (
      rawDestination: string
    ): { cityQuery: string; countryHint?: string; parts: string[] } => {
      const parts = String(rawDestination)
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length === 0) return { cityQuery: rawDestination, parts };
      if (parts.length === 1) return { cityQuery: parts[0], parts };
      return { cityQuery: parts[0], countryHint: parts[parts.length - 1], parts };
    };

    const pickBestMatch = (
      candidates: Array<any>,
      countryHint?: string,
      preferCityLevel: boolean = true
    ): any | undefined => {
      if (!Array.isArray(candidates) || candidates.length === 0) return undefined;
      const normalizedHint = countryHint?.toLowerCase();
      const isCityLike = (c: any) => {
        const code = String(c.feature_code || '').toUpperCase();
        return code === 'PPLA' || code === 'PPLC' || code.startsWith('PPL');
      };
      const byPopulationDesc = (a: any, b: any) => Number(b.population || 0) - Number(a.population || 0);

      let pool = [...candidates];
      if (preferCityLevel) {
        const cityOnly = pool.filter(isCityLike);
        if (cityOnly.length > 0) pool = cityOnly;
      }
      // Prefer exact/contains country match
      let match = pool.find(
        (c) =>
          normalizedHint &&
          ((c.country && String(c.country).toLowerCase().includes(normalizedHint)) ||
            (c.country_code && String(c.country_code).toLowerCase() === normalizedHint))
      );
      if (match) return match;

      // If no country match found within city-only, but a country hint exists,
      // fall back to admin-level matches (ADM1/ADM2) within the full candidate list for that country
      if (normalizedHint) {
        const isAdmin = (c: any) => String(c.feature_code || '').toUpperCase().startsWith('ADM');
        const adminMatches = candidates
          .filter(isAdmin)
          .filter(
            (c) =>
              (c.country && String(c.country).toLowerCase().includes(normalizedHint)) ||
              (c.country_code && String(c.country_code).toLowerCase() === normalizedHint)
          )
          .sort(byPopulationDesc);
        if (adminMatches.length > 0) return adminMatches[0];
      }
      // Fallback: highest population
      return [...pool].sort(byPopulationDesc)[0];
    };

    const findAdminMatchByTokens = (
      candidates: Array<any>,
      countryHint?: string,
      tokens?: string[]
    ): any | undefined => {
      if (!Array.isArray(candidates) || candidates.length === 0) return undefined;
      const normalizedHint = countryHint?.toLowerCase();
      const tokenSet = new Set((tokens || []).map((t) => t.toLowerCase()));
      const isAdmin = (c: any) => String(c.feature_code || '').toUpperCase().startsWith('ADM');
      const byPopulationDesc = (a: any, b: any) => Number(b.population || 0) - Number(a.population || 0);
      const matchCountry = (c: any) =>
        !normalizedHint ||
        (c.country && String(c.country).toLowerCase().includes(normalizedHint)) ||
        (c.country_code && String(c.country_code).toLowerCase() === normalizedHint);
      const nameMatchesToken = (c: any) => {
        const name = String(c.name || '').toLowerCase();
        if (tokenSet.has(name)) return true;
        // Also match common abbreviations for Indian states like 'UP' -> 'Uttar Pradesh'
        if (tokenSet.has('up') && name.includes('uttar pradesh')) return true;
        if (tokenSet.has('mp') && name.includes('madhya pradesh')) return true;
        if (tokenSet.has('tn') && name.includes('tamil nadu')) return true;
        if (tokenSet.has('mh') && name.includes('maharashtra')) return true;
        if (tokenSet.has('wb') && name.includes('west bengal')) return true;
        if (tokenSet.has('dl') && name.includes('delhi')) return true;
        if (tokenSet.has('pb') && name.includes('punjab')) return true;
        return false;
      };
      const admins = candidates.filter((c) => isAdmin(c) && matchCountry(c));
      const exactName = admins.filter(nameMatchesToken).sort(byPopulationDesc);
      if (exactName.length > 0) return exactName[0];
      return admins.sort(byPopulationDesc)[0];
    };

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const startISO = toIso(startDate);
        const endISO = toIso(endDate);
        // Parse destination and find the best matching place (prefer country hint if provided)
        const { cityQuery, countryHint: parsedCountryHint, parts } = parseDestination(destination);
        const effectiveCountryHint = countryHint || parsedCountryHint;
        const effectiveCityQuery = cityHint || cityQuery;
        // Try interpretation A: "City, Country"
        const candA = await searchPlaces(effectiveCityQuery || destination, 10);
        const bestA = pickBestMatch(candA, effectiveCountryHint, true);
        const adminA = findAdminMatchByTokens(candA, countryHint, parts);
        // Try interpretation B: "Country, City" (flip)
        let bestB: any | undefined = undefined;
        let adminB: any | undefined = undefined;
        if (parts && parts.length >= 2) {
          const flippedCity = parts[parts.length - 1];
          const flippedCountryHint = effectiveCountryHint || parts[0];
          const candB = await searchPlaces(flippedCity, 10);
          bestB = pickBestMatch(candB, flippedCountryHint, true);
          adminB = findAdminMatchByTokens(candB, flippedCountryHint, parts);
        }
        // Choose preferred: any city-like over country-level
        const choose = (a?: any, b?: any, aAdmin?: any, bAdmin?: any) => {
          const isCity = (c: any) => {
            const code = String(c?.feature_code || '').toUpperCase();
            return code === 'PPLA' || code === 'PPLC' || code.startsWith('PPL');
          };
          const sameCountry = (x?: any, y?: any) => {
            if (!x || !y) return true;
            const c1 = String(x.country || '').toLowerCase();
            const c2 = String(y.country || '').toLowerCase();
            const cc1 = String(x.country_code || '').toLowerCase();
            const cc2 = String(y.country_code || '').toLowerCase();
            return (c1 && c2 && c1 === c2) || (cc1 && cc2 && cc1 === cc2);
          };
          // Prefer candidates in the same country as countryHint when both available
          if (effectiveCountryHint) {
            const inHintCountry = (c: any) =>
              c && (
                (c.country && String(c.country).toLowerCase().includes(String(effectiveCountryHint).toLowerCase())) ||
                (c.country_code && String(c.country_code).toLowerCase() === String(effectiveCountryHint).toLowerCase())
              );
            if (inHintCountry(a) && !inHintCountry(b)) return a;
            if (!inHintCountry(a) && inHintCountry(b)) return b;
            if (!inHintCountry(a) && !inHintCountry(b)) {
              if (inHintCountry(aAdmin) && !inHintCountry(bAdmin)) return aAdmin;
              if (!inHintCountry(aAdmin) && inHintCountry(bAdmin)) return bAdmin;
            }
          }
          if (isCity(a) && !isCity(b)) return a;
          if (!isCity(a) && isCity(b)) return b;
          // If neither are clear city matches, prefer an admin match if available
          if (!isCity(a) && !isCity(b)) {
            if (aAdmin && !bAdmin) return aAdmin;
            if (!aAdmin && bAdmin) return bAdmin;
            if (aAdmin && bAdmin) {
              return Number(aAdmin.population || 0) >= Number(bAdmin.population || 0) ? aAdmin : bAdmin;
            }
          }
          if (a && b) {
            // tie-breaker: higher population
            return Number(a.population || 0) >= Number(b.population || 0) ? a : b;
          }
          return a || b;
        };
        let best = choose(bestA, bestB, adminA, adminB);
        if (!best) {
          if (!cancelled) setCityWeathers([]);
          return;
        }

        const destLat = Number(best.latitude);
        const destLon = Number(best.longitude);

        // Build a pool of nearby candidates using admin1 first, then country as fallback
        const admin1 = (best.admin1 as string) || '';
        const country = (best.country as string) || '';
        let pool: Array<any> = [];
        if (admin1) {
          try {
            pool = await searchPlaces(admin1, 100);
          } catch {}
        }
        if ((!pool || pool.length < 30) && country) {
          try {
            const more = await searchPlaces(country, 100);
            pool = [...(pool || []), ...(more || [])];
          } catch {}
        }
        if (!pool || pool.length === 0) {
          // last resort: broaden by destination term itself
          try {
            const more = await searchPlaces(destination, 100);
            pool = more || [];
          } catch {}
        }

        // Prepare candidate city entries with distance
        const sameCountry = (p: any) => {
          const c1 = String(p.country || '').toLowerCase();
          const c2 = String(best.country || '').toLowerCase();
          const cc1 = String(p.country_code || '').toLowerCase();
          const cc2 = String(best.country_code || '').toLowerCase();
          return (c1 && c2 && c1 === c2) || (cc1 && cc2 && cc1 === cc2);
        };
        const prepared = (pool || [])
          .filter((p: any) => p && typeof p.latitude === 'number' && typeof p.longitude === 'number')
          .filter((p: any) => {
            // keep only populated places in the same country
            const code = String(p.feature_code || '').toUpperCase();
            return sameCountry(p) && (code === 'PPLA' || code === 'PPLC' || code.startsWith('PPL'));
          })
          .map((p: any) => ({
            name: String(p.name || ''),
            lat: Number(p.latitude),
            lon: Number(p.longitude),
            feature: String(p.feature_code || ''),
            pop: Number(p.population || 0),
            country: String(p.country || ''),
            country_code: String(p.country_code || ''),
            dist: distanceKm(destLat, destLon, Number(p.latitude), Number(p.longitude)),
          }));

        // Start with strict radius, then relax until at least 5 unique cities (including the destination)
        // Destination + 5 nearby cities
        const desiredCount = 6;
        const tryBuildList = (radiusKm: number) => {
          const near = prepared
            .filter((p) => p.feature.startsWith('PPL') && p.dist <= radiusKm)
            .sort((a, b) => a.dist - b.dist || b.pop - a.pop);
          const uniqueByName = new Map<string, { name: string; lat: number; lon: number; country?: string }>();
          uniqueByName.set(best.name, { name: best.name, lat: destLat, lon: destLon, country: best.country });
          for (const p of near) {
            if (!uniqueByName.has(p.name)) {
              uniqueByName.set(p.name, { name: p.name, lat: p.lat, lon: p.lon, country: p.country });
              if (uniqueByName.size >= desiredCount) break;
            }
          }
          return Array.from(uniqueByName.values());
        };

        let list = tryBuildList(120);
        if (list.length < desiredCount) list = tryBuildList(200);
        if (list.length < desiredCount) list = tryBuildList(350);

        if (list.length < desiredCount) {
          // Fill the remaining slots with top populous in pool regardless of distance
          const uniqueNames = new Set(list.map((x) => x.name));
          const byPop = [...prepared]
            .filter((p) => p.feature.startsWith('PPL') && !uniqueNames.has(p.name))
            .sort((a, b) => b.pop - a.pop);
          for (const p of byPop) {
            list.push({ name: p.name, lat: p.lat, lon: p.lon, country: p.country });
            if (list.length >= desiredCount) break;
          }
        }

        // Fetch forecasts for selected cities (destination first)
        const jobs = list.map((p) =>
          fetchForecastForCity(
            p.country ? `${p.name}, ${p.country}` : p.name,
            p.lat,
            p.lon,
            startISO,
            endISO
          )
        );
        const results = await Promise.all(jobs);
        const filtered = results.filter(Boolean) as CityWeather[];
        if (!cancelled) setCityWeathers(filtered);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to fetch weather');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [destination, startDate, endDate]);

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('Rain')) return Droplets;
    if (condition.includes('Cloud')) return CloudSun;
    return CloudSun;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-6">
        <CloudSun className="w-6 h-6 text-ai-warning" />
        <h2 className="text-2xl font-semibold text-ai-accent">Weather Insights</h2>
      </div>

      {loading && <div className="text-sm text-foreground-muted">Loading weather for {destination}...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}

      {cityWeathers.map((cw) => (
        <div key={cw.city} className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">{cw.city}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cw.days.map((day, index) => {
          const WeatherIcon = getWeatherIcon(day.condition);
          return (
            <div
                  key={`${cw.city}-${day.date}`}
              className="glass-card-secondary p-5 animate-slide-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                      <h4 className="font-medium text-foreground">{day.date}</h4>
                  <p className="text-sm text-foreground-muted">{day.condition}</p>
                </div>
                <WeatherIcon className="w-8 h-8 text-ai-warning" />
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                <div className="flex items-center space-x-1">
                  <Thermometer className="w-4 h-4 text-ai-danger" />
                  <span className="text-foreground-muted">{day.high}°C</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Droplets className="w-4 h-4 text-ai-primary" />
                  <span className="text-foreground-muted">{day.precipitation}%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Wind className="w-4 h-4 text-ai-secondary" />
                  <span className="text-foreground-muted">{day.wind}km/h</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-ai-warning/10 border border-ai-warning/20">
                <div className="flex items-start space-x-2">
                  <Umbrella className="w-4 h-4 text-ai-warning mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-ai-warning">{day.recommendation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
        </div>
      ))}

      {cityWeathers.length > 0 && (
      <div className="glass-card p-6 mt-6">
        <h3 className="font-semibold text-foreground mb-4">Weekly Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
              <p className="text-foreground-muted">• Destination: {destination}</p>
              <p className="text-foreground-muted">• Cities covered: {cityWeathers.map((c) => c.city).join(', ')}</p>
          </div>
          <div className="space-y-2">
              <p className="text-foreground-muted">• Date range: {formatDate(startDate)} - {formatDate(endDate)}</p>
              <p className="text-foreground-muted">• Data source: Open-Meteo</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default WeatherInsights;
