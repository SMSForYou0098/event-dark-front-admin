import React, { Fragment, useState, useCallback } from "react";
import { Button, Tabs, Form, Spin, message } from "antd";
import { ArrowLeftOutlined, UserOutlined, ShoppingOutlined, WalletOutlined, TransactionOutlined, SafetyOutlined, ReloadOutlined } from "@ant-design/icons";
import apiClient from "auth/FetchInterceptor";
import { useMyContext } from "Context/MyContextProvider";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import Flex from "components/shared-components/Flex";
import Utils from "utils";

// Tabs
import ProfileTab from "./ProfileTab";
import { useParams } from "react-router-dom";
import AssignCredit from "../wallet/AssignCredit";
import UserBookings from "views/events/Bookings/UserBookings";
import Transactions from "../wallet/Transaction";
import PermissionsTab from "./PermissionsTab";

const ManageUser = ({ mode = "edit" }) => {
  const { HandleBack, userRole, UserPermissions, UserData } = useMyContext();
  const [activeTab, setActiveTab] = useState("1");
  const { id } = useParams()
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [userNumber, setUserNumber] = useState(null);
  const [resetOtpLoading, setResetOtpLoading] = useState(false);

  // Reset OTP limits API call
  const handleResetOtpLimits = async () => {
    if (!userNumber) {
      message.warning('User phone number not available');
      return;
    }
    setResetOtpLoading(true);
    try {
      const response = await apiClient.post('reset-otp-limits', { number: userNumber });
      if (response?.status) {
        message.success(response?.message || 'OTP limits reset successfully');
      } else {
        message.error(response?.message || 'Failed to reset OTP limits');
      }
    } catch (error) {
      message.error(Utils.getErrorMessage(error));
    } finally {
      setResetOtpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <Spin size="large" />
      </div>
    );
  }

  const allTabItems = [
    {
      key: "1",
      label: (
        <span>
          <UserOutlined /> Profile
        </span>
      ),
      children: <ProfileTab setSelectedRole={setSelectedRole} setUserNumber={setUserNumber} mode={mode} id={id} />,
      permission: "Update User",
    },
    {
      key: "2",
      label: (
        <span>
          <ShoppingOutlined /> Bookings
        </span>
      ),
      children: <UserBookings id={id} activeTab={activeTab} />,
      permission: "My Bookings",
    },
    {
      key: "3",
      label: (
        <span>
          <WalletOutlined /> Wallet
        </span>
      ),
      children: <AssignCredit id={id} />,
      condition: selectedRole === "Wallet Agent" || selectedRole === "Agent",
    },
    {
      key: "4",
      label: (
        <span>
          <TransactionOutlined /> Transactions
        </span>
      ),
      children: <Transactions userId={id} />,
      condition: selectedRole === "Wallet Agent" || selectedRole === "Agent"
    },
    {
      key: "5",
      label: (
        <span>
          <SafetyOutlined /> Permissions
        </span>
      ),
      children: <PermissionsTab userId={id} />,
      permission: "Assign Role",
      condition: mode !== "create" && UserData?.id !== parseInt(id)
    },
  ];

  // helper to check permission (admins bypass permissions)
  const hasPermission = (
    (permission) => {
      if (!permission) return true;
      if (userRole === 'Admin') return true;
      return Array.isArray(UserPermissions) && UserPermissions.includes(permission);
    }
  );

  // Filter tabs based on conditions and permissions
  const tabItems = allTabItems.filter(
    (tab) => (tab.condition === undefined || tab.condition) && hasPermission(tab.permission)
  );

  return (
    <Fragment>
      {mode !== "create" ?
        <>
          <PageHeaderAlt overlap>
            <div className="container-fluid">
              <Flex className="pb-4" justifyContent="space-between" alignItems="center">
                <Flex alignItems="center" gap="1rem">
                  <Button type="text" icon={<ArrowLeftOutlined />} onClick={HandleBack} style={{ width: 'inherit' }} />
                  <h2 className="mb-0">{mode === "create" ? "Create User" : "Manage User"}</h2>
                </Flex>
                {mode === "edit" && userNumber && userRole === "Admin" && (
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    loading={resetOtpLoading}
                    onClick={handleResetOtpLimits}
                  >
                    Reset OTP Limits
                  </Button>
                )}
              </Flex>
            </div>
          </PageHeaderAlt>
          <div className="container-fluid" style={{ marginTop: 30 }}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
          </div>
        </>
        :
        <ProfileTab mode={mode} />
      }
    </Fragment>
  );
};

export default ManageUser;
