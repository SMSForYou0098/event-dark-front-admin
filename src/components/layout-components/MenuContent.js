import React, { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Grid } from 'antd';
import IntlMessage from '../util-components/IntlMessage';
import Icon from '../util-components/Icon';
import navigationConfig from 'configs/NavigationConfig';
import { useSelector, useDispatch } from 'react-redux';
import { SIDE_NAV_LIGHT, NAV_TYPE_SIDE } from "constants/ThemeConstant";
import utils from 'utils';
import { onMobileNavToggle } from 'store/slices/themeSlice';
import { useMyContext } from 'Context/MyContextProvider';
import { filterNavByAccess } from 'utils/hooks/useNavAccess';
import { prefetchRoute } from 'utils/routePrefetch';

const { useBreakpoint } = Grid;

/* ---------------- helpers ---------------- */

const setLocale = (localeKey, isLocaleOn = true) =>
  isLocaleOn ? <IntlMessage id={localeKey} /> : localeKey.toString();

const setDefaultOpen = (key) => {
  const keyList = [];
  if (key) {
    const arr = key.split("-");
    let acc = "";
    for (let i = 0; i < arr.length; i++) {
      acc = i === 0 ? arr[i] : `${acc}-${arr[i]}`;
      keyList.push(acc);
    }
  }
  return keyList;
};


const MenuItem = ({ title, icon, path }) => {
  const dispatch = useDispatch();
  const isMobile = !utils.getBreakPoint(useBreakpoint()).includes('lg');

  const closeMobileNav = () => {
    if (isMobile) {
      dispatch(onMobileNavToggle(false));
    }
  };

  const handleMouseEnter = () => {
    if (path) {
      prefetchRoute(path);
    }
  };

  return (
    <span onMouseEnter={handleMouseEnter}>
      {icon && <Icon type={icon} />}
      <span>{setLocale(title)}</span>
      {path && <Link onClick={closeMobileNav} to={path} />}
    </span>
  );
};

const getSideNavMenuItem = (navItem) =>
  navItem.map((nav) => ({
    key: nav.key,
    label: (
      <MenuItem
        title={nav.title}
        {...(nav.isGroupTitle ? {} : { path: nav.path, icon: nav.icon })}
      />
    ),
    ...(nav.isGroupTitle ? { type: 'group' } : {}),
    ...(nav.submenu?.length > 0 ? { children: getSideNavMenuItem(nav.submenu) } : {}),
  }));

const getTopNavMenuItem = (navItem) =>
  navItem.map((nav) => ({
    key: nav.key,
    label: (
      <MenuItem
        title={nav.title}
        icon={nav.icon}
        {...(nav.isGroupTitle ? {} : { path: nav.path })}
      />
    ),
    ...(nav.submenu?.length > 0 ? { children: getTopNavMenuItem(nav.submenu) } : {}),
  }));

const SideNavContent = (props) => {
  const { routeInfo, hideGroupTitle, sideNavTheme = SIDE_NAV_LIGHT } = props;
  const { UserPermissions = [], userRole = '' ,isMobile} = useMyContext();

  // 1) Filter the raw config by access
  const filteredNav = useMemo(
    () => filterNavByAccess(navigationConfig, UserPermissions, userRole),
    [UserPermissions, userRole]
  );

  // 2) Build Menu items from filtered tree
  const menuItems = useMemo(() => getSideNavMenuItem(filteredNav), [filteredNav]);

  return (
      <Menu
        mode="inline"
        theme={sideNavTheme === SIDE_NAV_LIGHT ? "light" : "dark"}
        style={{ height: "100%", borderInlineEnd: 0  }}
        defaultSelectedKeys={[routeInfo?.key]}
        defaultOpenKeys={setDefaultOpen(routeInfo?.key)}
        className={hideGroupTitle ? "hide-group-title" : ""}
        items={menuItems}
      />
  );
};

const TopNavContent = () => {
  const topNavColor = useSelector((state) => state.theme.topNavColor);
  const { UserPermissions = [], userRole = '' } = useMyContext();

  const filteredNav = useMemo(
    () => filterNavByAccess(navigationConfig, UserPermissions, userRole),
    [UserPermissions, userRole]
  );

  const menuItems = useMemo(() => getTopNavMenuItem(filteredNav), [filteredNav]);

  return (
    <Menu
      mode="horizontal"
      style={{ backgroundColor: topNavColor }}
      items={menuItems}
    />
  );
};

const MenuContent = (props) => {
  return props.type === NAV_TYPE_SIDE ? (
    <SideNavContent {...props} />
  ) : (
    <TopNavContent {...props} />
  );
};

export default MenuContent;
