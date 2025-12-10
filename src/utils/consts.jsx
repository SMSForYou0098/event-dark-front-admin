export const API_ENDPOINT_URL = process.env.REACT_APP_API_ENDPOINT_URL || 'http://localhost:8000/api/dark/';
export const USERSITE_URL = process.env.REACT_APP_USERSITE_URL || 'http://localhost:3000/';

export const PRIMARY = '#b51515';
export const SECONDARY = '#0d0d0d;';

export const ORGANIZER_ALLOWED_ROLES = [
  'POS',
  'Agent',
  'Scanner',
  'Shop Keeper',
  'Box Office Manager',
  'Sponsor',
  'Accreditation'
];
export const joditConfig = {
        readonly: false,
        autofocus: false,
        uploader: { insertImageAsBase64URI: true, url: '' },
        buttons: [
            'source', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
            'ul', 'ol', '|', 'font', 'fontsize', '|',
            'brush', '|',
            'paragraph', '|',
            'image', 'video', 'table', 'link', '|', 'align', 'undo', 'redo', '|',
            'hr', 'eraser', 'fullsize', 'preview'
        ],
        controls: {
            fontsize: {
                list: [
                    '8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32', '34', '36', '48', '60', '72', '96'
                ]
            }
        },
        colorPickerDefaultTab: 'color',
        showBrowserColorPicker: true,
        height: 300,
    };

export const DEFAULT_STADIUM_LAYOUT = {
  id: 'layout_stadium_default',
  name: 'Standard Bowl Layout',
  code: 'STD',
  stands: [
    {
      name: 'Stand A',
      code: 'A',
      order: 0,
      geometry: {
        startAngle: 0,
        endAngle: 85,
        visualWeight: 1,
        shape: 'arc',
      },
      status: 'active',
      tiers: [
        {
          name: 'Lower Bowl',
          code: 'T1',
          level: 0,
          geometry: { radiusOffset: 0, thickness: 40, elevation: 0 },
          status: 'active',
          basePrice: 750,
          sections: [
            {
              name: 'Section 1',
              code: 'S1',
              order: 0,
              geometry: { startAngle: 0, endAngle: 0, curve: 0 },
              status: 'active',
              rows: [
                {
                  label: 'A',
                  order: 0,
                  seatCount: 24,
                  geometry: { curve: 3, spacing: 2, offsetX: 0, offsetY: 0 },
                  status: 'active',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};