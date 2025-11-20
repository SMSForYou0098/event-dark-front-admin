// Seat icon options for customization
import {
  CheckCircleFilled,
  StarFilled,
  HeartFilled,
  TrophyFilled,
  CrownFilled,
  ThunderboltFilled,
  FireFilled,
  RocketFilled,
  SmileFilled,
  GiftFilled,
} from '@ant-design/icons';

export const SEAT_ICON_OPTIONS = [
  { value: 'circle', label: 'Circle', icon: CheckCircleFilled },
  { value: 'star', label: 'Star', icon: StarFilled },
  { value: 'heart', label: 'Heart', icon: HeartFilled },
  { value: 'trophy', label: 'Trophy', icon: TrophyFilled },
  { value: 'crown', label: 'Crown', icon: CrownFilled },
  { value: 'thunder', label: 'Thunder', icon: ThunderboltFilled },
  { value: 'fire', label: 'Fire', icon: FireFilled },
  { value: 'rocket', label: 'Rocket', icon: RocketFilled },
  { value: 'smile', label: 'Smile', icon: SmileFilled },
  { value: 'gift', label: 'Gift', icon: GiftFilled },
];

export const getSeatIcon = (iconType) => {
  const option = SEAT_ICON_OPTIONS.find((opt) => opt.value === iconType);
  return option?.icon || CheckCircleFilled;
};

