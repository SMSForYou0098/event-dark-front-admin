import React, { Fragment, useState, useCallback } from "react";
import { Button, Tabs, Form, Spin } from "antd";
import { ArrowLeftOutlined, UserOutlined, ShoppingOutlined, WalletOutlined, TransactionOutlined, SafetyOutlined } from "@ant-design/icons";
import { useMyContext } from "Context/MyContextProvider";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import Flex from "components/shared-components/Flex";

// Tabs
import ProfileTab from "./ProfileTab";
import { useParams } from "react-router-dom";
import AssignCredit from "../wallet/AssignCredit";
import UserBookings from "views/events/Bookings/UserBookings";
import Transactions from "../wallet/Transaction";
import PermissionsTab from "./PermissionsTab";

const ManageUser = ({ mode = "edit" }) => {
  const { HandleBack, userRole, UserPermissions } = useMyContext();
  const [activeTab, setActiveTab] = useState("1");
  const { id } = useParams()
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

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
      children: <ProfileTab setSelectedRole={setSelectedRole} mode={mode} id={id} />,
       permission: "Edit Profile",
    },
    {
      key: "2",
      label: (
        <span>
          <ShoppingOutlined /> Bookings
        </span>
      ),
      children: <UserBookings id={id} activeTab={activeTab} />,
      permission: "View Bookings",
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
      permission: "View Permission",
      condition: mode !== "create" || userRole === "admin"
    },
  ];

  // helper to check permission (admins bypass permissions)
  const hasPermission = (
    (permission) => {
      if (!permission) return true;
      if (userRole === 'admin') return true;
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
          </Flex>
        </div>
      </PageHeaderAlt>
      <div className="container-fluid" style={{ marginTop: 30 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>
      </>
       :
       <ProfileTab mode={mode}/>
      }
    </Fragment>
  );
};

export default ManageUser;
