import { MdOutlineChair, MdOutlineTableBar } from 'react-icons/md';
import { PiArmchairLight, PiChair, PiOfficeChair } from 'react-icons/pi';
import { FaChair } from 'react-icons/fa';
import { LuSofa } from 'react-icons/lu';
import { TbSofa } from 'react-icons/tb';
import { GiRoundTable } from 'react-icons/gi';
import { SiTablecheck } from 'react-icons/si';

export const seatIcons = [
    { id: 'chair1', name: 'Chair 1', icon: 'FaChair' },
    { id: 'chair2', name: 'Chair 2', icon: 'MdOutlineChair' },
    { id: 'chair3', name: 'Armchair', icon: 'PiArmchairLight' },
    { id: 'chair4', name: 'Simple Chair', icon: 'PiChair' },
    { id: 'chair5', name: 'Office Chair', icon: 'PiOfficeChair' },
    { id: 'sofa1', name: 'Sofa 1', icon: 'LuSofa' },
    { id: 'sofa2', name: 'Sofa 2', icon: 'TbSofa' },
    { id: 'table1', name: 'Round Table', icon: 'GiRoundTable' },
    { id: 'table2', name: 'Table', icon: 'SiTablecheck' },
    { id: 'table3', name: 'Bar Table', icon: 'MdOutlineTableBar' }
  ];

export const getIconComponent = (iconName) => {
    const iconMap = {
      'FaChair': FaChair,
      'MdOutlineChair': MdOutlineChair,
      'PiArmchairLight': PiArmchairLight,
      'PiChair': PiChair,
      'PiOfficeChair': PiOfficeChair,
      'LuSofa': LuSofa,
      'TbSofa': TbSofa,
      'GiRoundTable': GiRoundTable,
      'SiTablecheck': SiTablecheck,
      'MdOutlineTableBar': MdOutlineTableBar
    };
    return iconMap[iconName];
  };