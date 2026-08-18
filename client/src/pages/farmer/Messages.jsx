import React from 'react';
import MessagesPanel from '../../components/messaging/MessagesPanel';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerMessages() {
  const { t } = useLanguage();
  return (
    <MessagesPanel
      emptyContactsLabel={t('messages_empty_contacts')}
      getContactSubtitle={(c) => `${c.role === 'buyer' ? t('messages_buyer_label') : t('messages_admin_label')}${c.region ? ` · ${c.region}` : ''}`}
      highlightRole="extension"
      highlightSectionTitle={t('messages_my_extension_worker')}
      highlightRoleLabel={t('messages_extension_worker_label')}
      highlightEmptyTitle={t('messages_no_extension_assigned')}
      highlightEmptySubtitle={t('messages_contact_admin')}
    />
  );
}
