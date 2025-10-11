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
];

export const TEXTAREA_FIELDS = [
  {
    name: 'description',
    label: 'Description',
    span: { xs: 24 },
    rules: [{ required: true, message: 'Please enter description' }],
    placeholder: 'Enter banner description',
    rows: 4,
    maxLength: 500,
  },
  {
    name: 'sub_description',
    label: 'Sub Description',
    span: { xs: 24 },
    placeholder: 'Enter sub description (optional)',
    rows: 3,
    maxLength: 300,
  },
];

export const IMAGE_FIELDS = [
  {
    name: 'images',
    label: 'Banner Image',
    span: { xs: 24, md: 8 },
    stateKey: 'bannerImage',
    uploadText: 'Upload Banner',
    required: true,
  },
  {
    name: 'sm_image',
    label: 'Small Image',
    span: { xs: 24, md: 8 },
    stateKey: 'smImage',
    uploadText: 'Upload SM',
  },
  {
    name: 'md_image',
    label: 'Medium Image',
    span: { xs: 24, md: 8 },
    stateKey: 'mdImage',
    uploadText: 'Upload MD',
  },
];