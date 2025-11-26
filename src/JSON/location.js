// utils/locationUtils.js
import axios from 'axios';
import { message } from 'antd';

const BASE_URL = 'https://countriesnow.space/api/v0.1/countries';
const CACHE_KEY = 'locationData';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Load from cache
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

// Fetch and cache location data
export const fetchLocationData = async (country = 'India') => {
    try {
        // Fetch states
        const statesResponse = await axios.post(`${BASE_URL}/states`, {
            country
        });

        if (!statesResponse.data?.data?.states) {
            throw new Error('No states data received');
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
                console.error(`Failed to fetch cities for ${state.value}`);
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
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));

        return {
            states: stateList,
            citiesCache
        };
    } catch (err) {
        //console.error('Failed to fetch location data:', err);
        //message.error('Failed to load location data');
        throw err;
    }
};

// Get cities by state name
export const getCitiesForState = (citiesCache, stateName) => {
    return citiesCache[stateName] || [];
};