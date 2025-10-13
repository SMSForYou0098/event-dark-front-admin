import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Input, Row, Upload, Typography } from 'antd';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import JoditEditor from 'jodit-react';
import {
  contactFields,
  socialMediaFields,
  uploadFieldsConfig,
  formFieldMapping,
} from './constants';

const { Title } = Typography;

const FooterSettingComp = ({ footerSettings, socialMediaData, onSave, isSaving }) => {
  const [form] = Form.useForm();
  const [footerLogoFileList, setFooterLogoFileList] = useState([]);
  const [footerBGFileList, setFooterBGFileList] = useState([]);
  const [footerAddress, setFooterAddress] = useState('');
  const [siteCredit, setSiteCredit] = useState('');

  // Map upload configs to state handlers
  const uploadStateMap = {
    footerLogo: {
      fileList: footerLogoFileList,
      setFileList: setFooterLogoFileList,
    },
    footerBG: {
      fileList: footerBGFileList,
      setFileList: setFooterBGFileList,
    },
  };

  // Initialize form values and file lists
  useEffect(() => {
    if (footerSettings || socialMediaData) {
      const formValues = {
        footerContact: footerSettings?.footer_contact || '',
        footerWaNumber: footerSettings?.whatsapp_number || '',
        footerEmail: footerSettings?.footer_email || '',
        facebook: socialMediaData?.facebook || '',
        instagram: socialMediaData?.instagram || '',
        youtube: socialMediaData?.youtube || '',
        twitter: socialMediaData?.twitter || '',
        linkedin: socialMediaData?.linkedin || '',
      };

      form.setFieldsValue(formValues);
      setFooterAddress(footerSettings?.footer_address || '');
      setSiteCredit(footerSettings?.site_credit || '');

      // Set default file lists from config
      uploadFieldsConfig.forEach((config) => {
        const stateHandler = uploadStateMap[config.key];
        if (footerSettings?.[config.dataKey] && stateHandler) {
          stateHandler.setFileList([
            {
              uid: config.uid,
              name: `${config.dataKey}.png`,
              status: 'done',
              url: footerSettings[config.dataKey],
            },
          ]);
        }
      });
    }
  }, [footerSettings, socialMediaData, form]);

  const handleSubmit = (values) => {
    const submitData = {
      ...values,
      footerLogo:
        footerLogoFileList.length > 0 && footerLogoFileList[0].originFileObj
          ? footerLogoFileList[0].originFileObj
          : null,
      footerBG:
        footerBGFileList.length > 0 && footerBGFileList[0].originFileObj
          ? footerBGFileList[0].originFileObj
          : null,
      footerAddress,
      siteCredit,
    };
    onSave(submitData);
  };

  // Generic file change handler
  const handleFileChange = (stateKey) => ({ fileList }) => {
    uploadStateMap[stateKey].setFileList(fileList.slice(-1));
  };

  // Preview handler
  const handlePreview = async (file) => {
    let src = file.url;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  // Upload button
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={4}>Footer Settings</Title>
        </Col>

        {/* Upload Fields */}
        {uploadFieldsConfig.map((config) => {
          const { fileList } = uploadStateMap[config.key];
          return (
            <Col key={config.key} {...config.span}>
              <Form.Item label={config.label}>
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={handleFileChange(config.key)}
                  onPreview={handlePreview}
                  beforeUpload={() => false}
                  accept="image/*"
                  maxCount={1}
                >
                  {fileList.length >= 1 ? null : uploadButton}
                </Upload>
              </Form.Item>
            </Col>
          );
        })}

        {/* Contact Fields */}
        {contactFields.map((field) => (
          <Col key={field.name} {...field.span}>
            <Form.Item label={field.label} name={field.name}>
              <Input
                type={field.type || 'text'}
                placeholder={field.placeholder}
              />
            </Form.Item>
          </Col>
        ))}

        {/* Footer Address */}
        <Col span={24}>
          <Form.Item label="Footer Address">
            <JoditEditor
              value={footerAddress}
              onChange={(newContent) => setFooterAddress(newContent)}
              tabIndex={1}
            />
          </Form.Item>
        </Col>

        {/* Social Media Links */}
        <Col span={24}>
          <Title level={5} style={{ marginTop: 16 }}>
            Social Media Links
          </Title>
        </Col>

        {socialMediaFields.map((field) => {
          const IconComponent = field.icon;
          return (
            <Col key={field.name} {...field.span}>
              <Form.Item label={field.label} name={field.name}>
                <Input
                  prefix={<IconComponent size={18} />}
                  placeholder={field.placeholder}
                />
              </Form.Item>
            </Col>
          );
        })}

        {/* Site Credit */}
        <Col span={24}>
          <Form.Item label="Site Credit">
            <JoditEditor
              value={siteCredit}
              onChange={(newContent) => setSiteCredit(newContent)}
              tabIndex={2}
            />
          </Form.Item>
        </Col>

        {/* Submit Button */}
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={isSaving}
              size="large"
            >
              Save Settings
            </Button>
          </div>
        </Col>
      </Row>
    </Form>
  );
};

export default FooterSettingComp;
