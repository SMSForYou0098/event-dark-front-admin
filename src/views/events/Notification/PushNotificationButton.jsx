import React, { useState } from "react";
import { Button, Spin } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullhorn } from "@fortawesome/free-solid-svg-icons";
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
        icon={<FontAwesomeIcon icon={faBullhorn} />}
      >
        Push Notification
      </Button>
    </>
  );
};

export default PushNotificationButton;
