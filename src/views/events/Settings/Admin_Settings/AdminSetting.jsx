import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Form, Button, Spin, message } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMyContext } from '../../../../Context/MyContextProvider'
import axios from 'axios'
import SiteSettings from './SiteSettings'

const AdminSetting = () => {
    const { api, authToken } = useMyContext();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    // Only keep state for file uploads (Form can't handle File objects)
    const [fileUploads, setFileUploads] = useState({
        logo: null,
        authLogo: null,
        favicon: null,
        mobileLogo: null,
        homeDivider: null,
        agreementPdf: null,
        eSignature: null
    });

    const SETTINGS_QUERY_KEY = ['settings'];

    // Fetch settings query
    const {
        data: settingsData,
        isLoading: configLoading,
        error: queryError,
    } = useQuery({
        queryKey: SETTINGS_QUERY_KEY,
        queryFn: async () => {
            const res = await axios.get(`${api}settings`, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                }
            });

            if (res.data.status) {
                return res.data.data;
            }
            throw new Error('Failed to fetch settings');
        },
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        gcTime: 1000 * 60 * 10,
    });

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (formData) => {
            return axios.post(`${api}setting`, formData, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'multipart/form-data'
                }
            });
        },
        onSuccess: (response) => {
            if (response.data.status) {
                message.success(response?.data?.message || 'App Configuration Stored Successfully');
                queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
            }
        },
        onError: (error) => {
            console.error('Error updating settings:', error);
            message.error('Failed to update settings');
        }
    });

    // Handle query error
    useEffect(() => {
        if (queryError) {
            console.error('Settings query error:', queryError);
            message.error('Failed to fetch settings');
        }
    }, [queryError]);

    // Populate form when data is fetched
    useEffect(() => {
        if (settingsData) {
            const configData = settingsData;

            // Parse home divider data
            let parsedDividerUrl = {};
            if (configData?.home_divider_url) {
                try {
                    parsedDividerUrl = JSON.parse(configData.home_divider_url);
                } catch {
                    parsedDividerUrl = {};
                }
            }

            // Set all form values at once
            form.setFieldsValue({
                app_name: configData?.app_name || '',
                meta_title: configData?.meta_title || '',
                meta_tag: configData?.meta_tag || '',
                meta_description: configData?.meta_description || '',
                missed_call_no: configData?.missed_call_no || '',
                whatsapp_number: configData?.whatsapp_number || '',
                copyright: configData?.copyright || '',
                copyright_link: configData?.copyright_link || '',
                complimentary_attendee_validation: configData?.complimentary_attendee_validation === 1,
                notify_req: configData?.notify_req === 1,
                navColor: configData?.navColor || '',
                fontColor: configData?.fontColor || '',
                footer_font_Color: configData?.footer_font_Color || '',
                home_bg_color: configData?.home_bg_color || '',
                home_divider_url: parsedDividerUrl.url || '',
                external_link: parsedDividerUrl.external_link || false,
                new_tab: parsedDividerUrl.new_tab || false,
                ai_keys: (() => {
                    try {
                        return configData?.ai_keys ? JSON.parse(configData.ai_keys) : [];
                    } catch {
                        return [];
                    }
                })(),
            });

            // Set file URLs for preview (not File objects)
            setFileUploads({
                logo: configData?.logo || null,
                authLogo: configData?.auth_logo || null,
                favicon: configData?.favicon || null,
                mobileLogo: configData?.mo_logo || null,
                homeDivider: configData?.home_divider || null,
                agreementPdf: configData?.agreement_pdf || null,
                eSignature: configData?.e_signature || null
            });
        }
    }, [settingsData, form]);

    const handleAppConfig = async (values) => {
        const formData = new FormData();

        // Append all form values
        Object.keys(values).forEach(key => {
            if (values[key] !== undefined && values[key] !== null) {
                if (typeof values[key] === 'boolean') {
                    formData.append(key, values[key] ? 1 : 0);
                } else {
                    formData.append(key, values[key]);
                }
            }
        });

        // Append file uploads only if they are File objects
        if (fileUploads.logo instanceof File) {
            formData.append('logo', fileUploads.logo);
        }
        if (fileUploads.authLogo instanceof File) {
            formData.append('auth_logo', fileUploads.authLogo);
        }
        if (fileUploads.favicon instanceof File) {
            formData.append('favicon', fileUploads.favicon);
        }
        if (fileUploads.mobileLogo instanceof File) {
            formData.append('mo_logo', fileUploads.mobileLogo);
        }
        if (fileUploads.homeDivider instanceof File) {
            formData.append('home_divider', fileUploads.homeDivider);
        }
        if (fileUploads.agreementPdf instanceof File) {
            formData.append('agreement_pdf', fileUploads.agreementPdf);
        }
        if (fileUploads.eSignature instanceof File) {
            formData.append('e_signature', fileUploads.eSignature);
        }

        // Append home_divider_url as JSON
        formData.append(
            "home_divider_url",
            JSON.stringify({
                url: values.home_divider_url || '',
                external_link: values.external_link || false,
                new_tab: values.new_tab || false,
            })
        );

        // Append ai_keys as JSON
        if (values.ai_keys && values.ai_keys.length > 0) {
            formData.append('ai_keys', JSON.stringify(values.ai_keys));
        }

        updateSettingsMutation.mutate(formData);
    };

    const loading = {
        configLoading,
        saveLoading: updateSettingsMutation.isPending
    };

    return (
        <Spin spinning={configLoading} tip="Loading settings...">
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card
                        title="Admin Settings"
                        bordered={false}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleAppConfig}
                        >
                            <SiteSettings
                                loading={loading}
                                form={form}
                                fileUploads={fileUploads}
                                setFileUploads={setFileUploads}
                            />

                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={loading.saveLoading}
                                            disabled={loading.saveLoading}
                                            size="large"
                                        >
                                            Submit
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </Spin>
    )
}

export default AdminSetting
