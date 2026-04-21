export const API_ENDPOINT_URL = process.env.REACT_APP_API_ENDPOINT_URL || 'http://localhost:8000/api/dark/';
export const USERSITE_URL = process.env.REACT_APP_USERSITE_URL || 'http://localhost:3000/';

export const PRIMARY = '#b51515';
export const SECONDARY = '#13c2c2';

// Chart & UI Colors - Unified mapping for both ApexCharts (hex) and Ant Design Tag (color names)
export const COLOR_MAP = {
  red: { hex: '#f5222d', antd: 'red' },
  blue: { hex: '#1890ff', antd: 'blue' },
  cyan: { hex: '#13c2c2', antd: 'cyan' },
  green: { hex: '#52c41a', antd: 'green' },
  gold: { hex: '#faad14', antd: 'gold' },
  magenta: { hex: '#eb2f96', antd: 'magenta' },
  purple: { hex: '#722ed1', antd: 'purple' },
};

// Individual color constants (hex)
export const COLOR_BLUE = COLOR_MAP.blue.hex;
export const COLOR_GREEN = COLOR_MAP.green.hex;
export const COLOR_GOLD = COLOR_MAP.gold.hex;
export const COLOR_PINK = COLOR_MAP.magenta.hex;
export const COLOR_RED = COLOR_MAP.red.hex;
export const COLOR_PURPLE = COLOR_MAP.purple.hex;
export const COLOR_CYAN = COLOR_MAP.cyan.hex;

// Chart Color Palette (hex - for ApexCharts)
export const CHART_COLORS = [
  COLOR_MAP.red.hex,
  COLOR_MAP.blue.hex,
  COLOR_MAP.cyan.hex,
  COLOR_MAP.green.hex,
  COLOR_MAP.gold.hex,
  COLOR_MAP.magenta.hex,
  COLOR_MAP.purple.hex,
];

// Ant Design Tag Colors (for Tag component)
export const CHART_COLORS_ANTD = [
  COLOR_MAP.red.antd,
  COLOR_MAP.blue.antd,
  COLOR_MAP.cyan.antd,
  COLOR_MAP.green.antd,
  COLOR_MAP.gold.antd,
  COLOR_MAP.magenta.antd,
  COLOR_MAP.purple.antd,
];


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
  addNewLine: false,
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