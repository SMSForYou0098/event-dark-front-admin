import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from 'lucide-react';

// Contact fields configuration
export const contactFields = [
  {
    name: 'footerContact',
    label: 'Footer Contact',
    placeholder: 'Enter footer contact',
    span: { xs: 24, lg: 8 },
  },
  {
    name: 'footerWaNumber',
    label: 'Footer WhatsApp Number',
    placeholder: 'Enter WhatsApp number',
    span: { xs: 24, lg: 8 },
  },
  {
    name: 'footerEmail',
    label: 'Footer Email',
    placeholder: 'Enter footer email',
    type: 'email',
    span: { xs: 24, lg: 8 },
  },
];

// Social media fields configuration
export const socialMediaFields = [
  {
    name: 'facebook',
    label: 'Facebook',
    placeholder: 'Enter Facebook URL',
    icon: Facebook,
    span: { xs: 24, sm: 12, lg: 8 },
  },
  {
    name: 'instagram',
    label: 'Instagram',
    placeholder: 'Enter Instagram URL',
    icon: Instagram,
    span: { xs: 24, sm: 12, lg: 8 },
  },
  {
    name: 'youtube',
    label: 'YouTube',
    placeholder: 'Enter YouTube URL',
    icon: Youtube,
    span: { xs: 24, sm: 12, lg: 8 },
  },
  {
    name: 'twitter',
    label: 'X (Twitter)',
    placeholder: 'Enter X (Twitter) URL',
    icon: Twitter,
    span: { xs: 24, sm: 12, lg: 8 },
  },
  {
    name: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'Enter LinkedIn URL',
    icon: Linkedin,
    span: { xs: 24, sm: 12, lg: 8 },
  },
];

// Upload configurations (without state - only static config)
export const uploadFieldsConfig = [
  {
    key: 'footerLogo',
    label: 'Footer Logo',
    dataKey: 'footer_logo',
    uid: '-1',
    span: { xs: 24, lg: 12 },
  },
  {
    key: 'footerBG',
    label: 'Footer Background (350 x 1980)',
    dataKey: 'footer_bg',
    uid: '-2',
    span: { xs: 24, lg: 12 },
  },
];

// Form initial values mapping
export const formFieldMapping = {
  footerContact: 'footer_contact',
  footerWaNumber: 'whatsapp_number',
  footerEmail: 'footer_email',
};
