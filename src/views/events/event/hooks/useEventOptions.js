// hooks/useEventOptions.js
import { useMutation, useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
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

// -------venues by org id ----------

export const useVenues = () =>
  useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const res = await api.get(`/venues`);

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
    queryKey: ["event-categories"],
    queryFn: async () => {
      const res = await api.get("category-title"); // auth header added automatically by interceptor

      // If your interceptor returns { status, categoryData }
      const rawData = res?.categoryData || res?.data?.categoryData || res?.data;

      if (!rawData) throw new Error("Invalid response structure");

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
export function buildEventFormData(values, isDraft = false) {
  const fd = new FormData();
  const appendIfDefined = (k, v) => {
    if (v === undefined || v === null) return;
    fd.append(k, String(v));
  };

  const appendSingleUpload = (key, fileList) => {
    if (!Array.isArray(fileList) || !fileList.length) return;
    const f = fileList[0];
    if (!f || !f.originFileObj) return; // skip existing URL-only
    fd.append(key, f.originFileObj, f.name || 'file');
  };

  // --- GALLERY HELPERS ---
  const appendExistingGalleryUrls = (fileList) => {
    if (!Array.isArray(fileList)) return;
    fileList.forEach((f) => {
      if (f?.url && !f.originFileObj) {
        fd.append('existing_images[]', f.url);
      }
    });
  };

  const appendGalleryUploadsAsArray = (fileList) => {
    if (!Array.isArray(fileList)) return;
    fileList.forEach((f) => {
      if (f?.originFileObj) {
        fd.append('images[]', f.originFileObj, f.name || 'image');
      }
    });
  };

  // ---------- BASIC ----------
  if (values.step === 'basic') {
    appendIfDefined('user_id', values.org_id);
    appendIfDefined('category', values.category);
    appendIfDefined('name', values.name);
    appendIfDefined('venue_id', values.venue_id);
    appendIfDefined('description', values.description);
  }

  // ---------- CONTROLS ----------
  if (values.step === 'controls') {
    appendIfDefined('scan_detail', Number(values.scan_detail));
    // Send boolean values directly to API
    appendIfDefined('event_feature', values.event_feature ?? false);
    appendIfDefined('status', values.status ?? false);
    appendIfDefined('house_full', values.house_full ?? false);
    appendIfDefined('online_att_sug', values.online_att_sug ?? false);
    appendIfDefined('offline_att_sug', values.offline_att_sug ?? false);
    appendIfDefined('show_on_home', values.show_on_home ?? false);
    appendIfDefined('is_postponed', values.is_postponed ?? false);
    appendIfDefined('is_cancelled', values.is_cancelled ?? false);
    appendIfDefined('is_sold_out', values.is_sold_out ?? false);
    // Booking control fields (default true)
    appendIfDefined('online_booking', values.online_booking ?? true);
    appendIfDefined('agent_booking', values.agent_booking ?? true);
    appendIfDefined('pos_booking', values.pos_booking ?? true);
    appendIfDefined('complimentary_booking', values.complimentary_booking ?? true);
    appendIfDefined('sponsor_booking', values.sponsor_booking ?? true);

    // Convert expected_date to string format if it's a moment/dayjs object
    if (values.expected_date) {
      const dateStr = values.expected_date?.format ? values.expected_date.format('YYYY-MM-DD') : values.expected_date;
      appendIfDefined('expected_date', dateStr);
    }

    // storing instagram post id from url
    const extractInstagramId = (url) => {
      if (!url) return undefined;
      const match = url.match(/instagram\.com\/p\/([^/?]+)/i);
      return match ? match[1] : url.trim(); // fallback if only ID is entered directly
    };

    // Example usage:
    appendIfDefined('insta_whts_url', extractInstagramId(values.insta_whts_url));

    appendIfDefined('whts_note', values.whts_note);
    appendIfDefined('booking_notice', values.booking_notice);
  }

  // ---------- TIMING ----------
  if (values.step === 'timing') {
    appendIfDefined('date_range', values.date_range);
    appendIfDefined('entry_time', values.entry_time);
    appendIfDefined('start_time', values.start_time);
    appendIfDefined('end_time', values.end_time);
    appendIfDefined('overnight_event', values.overnight_event ? 1 : 0);
    appendIfDefined('event_type', values.event_type);
  }

  // ---------- TICKETS ----------
  if (values.step === 'tickets') {
    if (Array.isArray(values.tickets)) {
      fd.append('tickets', JSON.stringify(values.tickets));
    }
    appendIfDefined('ticket_terms', values.ticket_terms);
    appendIfDefined('multi_scan', values.multi_scan ?? false);
    appendIfDefined('ticket_system', values.ticket_system ? 0 : 1);
  }

  // ---------- ARTIST ----------
  if (values.step === 'artist') {
    appendIfDefined('artist_id', values.artist_id);
  }

  // ---------- MEDIA ----------
  if (values.step === 'media') {
    // Now these are URL strings from the media gallery picker (not fileList arrays)
    appendIfDefined('thumbnail', values.thumbnail);
    appendIfDefined('insta_thumbnail', values.insta_thumbnail);
    appendIfDefined('layout_image', values.layout_image);

    // Gallery images - join as comma-separated string (like venue_images)
    if (Array.isArray(values.images) && values.images.length > 0) {
      fd.append('images', values.images.join(','));
    }

    // Media URLs
    appendIfDefined('youtube_url', values.youtube_url);
    appendIfDefined('insta_url', values.instagram_media_url);
  }

  // ---------- SEO ----------
  if (values.step === 'seo') {
    appendIfDefined('meta_title', values.meta_title);
    appendIfDefined('meta_description', values.meta_description);
    appendIfDefined('meta_tag', values.meta_tag);
    appendIfDefined('meta_keyword', values.meta_keyword);
    appendIfDefined('seo_type', 'event');
  }

  // ---------- PUBLISH ----------
  if (values.step === 'publish') {
    appendIfDefined('status', values.status ?? 1);
  }

  // Always append the step identifier
  appendIfDefined('step', values.step || '');
  if (isDraft) appendIfDefined('status', 0);

  return fd;
}


export const useEventDetail = (id, step = null, options = {}) =>
  useQuery({
    queryKey: ['event-detail', id, step], // Include step in cache key
    enabled: !!id, // Only run when ID is present
    queryFn: async () => {
      const url = step
        ? `edit-event/${id}/${step}`
        : `edit-detail/${id}`;
      //     const url = step 
      // ? `event-detail/${id}?step${step}` 
      // : `edit-detail/${id}`;
      const res = await api.get(url);

      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to fetch event details');
        err.server = res;
        throw err;
      }

      return res?.event || {}; // Return event data
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus (optional)
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


export const toUploadFileList = (raw) => {
  // raw can be array or JSON string; normalize to array of URLs
  let urls = [];
  if (Array.isArray(raw)) urls = raw;
  else if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) urls = parsed; } catch (e) { }
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




// ------- artist api call --------

export const useArtists = (options = {}) =>
  useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
      const res = await api.get(`artists`);
      const rawData = res?.artists || res?.data?.artists || res?.data;

      if (!rawData) throw new Error('Invalid response structure');

      // Transform for AntD Select
      // const transformed = rawData.map((artist) => ({
      //   label: artist.name,
      //   value: artist.id,
      // }));

      return rawData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options, // allow overrides
  });


/**
* Optional: helper to build FormData for artist payloads with files.
* Use only if you need to send images/files.
*/
export const buildArtistFormData = (values = {}) => {
  const fd = new FormData();

  const append = (k, v) => {
    if (v === undefined || v === null || v === '') return;
    fd.append(k, v);
  };

  // Append primitives (strings/numbers/booleans)
  Object.entries(values).forEach(([k, v]) => {
    // Skip file-like fields here; they’re appended below
    if (['image', 'photo', 'avatar', 'thumbnail', 'banner', 'files', 'images'].includes(k)) return;

    // arrays/objects (e.g. socials) can be stringified if needed
    if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
      append(k, JSON.stringify(v));
    } else {
      append(k, String(v));
    }
  });

  // Single-file fields commonly used
  const singleFileKeys = ['image', 'photo', 'avatar', 'thumbnail', 'banner'];
  singleFileKeys.forEach((key) => {
    const f = values?.[key];
    if (!f) return;
    // AntD Upload: either a file obj or fileList[0]
    const fileObj = Array.isArray(f) ? f[0] : f;
    const origin = fileObj?.originFileObj || fileObj;
    if (origin instanceof File || origin instanceof Blob) {
      fd.append(key, origin, fileObj?.name || 'file');
    }
  });

  // Multi-file fields (e.g., gallery)
  const multiFileKeys = ['files', 'images'];
  multiFileKeys.forEach((key) => {
    const list = values?.[key];
    if (!Array.isArray(list)) return;
    list.forEach((f) => {
      const origin = f?.originFileObj || f;
      if (origin instanceof File || origin instanceof Blob) {
        fd.append(`${key}[]`, origin, f?.name || 'file');
      }
    });
  });

  return fd;
};

/**
 * POST /artist-store
 * - Accepts either a plain object (JSON) or FormData (for file uploads).
 * - If you use FormData, pass it directly as the mutation variable.
 */
export const useCreateArtist = (options = {}) =>
  useMutation({
    mutationFn: async (payload) => {
      // payload can be FormData or a plain object
      const res = await api.post('artist-store', payload);
      return res?.data;
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * POST /artist-update/{id}
 * - Accepts either a plain object (JSON) or FormData (for file uploads).
 * - Call as: mutate({ id, payload })
 */
export const useUpdateArtist = (options = {}) =>
  useMutation({
    mutationFn: async ({ id, payload }) => {
      if (!id) throw new Error('Artist ID is required');
      const res = await api.post(`artist-update/${id}`, payload);
      return res?.data;
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });
