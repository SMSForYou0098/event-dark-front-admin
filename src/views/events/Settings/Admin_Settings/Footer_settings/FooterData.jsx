import React from 'react';
import { Card, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FooterSettingComp from './FooterSettingComp';
import apiClient from 'auth/FetchInterceptor';

const FooterData = () => {
  const queryClient = useQueryClient();

  // Fetch footer settings
  const { data: footerSettings, isLoading: loadingFooter } = useQuery({
    queryKey: ['footerSettings'],
    queryFn: async () => {
      const response = await apiClient.get('settings');
      return response?.data || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch social media data
  const { data: socialMediaData, isLoading: loadingSocial } = useQuery({
    queryKey: ['socialMedia'],
    queryFn: async () => {
      const response = await apiClient.get('socialMedia');
      return response?.SocialMediaData || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  // Combined mutation for both footer and social media
  const saveMutation = useMutation({
    mutationFn: async (values) => {
      // Prepare footer settings FormData
      const footerFormData = new FormData();
      if (values.footerLogo) {
        footerFormData.append('footer_logo', values.footerLogo);
      }
      if (values.footerBG) {
        footerFormData.append('footer_bg', values.footerBG);
      }
      footerFormData.append('footer_address', values.footerAddress || '');
      footerFormData.append('footer_contact', values.footerContact || '');
      footerFormData.append('site_credit', values.siteCredit || '');
      footerFormData.append('footer_whatsapp_number', values.footerWaNumber || '');
      footerFormData.append('footer_email', values.footerEmail || '');

      // Prepare social media FormData
      const socialFormData = new FormData();
      socialFormData.append('facebook', values.facebook || '');
      socialFormData.append('instagram', values.instagram || '');
      socialFormData.append('youtube', values.youtube || '');
      socialFormData.append('twitter', values.twitter || '');
      socialFormData.append('linkedin', values.linkedin || '');

      // Execute both API calls sequentially
      const footerResponse = await apiClient.post('setting', footerFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const socialResponse = await apiClient.post('socialMedia-store', socialFormData);

      return { footerResponse, socialResponse };
    },
    onSuccess: () => {
      message.success('Footer and social media settings updated successfully!');
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['footerSettings'] });
      queryClient.invalidateQueries({ queryKey: ['socialMedia'] });
    },
    onError: (error) => {
      console.error('Error saving footer data:', error);
      message.error(
        error.response?.data?.message || 'Failed to save settings'
      );
    },
  });

  const handleSave = (values) => {
    saveMutation.mutate(values);
  };

  const isLoading = loadingFooter || loadingSocial;

  return (
    <Card loading={isLoading}>
      <FooterSettingComp
        footerSettings={footerSettings}
        socialMediaData={socialMediaData}
        onSave={handleSave}
        isSaving={saveMutation.isPending}
      />
    </Card>
  );
};

export default FooterData;