import { BadgeDollarSign, Phone, ScanLine, ShoppingCart, Sparkle, Store, Tickets, UsersRound } from "lucide-react";

export const roles = [
  { label: "POS", icon: <ShoppingCart size={24} />, key: "POS" },
  { label: "Agent", icon: <UsersRound size={24} />, key: "Agent" },
  { label: "Scanner", icon: <ScanLine size={24} />, key: "Scanner" },
  // {
  //   label: "Support Executive",
  //   icon: <Phone size={24} />,
  //   key: "Support-Executive",
  // },
  { label: "Shop Keeper", icon: <Store size={24} />, key: "Shop-Keeper" },
  {
    label: "Box Office Manager",
    icon: <Tickets size={24} />,
    key: "Box-Office-Manager",
  },
  { label: "Sponsor", icon: <BadgeDollarSign size={24} />, key: "Sponsor" },
  {
    label: "Accreditation",
    icon: <Sparkle size={24} />,
    key: "Accreditation",
  },
];

// Roles that Organizer can create
export const ORGANIZER_ALLOWED_ROLES = [
  'POS',
  'Agent',
  'Scanner',
  'Shop Keeper',
  'Box Office Manager',
  'Sponsor',
  'Accreditation',
];

// Roles that only Admin can create
export const ADMIN_ONLY_ROLES = [
  'Admin',
  'Organizer',
  'Support Executive',
];