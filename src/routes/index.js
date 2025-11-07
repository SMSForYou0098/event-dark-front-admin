import React from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
// import { AUTHENTICATED_ENTRY } from 'configs/AppConfig';
import { protectedRoutes, publicRoutes } from 'configs/RoutesConfig';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AppRoute from './AppRoute';
import { useMyContext } from 'Context/MyContextProvider';
import { lowerCase } from 'lodash';

const Routes = () => {
 const {userRole} = useMyContext()
 const APP_PREFIX_PATH = '/';
  // Define dashboard entry point based on role
  const AUTHENTICATED_ENTRY = ['Admin', 'Organizer'].includes(userRole) 
    ? `${APP_PREFIX_PATH}dashboard`
    : `${APP_PREFIX_PATH}dashboard/${lowerCase(userRole)}`;
	return (
		<RouterRoutes>
			<Route path="/" element={<ProtectedRoute />}>
				<Route path="/" element={<Navigate replace to={AUTHENTICATED_ENTRY} />} />
				{protectedRoutes.map((route, index) => {
					return (
						<Route 
							key={route.key + index} 
							path={route.path}
							element={
								<AppRoute
									routeKey={route.key} 
									component={route.component}
									{...route.meta} 
								/>
							}
						/>
					)
				})}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
			<Route path="/" element={<PublicRoute />}>
				{publicRoutes.map(route => {
					return (
						<Route 
							key={route.path} 
							path={route.path}
							element={
								<AppRoute
									routeKey={route.key} 
									component={route.component}
									{...route.meta} 
								/>
							}
						/ >
					)
				})}
			</Route>
		</RouterRoutes>
	)
}

export default Routes