import React from 'react';
import MessagesPanel from '../../components/messaging/MessagesPanel';
import { useLanguage } from '../../context/LanguageContext';

import { geoLabel } from '../../utils/i18nKeys';
export default function BuyerMessages() {
  const { t } = useLanguage();
  return (
    <MessagesPanel
      emptyContactsLabel={t('buyer_no_contacts')}
      getContactSubtitle={(c) => (c.role === 'admin' ? t('messages_admin_label') : (geoLabel(t, c.region) || t('role_farmer')))}
    />
  );
}
