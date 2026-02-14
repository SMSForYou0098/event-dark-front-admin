export const TEXT_FIELDS = [
  {
    name: 'title',
    label: 'Title',
    span: { xs: 24, md: 12 },
    rules: [
      { required: true, message: 'Please enter title' },
      { min: 3, message: 'Title must be at least 3 characters' },
    ],
    placeholder: 'Enter banner title',
  },
  {
    name: 'button_text',
    label: 'Button Text',
    span: { xs: 24, md: 12 },
    placeholder: 'Enter button text',
  },
  {
    name: 'button_link',
    label: 'Button Link',
    span: { xs: 24, md: 12 },
    placeholder: 'Enter button link',
  },
  {
    name: 'external_url',
    label: 'External URL',
    span: { xs: 24, md: 12 },
    rules: [
      {
        type: 'url',
        message: 'Please enter a valid URL',
      },
    ],
    placeholder: 'https://example.com',
  },
  {
    name: 'media_url',
    label: 'Media URL (YouTube/Social)',
    span: { xs: 24, md: 12 },
    rules: [
      {
        type: 'url',
        message: 'Please enter a valid URL',
      },
    ],
    placeholder: 'https://youtube.com/watch?v=...',
  },
];

export const TEXTAREA_FIELDS = [
  {
    name: 'description',
    label: 'Description',
    span: { xs: 12, md: 24 },
    rules: [{ required: true, message: 'Please enter description' }],
    placeholder: 'Enter banner description',
    rows: 4,
    maxLength: 500,
  },
  // {
  //   name: 'sub_description',
  //   label: 'Sub Description',
  //   span: { xs: 12 },
  //   placeholder: 'Enter sub description (optional)',
  //   rows: 3,
  //   maxLength: 300,
  // },
];

export const IMAGE_FIELDS = [
  {
    name: 'images',
    label: 'Banner Image',
    span: { xs: 12, md: 8 },
    stateKey: 'bannerImage',
    uploadText: '',
    required: true,
  },
  {
    name: 'sm_image',
    label: 'Small Image',
    span: { xs: 12, md: 8 },
    stateKey: 'smImage',
    uploadText: '',
  },
  {
    name: 'md_image',
    label: 'Medium Image',
    span: { xs: 12, md: 8 },
    stateKey: 'mdImage',
    uploadText: '',
  },
];


// NEW CONSTANT - Add after TEXT_FIELDS
export const SWITCH_FIELDS = [
  {
    name: 'display_in_popup',
    label: 'Display in Popup',
    span: { xs: 24, md: 12 },
    tooltip: 'Enable to show this banner in a popup modal',
  },
];