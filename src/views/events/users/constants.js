import { BadgeDollarSign, Phone, ScanLine, ShoppingCart, Sparkle, Store, Tickets, UsersRound } from "lucide-react";

export const roles = [
  { label: "POS", icon: <ShoppingCart size={16} />, key: "POS" },
  { label: "Agent", icon: <UsersRound size={16} />, key: "Agent" },
  { label: "Scanner", icon: <ScanLine size={16} />, key: "Scanner" },
  // {
  //   label: "Support Executive",
  //   icon: <Phone size={16} />,
  //   key: "Support-Executive",
  // },
  { label: "Shop Keeper", icon: <Store size={16} />, key: "Shop-Keeper" },
  {
    label: "Box Office Manager",
    icon: <Tickets size={16} />,
    key: "Box-Office-Manager",
  },
  { label: "Sponsor", icon: <BadgeDollarSign size={16} />, key: "Sponsor" },
  {
    label: "Accreditation",
    icon: <Sparkle size={16} />,
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