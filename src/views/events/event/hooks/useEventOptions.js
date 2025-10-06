// hooks/useEventOptions.js
import { useMutation, useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import axios from 'axios';

export const useOrganizers = () =>
  useQuery({
    queryKey: ['organizers'],
    queryFn: async () => {
      const res = await api.get('organizers');

      if (res?.status !== true) {
        throw new Error(res?.message || 'Failed to fetch organizers');
      }
      // Return only the array of organizers
      return Array.isArray(res?.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
  });


// ------- Countries (external API) -------
export const useCountries = () =>
  useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      // you used POST in your sample; keeping it the same
      const res = await axios.post('https://api.first.org/data/v1/countries');
      const data = res?.data?.data || {};
      const options = Object.values(data).map((item) => ({
        label: item.country,
        value: item.country,
      }));
      // add disabled placeholder first (AntD expects `disabled`, not isDisabled)
      return [{ label: 'Select Country', value: '', disabled: true }, ...options];
    },
    staleTime: 24 * 60 * 60 * 1000, // countries rarely change
  });

// ------- States (depends on country) -------
export const useStates = (country) =>
  useQuery({
    queryKey: ['states', country || ''],
    enabled: !!country,
    queryFn: async () => {
      const res = await axios.post('https://countriesnow.space/api/v0.1/countries/states', {
        country,
      });
      const states = res?.data?.data?.states || [];
      const options = states.map((s) => ({ label: s.name, value: s.name }));
      return [{ label: 'Select State', value: '', disabled: true }, ...options];
    },
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

// ------- Cities (depends on country & state) -------
export const useCities = (country, state) =>
  useQuery({
    queryKey: ['cities', country || '', state || ''],
    enabled: !!country && !!state,
    queryFn: async () => {
      const res = await axios.post(
        'https://countriesnow.space/api/v0.1/countries/state/cities',
        { country, state }
      );
      const cities = res?.data?.data || [];
      const options = cities.map((c) => ({ label: c, value: c }));
      return [{ label: 'Select City', value: '', disabled: true }, ...options];
    },
    staleTime: 3 * 60 * 60 * 1000,
    retry: 1,
  });


  // -------venues by org id ----------

  export const useVenuesByOrganizer = (organizerId) =>
  useQuery({
    queryKey: ['venues-by-organizer', organizerId],
    enabled: !!organizerId, // only fetch when an organizer is selected
    queryFn: async () => {
      const res = await api.get(`/venue-list/${organizerId}`);

      if (res?.status !== true) {
        throw new Error(res?.message || 'Failed to fetch venues');
      }

      // Return the raw list; map to Select options in the component
      return Array.isArray(res?.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
  });


//  ---- getting all the event categorties ----

export const useEventCategories = (options = {}) =>
  useQuery({
    queryKey: ['event-categories'],
    queryFn: async () => {
      const res = await api.get('category-title'); // auth header added automatically by interceptor

      // If your interceptor returns { status, categoryData }
      const rawData = res?.categoryData || res?.data?.categoryData || res?.data;

      if (!rawData) throw new Error('Invalid response structure');

      const transformed = Object.values(rawData).map((item) => ({
        label: item.title,
        value: item.id,
      }));

      return transformed;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options, // allow custom overrides
  });



  // sanitizing payload
  const sanitize = (obj) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );


  // --------- mutation hooks for edit ----------

export const useCreateEvent = (options = {}) =>
  useMutation({
    mutationFn: async (payloadOrFormData) => {
      const body = payloadOrFormData; // already FormData from the component
      const res = await api.post('/create-event', body, {
        headers: { /* let browser set multipart boundary; omit Content-Type */ },
      });
      if (res?.status === false) {
        const err = new Error(res?.message || 'Failed to create event');
        err.server = res;
        throw err;
      }
      return res;
    },
    ...options,
  });


  // helpers/formData.js
export const buildEventFormData = (values = {}) => {
  const fd = new FormData();

  // remove any accidental camelCase remnants
  const {
    event_thumbnail,            // antd fileList (array)
    event_gallery,              // antd fileList (array)
    instagram_thumbnail,
    arena_layout,
    tickets,
    ...rest
  } = values;

  // Scalars / JSON
  Object.entries(rest).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'object') fd.append(k, JSON.stringify(v));
    else fd.append(k, String(v));
  });

  // Tickets (array of objects)
  if (Array.isArray(tickets)) fd.append('tickets', JSON.stringify(tickets));

  // Single file helpers
  const appendSingle = (key, list) => {
    const file = Array.isArray(list) ? list[0]?.originFileObj : undefined;
    if (file) fd.append(key, file, file.name);
  };

  appendSingle('event_thumbnail', event_thumbnail);
  appendSingle('instagram_thumbnail', instagram_thumbnail);
  appendSingle('arena_layout', arena_layout);

  // Multi-file gallery
  if (Array.isArray(event_gallery)) {
    event_gallery.forEach((fObj) => {
      const file = fObj?.originFileObj;
      if (file) fd.append('event_gallery[]', file, file.name);
    });
  }

  return fd;
};

