import React from "react";
import Transactions from "../wallet/Transaction";

const TransactionsTab = ({ userId }) => {
  return <Transactions userId={userId} />;
};

export default TransactionsTab;
