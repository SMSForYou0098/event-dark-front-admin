import React, { Fragment, useState } from "react";
import { Button, Tabs, Form, Spin } from "antd";
import { ArrowLeftOutlined, UserOutlined, ShoppingOutlined, WalletOutlined, TransactionOutlined } from "@ant-design/icons";
import { useMyContext } from "Context/MyContextProvider";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import Flex from "components/shared-components/Flex";
import UseNavigation from "utils/customNavigation";

// Tabs
import ProfileTab from "./ProfileTab";
// import BookingsTab from "./BookingsTab";
// import WalletTab from "./WalletTab";
// import TransactionsTab from "./TransactionsTab";
// import PermissionsTab from "./PermissionsTab";
// import { Shield } from "lucide-react";

const ManageUser = ({ mode = "edit" }) => {
  const { HandleBack } = useMyContext();
  const [activeTab, setActiveTab] = useState("1");
  const [form] = Form.useForm();
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
      children: <ProfileTab mode={mode} form={form} />,
    },
    // {
    //   key: "2",
    //   label: (
    //     <span>
    //       <ShoppingOutlined /> Bookings
    //     </span>
    //   ),
    //   children: <BookingsTab />,
    // },
    // {
    //   key: "3",
    //   label: (
    //     <span>
    //       <WalletOutlined /> Wallet
    //     </span>
    //   ),
    //   children: <WalletTab />,
    // },
    // {
    //   key: "4",
    //   label: (
    //     <span>
    //       <TransactionOutlined /> Transactions
    //     </span>
    //   ),
    //   children: <TransactionsTab />,
    // },
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
      <Form form={form} layout="vertical" name="user_form">
        <PageHeaderAlt overlap>
          <div className="container">
            <Flex className="pb-4" justifyContent="space-between" alignItems="center">
              <div className="d-flex align-items-center">
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={HandleBack} />
                <h2 className="mb-0">{mode === "create" ? "Create User" : "Manage User"}</h2>
              </div>
              <div>
                {activeTab === "1" && (
                  <>
                    <Button className="mr-2" onClick={() => UseNavigation(-1)}>
                      Discard
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading} onClick={() => form.submit()}>
                      {mode === "create" ? "Create" : "Update"}
                    </Button>
                  </>
                )}
              </div>
            </Flex>
          </div>
        </PageHeaderAlt>

        <div className="container" style={{ marginTop: 30 }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </div>
      </Form>
    </Fragment>
  );
};

export default ManageUser;
