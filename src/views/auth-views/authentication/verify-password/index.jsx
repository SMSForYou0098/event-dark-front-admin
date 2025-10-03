import React from "react";
import VerifyPassword from "./PasswordForm";
import CustomAuthLayout from "../../../../layouts/CustomAuthLayout";
const index = () => {
  return (
    <CustomAuthLayout>
      <VerifyPassword />
    </CustomAuthLayout>
  );
};

export default index;
