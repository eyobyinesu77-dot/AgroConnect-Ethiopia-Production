import React from 'react';
import MessagesPanel from '../../components/messaging/MessagesPanel';
import { useLanguage } from '../../context/LanguageContext';

export default function ExtensionMessages() {
  const { t } = useLanguage();
  return (
    <MessagesPanel
      title={t('ext_messages_title')}
      emptyContactsLabel={t('ext_messages_empty')}
      getContactSubtitle={(c) => (c.role === 'admin' ? t('role_admin') : (c.phone || t('role_farmer')))}
    />
  );
}
