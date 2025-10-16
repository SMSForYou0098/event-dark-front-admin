import React from 'react'
import { SIDE_NAV_WIDTH, SIDE_NAV_COLLAPSED_WIDTH, NAV_TYPE_TOP } from 'constants/ThemeConstant';
import { APP_NAME } from 'configs/AppConfig';
import { useSelector } from 'react-redux';
import utils from 'utils';
import { Grid } from 'antd';
import styled from '@emotion/styled';
import { TEMPLATE } from 'constants/ThemeConstant';
import logoUrl from '../../assets/event/stock/logo.webp'
const LogoWrapper = styled.div(() => ({
	height: TEMPLATE.HEADER_HEIGHT,
	display: 'flex',
	alignItems: 'center',
	padding: '0 1rem',
	backgroundColor: 'transparent',
	transition: 'all .2s ease',
}));

const { useBreakpoint } = Grid;

export const Logo = ({ mobileLogo, logoType }) => {
	
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


	return (
		<LogoWrapper className={`nav-logo ${isMobile && !mobileLogo ? 'd-none' : 'logo'}`} style={{width: `${getLogoWidthGutter()}`}}>
			<img src={logoUrl} alt={`${APP_NAME} logo`} height={55} width={90}/>
		</LogoWrapper>
	)
}

export default Logo;
