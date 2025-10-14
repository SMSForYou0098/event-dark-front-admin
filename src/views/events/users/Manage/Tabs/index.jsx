import React from 'react'
import { UserOutlined, LockOutlined, CreditCardOutlined, SafetyOutlined, WhatsAppOutlined, KeyOutlined} from '@ant-design/icons';
import { Menu } from 'antd';
import { Link, Route, Navigate, useLocation, Routes, useParams } from 'react-router-dom';
import InnerAppLayout from 'layouts/inner-app-layout';
import EditProfile from './EditProfile';
import ChangePassword from './ChangePassword';
import Billing from './Billing';
import UserPermission from './Permissions';
import MetaCredential from './MetaCredential';
import { useMyContext } from 'Context/MyContextProvider';
import Security from './Security';
import AdminSetting from './AdminSetting';

const url = '/users/manage'
const UserSetting = () => {
	const { api, authToken, waToken, navigate, UserData } = useMyContext();
	const { id } = useParams();
	return (
		<InnerAppLayout
			sideContentWidth={320}
			sideContent={<SettingOption id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate} UserData={UserData} />}
			mainContent={<SettingContent id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate} UserData={UserData} />}
		/>
	);
}
const MenuItem = ({ icon, path, label }) => {
	return (
		<>
			{icon}
			<span>{label}</span>
			<Link to={`${url}/${path}`} />
		</>
	);
};

const SettingOption = ({ id, api, authToken, waToken, navigate }) => {
	const location = useLocation();
	const locationPath = location.pathname.split('/');
	const currentpath = locationPath[locationPath.length - 1];
	const { Permisson } = useMyContext();

	return (
		<Menu
			mode="inline"
			selectedKeys={[currentpath]}
		>
			{Permisson?.includes('View Basic Profile') &&
				<Menu.Item key="Basic Information" icon={<UserOutlined />}><MenuItem label="Basic Information" path={`${id}/Basic Information`} /></Menu.Item>
			}
			{Permisson?.includes('Change Banking') &&
				<Menu.Item key="Banking" icon={<LockOutlined />}><MenuItem label="Banking" path={`${id}/Banking`} /></Menu.Item>

			}
			{/* internal is not completed  */}
			{Permisson?.includes('Banking') &&
				<Menu.Item key="Banking" icon={<CreditCardOutlined />}><MenuItem label="Banking" path={`${id}/Banking`} /></Menu.Item>
			}
			{Permisson?.includes('View User Permission') &&
				<Menu.Item key="permissions" icon={<SafetyOutlined />}><MenuItem label="Permissions" path={`${id}/permissions`} /></Menu.Item>
			}
			{Permisson?.includes('View Meta Credential') &&
				<Menu.Item key="credential" icon={<WhatsAppOutlined />}><MenuItem label="Meta Credential" path={`${id}/credential`} /></Menu.Item>
			}
			{Permisson?.includes('View User Security') &&
				<Menu.Item key="security" icon={<KeyOutlined />}><MenuItem label="Security" path={`${id}/security`} /></Menu.Item>
			}
			{/* {Permisson?.includes('View System Setting') &&
			<Menu.Item key="setting" icon={<SettingOutlined />}><MenuItem label="Setting" path={`${id}/setting`} /></Menu.Item>
			} */}
		</Menu>
	);
};

const SettingContent = ({ id, api, authToken, waToken, navigate, UserData, themeData }) => {
	return (
		<Routes>
			{/* <Route path={`/`} exact element={<EditProfile UserData={UserData} id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate} />} />
			<Route path={`/edit-profile`} exact element={<EditProfile UserData={UserData} id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate} />} />
			<Route path={`/change-password`} exact element={<ChangePassword UserData={UserData} id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate} />} />
			<Route path={`/billing`} exact element={<Billing themeData={themeData} UserData={UserData} id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate} />} />
			<Route path={`/permissions`} exact element={<UserPermission UserData={UserData} id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate} />} />
			<Route path={`/credential`} exact element={<MetaCredential UserData={UserData} id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate} />} />
			<Route path={`/security`} exact element={<Security UserData={UserData} id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate} />} />
			<Route path={`/setting`} exact element={<AdminSetting UserData={UserData} id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate}/>} />
			<Route path={`/*`} exact element={<Navigate to={`edit-profile`} UserData={UserData} id={id} api={api} authToken={authToken} waToken={waToken} navigate={navigate} />} /> */}
		</Routes>
	);
};



export default UserSetting;
