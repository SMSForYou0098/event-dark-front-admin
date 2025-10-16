import React, { useState } from "react";
import {
    Modal,
    Form,
    Input,
    Upload,
    Button,
    message,
    Segmented,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useMyContext } from "Context/MyContextProvider";

const PushNotificationModal = ({ show, onHide, setIsLoading }) => {
    const { api, authToken, UserData } = useMyContext();
    const [form] = Form.useForm();

    const [fileList, setFileList] = useState([]);

    const userGroups = [
        { value: "live", label: "Live Users" },
        { value: "4hours", label: "Last 4 Hour Users" },
        { value: "today", label: "Today Users" },
        { value: "2days", label: "Last Two Days" },
        { value: "all", label: "All Users" },
    ];

    const handleFinish = async (values) => {
        try {
            setIsLoading(true);

            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("body", values.body);
            formData.append("user_group", values.userGroup);
            formData.append("user_id", UserData?.id);

            if (fileList.length > 0) {
                formData.append("image", fileList[0]);
            }

            if (values.url) {
                formData.append("url", values.url);
            }

            await axios.post(`${api}send-to-token`, formData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            message.success("Push notification sent successfully!");
            handleClose();
        } catch (error) {
            console.error("Error sending notification:", error);
            message.error("Failed to send notification");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        form.resetFields();
        setFileList([]);
        onHide();
    };

    const handleFileChange = ({ fileList }) => {
        // Limit to one image
        setFileList(fileList.slice(-1).map(file => file.originFileObj));
    };

    return (
        <Modal
            open={show}
            onCancel={handleClose}
            title="Send Push Notification"
            footer={<>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="primary" htmlType="submit" onClick={()=>form.submit()}>
                    Send Notification
                </Button>
            </>}
            width={800}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{ userGroup: "live" }}
            >
                <Form.Item
                    name="userGroup"
                    label="User Group"
                    rules={[{ required: true, message: "Please select a user group" }]}
                >
                    <Segmented
                        options={userGroups.map(group => ({
                            label: group.label,
                            value: group.value
                        }))}
                        block
                    />
                </Form.Item>

                <Form.Item
                    name="image"
                    label="Image (Optional)"
                    valuePropName="fileList"
                    getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
                >
                    <Upload
                        accept="image/*"
                        beforeUpload={() => false} // prevent auto upload
                        onChange={handleFileChange}
                        maxCount={1}
                    >
                        <Button icon={<UploadOutlined />}>Upload Image</Button>
                    </Upload>
                </Form.Item>

                <Form.Item
                    name="title"
                    label="Title"
                    rules={[
                        { required: true, message: "Please enter a title" },
                    ]}
                >
                    <Input placeholder="Enter notification title" />
                </Form.Item>

                <Form.Item
                    name="body"
                    label="Body"
                    rules={[
                        { required: true, message: "Please enter a message body" },
                    ]}
                >
                    <Input.TextArea rows={3} placeholder="Enter notification message" />
                </Form.Item>

                <Form.Item
                    name="url"
                    label="URL (Optional)"
                    rules={[
                        {
                            type: "url",
                            message: "Please enter a valid URL (http/https)",
                            pattern: /^https?:\/\/.+/,
                            required: false,
                        },
                    ]}
                >
                    <Input placeholder="Enter a URL for notification click action" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PushNotificationModal;
