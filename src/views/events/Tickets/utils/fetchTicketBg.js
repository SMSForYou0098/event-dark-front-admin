import axios from 'axios';

/**
 * Fetch ticket background image and return a blob URL.
 * Shared between TicketModal and TicketCanvasView to avoid duplicating API calls.
 *
 * @param {string} apiBase - Base API URL from context (e.g. useMyContext().api)
 * @param {string} path - Background image path from ticket background_image
 * @returns {Promise<string|null>} - Blob URL or null if path is empty
 */
export const fetchTicketBgBlobUrl = async (apiBase, path) => {
  if (!apiBase || !path) return null;

  const response = await axios.post(
    `${apiBase}get-image/retrive`,
    { path },
    { responseType: 'blob' }
  );

  return URL.createObjectURL(response.data);
};

