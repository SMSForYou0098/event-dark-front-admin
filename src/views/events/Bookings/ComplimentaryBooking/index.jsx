import React, { memo, Fragment, useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Space, Tag, Modal, message, Switch } from "antd";
import {
  SendOutlined,
  FileZipOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import apiClient from "auth/FetchInterceptor";

import DataTable from "views/events/common/DataTable";
import { useMyContext } from "Context/MyContextProvider";
import generateQRCodeZip from "../../Tickets/generateQRCodeZip";
import QRGenerator from "../../Tickets/QRGenerator";
import BatchDataModel from "./BatchDataModel";

const { confirm } = Modal;

const CbList = memo(() => {
  const { UserData, formatDateTime, loader } = useMyContext();
  const queryClient = useQueryClient();
  const [batchData, setBatchData] = useState([]);
  const [show, setShow] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // Fetch complimentary bookings using TanStack Query
  const {
    data: bookings = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["complimentaryBookings", UserData?.id],
    queryFn: async () => {
      const response = await apiClient.get(
        `complimentary-bookings/${UserData?.id}`
      );
      return response?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!UserData?.id,
  });

  // Fetch batch bookings
  const fetchBatchBookings = useCallback(
    async (batchId) => {
      try {
        const response = await apiClient.post(
          `fetch-batch-cb/${UserData?.id}`,
          { batch_id: batchId }
        );

        if (response?.status) {
          const bk = response.tokens;
          const qrCodeIds = bk?.map((item) => ({
            token: item?.token,
            name: item?.name,
            email: item?.email,
            number: item?.number,
          }));
          return { bk, qrCodeIds };
        }
        throw new Error("Failed to fetch batch data");
      } catch (error) {
        message.error("Failed to fetch bookings");
        throw error;
      }
    },
    [UserData?.id]
  );

  // Toggle booking status mutation
  const toggleBookingMutation = useMutation({
    mutationFn: async ({ id, isDeleted, batchId }) => {
      const method = isDeleted ? "get" : "delete";
      const endpoint = isDeleted
        ? "complimatory/restore-booking"
        : "complimatory/delete-booking";

      if (method === "delete") {
        return await apiClient.delete(`${endpoint}/${batchId}`);
      } else {
        return await apiClient.get(`${endpoint}/${batchId}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["complimentaryBookings", UserData?.id],
      });
      message.success(`Ticket ${variables.isDeleted ? "enabled" : "disabled"} successfully.`);
    },
    onError: (error) => {
      console.error("Error:", error);
      message.error("Failed to process your request");
    },
  });

  // Handle delete/restore booking
  const DeleteBooking = useCallback(
    (id) => {
      const data = bookings?.find((item) => item?.batch_id === id);
      if (!data) return;

      confirm({
        title: "Are you sure?",
        icon: <ExclamationCircleOutlined />,
        content: `Do you want to ${data?.is_deleted ? "enable" : "disable"
          } this ticket?`,
        okText: data?.is_deleted ? "Yes, enable it!" : "Yes, disable it!",
        cancelText: "Cancel",
        onOk() {
          toggleBookingMutation.mutate({
            id: data.id,
            isDeleted: data.is_deleted,
            batchId: data.batch_id,
          });
        },
      });
    },
    [bookings, toggleBookingMutation]
  );

  // Handle resend
  const HandleResend = useCallback(
    async (batchId) => {
      try {
        const data = await fetchBatchBookings(batchId);
        if (data?.bk) {
          setBatchData(data.bk);
          setSelectedBatchId(batchId);
          setShow(true);
        }
      } catch (error) {
        console.error("Error in HandleResend:", error);
      }
    },
    [fetchBatchBookings]
  );

  // Generate ZIP
  const generateZip = useCallback(
    async (data) => {
      await generateQRCodeZip({
        bookings: data,
        QRGenerator: QRGenerator,
        loader: loader,
      });
    },
    [loader]
  );

  // Handle ZIP download
  const HandleZipDownload = useCallback(
    (batchId) => {
      confirm({
        title: "Are you sure?",
        icon: <ExclamationCircleOutlined />,
        content: "Do you want to generate and download the ZIP file?",
        okText: "Yes, Make A Zip",
        cancelText: "Cancel",
        async onOk() {
          try {
            const bks = await fetchBatchBookings(batchId);
            if (bks?.qrCodeIds) {
              await generateZip(bks.qrCodeIds);
            }
          } catch (error) {
            console.error("Error generating ZIP:", error);
          }
        },
      });
    },
    [fetchBatchBookings, generateZip]
  );

  // Close modal
  const onHide = useCallback(() => {
    setShow(false);
    setBatchData([]);
    setSelectedBatchId(null);
  }, []);

  // Define columns
  const columns = useMemo(
    () => [
      {
        title: "#",
        key: "index",
        align: "center",
        width: 60,
        render: (_, __, index) => index + 1,
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        align: "center",
        searchable: true,
      },
      {
        title: "Number",
        dataIndex: "number",
        key: "number",
        align: "center",
        searchable: true,
      },
      {
        title: "Event Name",
        dataIndex: "event_name",
        key: "event_name",
        align: "center",
        searchable: true,
      },
      {
        title: "Ticket Type",
        dataIndex: "ticket_name",
        key: "ticket_name",
        align: "center",
        searchable: true,
      },
      {
        title: "Total Bookings",
        dataIndex: "booking_count",
        key: "booking_count",
        align: "center",
        sorter: (a, b) => a.booking_count - b.booking_count,
        render: (count) => (
          <Tag color="blue" style={{ fontSize: 14 }}>
            {count}
          </Tag>
        ),
      },
      {
        title: "Generate Date",
        dataIndex: "booking_date",
        key: "booking_date",
        align: "center",
        sorter: (a, b) =>
          new Date(a.booking_date) - new Date(b.booking_date),
        render: (date) => formatDateTime(date),
      },
      {
        title: "Status",
        dataIndex: "is_deleted",
        key: "status",
        align: "center",
        width: 120,
        filters: [
          { text: "Active", value: 0 },
          { text: "Disabled", value: 1 },
        ],
        onFilter: (value, record) => record.is_deleted === value,
        render: (isDeleted, record) => (
          <Switch
            checked={!isDeleted}
            onChange={() => DeleteBooking(record.batch_id)}
            checkedChildren="Active"
            unCheckedChildren="Disabled"
            loading={toggleBookingMutation.isPending}
          />
        ),
      },
      {
        title: "Action",
        key: "action",
        align: "center",
        width: 120,
        render: (_, record) => (
          <Space size="small">
            {record.type === 1 && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => HandleResend(record.batch_id, record)}
                disabled={record?.is_deleted}
                title="Resend Tickets"
                size="small"
              />
            )}
            <Button
              type="default"
              icon={<FileZipOutlined />}
              onClick={() => HandleZipDownload(record.batch_id)}
              disabled={record?.is_deleted}
              title="Download ZIP"
              size="small"
              style={{ color: "#52c41a" }}
            />
          </Space>
        ),
      },
    ],
    [
      DeleteBooking,
      HandleResend,
      HandleZipDownload,
      formatDateTime,
      toggleBookingMutation.isPending,
    ]
  );

  return (
    <Fragment>
      <BatchDataModel show={show} onHide={onHide} batchData={batchData} batchId={selectedBatchId} />

      <DataTable
        title="Complimentary Bookings"
        data={bookings}
        columns={columns}
        loading={isLoading}
        error={error}
        showRefresh
        onRefresh={refetch}
        enableExport
        exportRoute="export-complimentaryBooking"
        ExportPermission={true}
        emptyText="No complimentary bookings found"
        enableSearch
        showSearch
        extraHeaderContent={
          <Link to="new">
            <Button type="primary">New Booking</Button>
          </Link>
        }
        tableProps={{
          bordered: false,
        }}
      />
    </Fragment>
  );
});

CbList.displayName = "CbList";
export default CbList;