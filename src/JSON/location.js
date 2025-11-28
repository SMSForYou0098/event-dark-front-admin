// utils/locationUtils.js
import axios from 'axios';
import localLocationData from './locationData.json';

const BASE_URL = 'https://countriesnow.space/api/v0.1/countries';
const CACHE_KEY = 'locationData';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Load location data from localStorage cache
 * @returns {Object|null} Cached location data or null if not found/expired
 */
export const loadLocationFromCache = () => {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (!cachedData) return null;

        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - (parsed.timestamp || 0);

        // Return null if cache expired
        if (cacheAge > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return {
            states: parsed.states || [],
            citiesCache: parsed.citiesCache || {}
        };
    } catch (err) {
        console.error('Failed to load location cache:', err);
        return null;
    }
};

/**
 * Load location data from local JSON file as fallback
 * @returns {Object} Location data from local JSON
 */
export const loadLocationFromLocalJSON = () => {
    try {
        console.log('📁 Loading location data from local JSON file...');

        // Transform states data to match expected format
        const stateList = localLocationData.states.map(state => ({
            value: state.name,
            label: state.name,
            state_code: state.state_code
        }));

        // Transform cities data to match expected format
        const citiesCache = {};
        Object.keys(localLocationData.cities).forEach(stateName => {
            citiesCache[stateName] = localLocationData.cities[stateName].map(city => ({
                value: city,
                label: city
            }));
        });

        const localData = {
            states: stateList,
            citiesCache
        };

        // Cache the local data for future use
        const dataToCache = {
            ...localData,
            timestamp: Date.now(),
            source: 'local_json'
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
        console.log('✅ Local location data loaded and cached successfully');

        return localData;
    } catch (err) {
        console.error('❌ Failed to load location data from local JSON:', err);
        // Return minimal fallback data
        return {
            states: [],
            citiesCache: {}
        };
    }
};

/**
 * Fetch location data from API with fallback mechanisms
 * Three-tier fallback: API → LocalStorage → Local JSON
 * @param {string} country - Country name (default: 'India')
 * @returns {Promise<Object>} Location data with states and cities
 */
export const fetchLocationData = async (country = 'India') => {
    console.log('🌍 Fetching location data...');

    // Tier 1: Try API first
    try {
        console.log('🔄 Attempting to fetch from API...');

        // Fetch states
        const statesResponse = await axios.post(`${BASE_URL}/states`, {
            country
        }, {
            timeout: 5000 // 5 second timeout
        });

        if (!statesResponse.data?.data?.states) {
            throw new Error('No states data received from API');
        }

        const stateList = statesResponse.data.data.states.map(state => ({
            value: state.name,
            label: state.name,
            state_code: state.state_code
        }));

        // Fetch cities for all states in parallel
        const citiesPromises = stateList.map(async (state) => {
            try {
                const citiesResponse = await axios.post(`${BASE_URL}/state/cities`, {
                    country,
                    state: state.value
                }, {
                    timeout: 5000
                });

                return {
                    state: state.value,
                    cities: citiesResponse.data?.data
                        ? citiesResponse.data.data.map(city => ({
                            value: city,
                            label: city
                        }))
                        : []
                };
            } catch (err) {
                console.warn(`⚠️ Failed to fetch cities for ${state.value}`);
                return { state: state.value, cities: [] };
            }
        });

        const citiesData = await Promise.all(citiesPromises);

        // Build cities cache
        const citiesCache = {};
        citiesData.forEach(({ state, cities }) => {
            citiesCache[state] = cities;
        });

        // Save to localStorage
        const dataToCache = {
            states: stateList,
            citiesCache,
            timestamp: Date.now(),
            source: 'api'
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
        console.log('✅ Location data fetched from API and cached successfully');

        return {
            states: stateList,
            citiesCache
        };
    } catch (apiError) {
        console.warn('⚠️ API fetch failed:', apiError.message);
        console.log('🔄 Falling back to local JSON data...');

        // Tier 2 is handled by the caller (loadLocationFromCache)
        // Tier 3: Use local JSON as last resort
        return loadLocationFromLocalJSON();
    }
};

/**
 * Get cities for a specific state
 * @param {Object} citiesCache - Cities cache object
 * @param {string} stateName - Name of the state
 * @returns {Array} Array of cities for the state
 */
export const getCitiesForState = (citiesCache, stateName) => {
    return citiesCache[stateName] || [];
};