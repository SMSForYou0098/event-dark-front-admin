import React, { Fragment, useState } from "react";
import { Button, Tabs, Form, Spin } from "antd";
import { ArrowLeftOutlined, UserOutlined, ShoppingOutlined, WalletOutlined, TransactionOutlined } from "@ant-design/icons";
import { useMyContext } from "Context/MyContextProvider";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import Flex from "components/shared-components/Flex";

// Tabs
import ProfileTab from "./ProfileTab";
import { useParams } from "react-router-dom";
import AssignCredit from "../wallet/AssignCredit";
import UserBookings from "views/events/Bookings/UserBookings";
import Transactions from "../wallet/Transaction";

const ManageUser = ({ mode = "edit" }) => {
  const { HandleBack } = useMyContext();
  const [activeTab, setActiveTab] = useState("1");
  const [form] = Form.useForm();
  const { id } = useParams()
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: "1",
      label: (
        <span>
          <UserOutlined /> Profile
        </span>
      ),
      children: <ProfileTab mode={mode} id={id} />,
    },
    {
      key: "2",
      label: (
        <span>
          <ShoppingOutlined /> Bookings
        </span>
      ),
      children: <UserBookings id={id} activeTab={activeTab} />,
    },
    {
      key: "3",
      label: (
        <span>
          <WalletOutlined /> Wallet
        </span>
      ),
      children: <AssignCredit id={id} />,
    },
    {
      key: "4",
      label: (
        <span>
          <TransactionOutlined /> Transactions
        </span>
      ),
      children: <Transactions userId={id} />,
    },
    // {
    //   key: "5",
    //   label: (
    //     <span>
    //       <Shield /> Permissions
    //     </span>
    //   ),
    //   children: <PermissionsTab />,
    // },
  ];

  return (
    <Fragment>
      {mode !== "create" ? 
      <>
      <PageHeaderAlt overlap>
        <div className="container-fluid">
          <Flex className="pb-4" justifyContent="space-between" alignItems="center">
            <Flex alignItems="center" gap="1rem">
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={HandleBack} style={{ width: 'inherit' }} />
              {/* <ArrowLeftOutlined /> */}
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
