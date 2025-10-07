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
// const sanitize = (obj) =>
//   Object.fromEntries(
//     Object.entries(obj || {}).filter(
//       ([, v]) => v !== undefined && v !== null && v !== ''
//     )
//   );


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
// buildEventFormData.js
export function buildEventFormData(values) {
  const fd = new FormData();

  const appendIfDefined = (k, v) => {
    if (v === undefined || v === null) return;
    fd.append(k, String(v));
  };

  const appendSingleUpload = (key, fileList) => {
    if (!Array.isArray(fileList) || !fileList.length) return;
    const f = fileList[0];
    // when editing, an existing file shows as an item with `url` and NO originFileObj → skip
    if (!f || !f.originFileObj) return;
    const file = f.originFileObj;
    const name = f.name || 'file';
    fd.append(key, file, name);
  };

  // --- NEW: index-based multi upload for gallery (images_1..images_4) ---
  const appendIndexedGalleryUploads = (fileList) => {
    if (!Array.isArray(fileList) || !fileList.length) return;
    let idx = 1;
    for (const f of fileList) {
      if (idx > 4) break; // controller loops images_1..images_4
      if (f && f.originFileObj) {
        const name = f.name || `image_${idx}`;
        fd.append(`images_${idx}`, f.originFileObj, name);
        idx += 1;
      }
    }
  };

  // --- NEW: keep existing gallery URLs (not removed) ---
  // These are the Upload items that only have `url` (no originFileObj).
  const appendExistingGalleryUrls = (fileList) => {
    if (!Array.isArray(fileList)) return;
    fileList.forEach((f) => {
      if (f && f.url && !f.originFileObj) {
        // Use an array param so backend can merge:
        // Example controller: $keep = $request->input('existing_images', []);
        fd.append('existing_images[]', f.url);
      }
    });
  };

  // ---------- BASIC ----------
  appendIfDefined('user_id', values.user_id);
  appendIfDefined('category', values.category);
  appendIfDefined('name', values.name);
  appendIfDefined('country', 'India'); // fixed to India
  appendIfDefined('country', values.country);
  appendIfDefined('state', values.state);
  appendIfDefined('city', values.city);
  appendIfDefined('venue_id', values.venue_id);
  appendIfDefined('description', values.description);

  // ---------- CONTROLS ----------
  appendIfDefined('scan_detail', values.scan_detail);
  appendIfDefined('event_feature', values.event_feature ?? 0);
  appendIfDefined('status', values.status ?? 0);
  appendIfDefined('house_full', values.house_full ?? 0);
  appendIfDefined('online_att_sug', values.online_att_sug ?? 0);
  appendIfDefined('offline_att_sug', values.offline_att_sug ?? 0);
  appendIfDefined('multi_scan', values.multi_scan ?? 0);
  appendIfDefined('ticket_system', values.ticket_system ?? 0);
  appendIfDefined('bookingBySeat', values.bookingBySeat ?? 0);
  appendIfDefined('insta_whts_url', values.insta_whts_url);
  appendIfDefined('whts_note', values.whatsappNote);
  appendIfDefined('ticket_terms', values.ticket_terms);

  // ---------- TIMING ----------
  appendIfDefined('date_range', values.date_range); // "YYYY-MM-DD,YYYY-MM-DD"
  appendIfDefined('entry_time', values.entry_time); // "HH:mm"
  appendIfDefined('start_time', values.start_time); // "HH:mm"
  appendIfDefined('end_time', values.end_time);     // "HH:mm"
  appendIfDefined('event_type', values.event_type);
  appendIfDefined('map_code', values.map_code);
  appendIfDefined('address', values.address);

  // ---------- SEO ----------
  appendIfDefined('meta_title', values.meta_title);
  appendIfDefined('meta_description', values.meta_description);
  appendIfDefined('meta_tag', values.tags);
  appendIfDefined('meta_keyword', values.keyword);

  // ---------- TICKETS ----------
  if (Array.isArray(values.tickets)) {
    fd.append('tickets', JSON.stringify(values.tickets));
  }

  // ---------- FILES (ANTD Upload fileList) ----------
  if (Array.isArray(values.thumbnail)) {
    appendSingleUpload('thumbnail', values.thumbnail);
  }
  if (Array.isArray(values.insta_thumb)) {
    appendSingleUpload('insta_thumb', values.insta_thumb);
  }
  if (Array.isArray(values.layout_image)) {
    appendSingleUpload('layout_image', values.layout_image);
  }

  // GALLERY:
  // 1) Keep existing (non-removed) URLs so backend can merge
  // 2) Send new uploads as images_1..images_4
  if (Array.isArray(values.images)) {
    appendExistingGalleryUrls(values.images);
    appendIndexedGalleryUploads(values.images);
  }

  // Images the user removed in the UI (we put these in a hidden field in the form)
  if (Array.isArray(values.remove_images)) {
    values.remove_images.forEach((url) => fd.append('remove_images[]', url));
  }

  // ---------- URL fields ----------
  appendIfDefined('youtube_url', values.youtube_url);
  // Map to backend name:
  appendIfDefined('insta_url', values.instagram_media_url);

  return fd;
}




export const useEventDetail = (id, options = {}) =>
  useQuery({
    queryKey: ['event-detail', id],
    enabled: !!id, // Only run when ID is present
    queryFn: async () => {
      const res = await api.get(`event-detail/${id}`);

      // Expected response structure:
      // { status: true, message: "...", data: { ...eventData } }

      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to fetch event details');
        err.server = res;
        throw err;
      }

      return res?.events || {}; // Return event data
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2; // Retry only on 5xx
    },
    ...options,
  });



// -------- -------- mutation hooks for edit ----------
// hooks/useEventOptions.js (add this)
export const useUpdateEvent = (options = {}) =>
  useMutation({
    mutationFn: async ({ id, body }) => {
      // body is FormData
      const res = await api.post(`/update-event/${id}`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res?.status === false) {
        const err = new Error(res?.message || 'Failed to update event');
        err.server = res;
        throw err;
      }
      return res;
    },
    ...options,
  });


  export const  toUploadFileList = (raw) => {
  // raw can be array or JSON string; normalize to array of URLs
  let urls = [];
  if (Array.isArray(raw)) urls = raw;
  else if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) urls = parsed; } catch(e) {}
  }

  // only keep up to 4 since backend expects images_1..images_4
  return urls.slice(0, 4).map((url, i) => {
    // try to extract a readable file name from the URL
    const lastPart = String(url).split('/').pop() || `image-${i + 1}.jpg`;
    return {
      uid: `img-${i + 1}`,
      name: lastPart,
      status: 'done',
      url,              // AntD will use this for preview
    };
  });
};


