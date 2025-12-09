import React, { useState } from "react";
import { Button } from "antd";
import { NotificationOutlined } from "@ant-design/icons";
import PushNotificationModal from "./PushNotificationModal";

const PushNotificationButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      {/* Modal Component */}
      <PushNotificationModal
        show={showModal}
        setIsLoading={setIsLoading}
        onHide={() => setShowModal(false)}
      />
    
      {/* Button with loading & icon */}
      <Button
        type="primary"
        loading={isLoading}
        onClick={() => setShowModal(true)}
        icon={<NotificationOutlined />}
      >
        Push Notification
      </Button>
    </>
  );
};

export default PushNotificationButton;
