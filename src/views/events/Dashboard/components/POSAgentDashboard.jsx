import React, { memo } from "react";
import AgentPOSDashboardLayout from "./AgentPOSDashboardLayout";

const POSAgentDashboard = memo(() => {
  return <AgentPOSDashboardLayout />;
});

POSAgentDashboard.displayName = "POSAgentDashboard";
export default POSAgentDashboard;