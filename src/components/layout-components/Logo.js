import React, { useEffect } from 'react'
import { SIDE_NAV_WIDTH, SIDE_NAV_COLLAPSED_WIDTH, NAV_TYPE_TOP } from 'constants/ThemeConstant';
import { APP_NAME } from 'configs/AppConfig';
import { useSelector } from 'react-redux';
import utils from 'utils';
import { Grid } from 'antd';
import styled from '@emotion/styled';
import { TEMPLATE } from 'constants/ThemeConstant';
import { useMyContext } from 'Context/MyContextProvider';
const LogoWrapper = styled.div(() => ({
	height: TEMPLATE.HEADER_HEIGHT,
	display: 'flex',
	alignItems: 'center',
	padding: '0 1rem',
	backgroundColor: 'transparent',
	transition: 'all .2s ease',
}));

const { useBreakpoint } = Grid;

export const Logo = ({ mobileLogo }) => {
    const {systemSetting} = useMyContext()
	const isMobile = !utils.getBreakPoint(useBreakpoint()).includes('lg');

	const navCollapsed = useSelector(state => state.theme.navCollapsed);
	const navType = useSelector(state => state.theme.navType);

	const getLogoWidthGutter = () => {
		const isNavTop = navType === NAV_TYPE_TOP ? true : false
		if(isMobile && !mobileLogo) {
			return 0
		}
		if(isNavTop) {
			return 'auto'
		}
		if(navCollapsed) {
			return `${SIDE_NAV_COLLAPSED_WIDTH}px`
		} else {
			return `${SIDE_NAV_WIDTH}px`
		}
	}
	const logoUrl = systemSetting?.logo

	return (
		<LogoWrapper className={`${isMobile && !mobileLogo ? 'd-none' : 'logo'}`} style={{width: `${getLogoWidthGutter()}` , padding : navCollapsed ? '0 5px' : '0 3rem'}}>
			<img src={logoUrl} alt={`${APP_NAME} logo`} height={navCollapsed ? 45 : 55} width={navCollapsed ? 70 : 90}/>
		</LogoWrapper>
	)
}

export default Logo;
