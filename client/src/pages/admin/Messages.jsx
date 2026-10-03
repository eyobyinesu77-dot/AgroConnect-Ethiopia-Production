import React from 'react';
import MessagesPanel from '../../components/messaging/MessagesPanel';
import { useLanguage } from '../../context/LanguageContext';

import { geoLabel } from '../../utils/i18nKeys';
export default function AdminMessages() {
  const { t } = useLanguage();
  return (
    <MessagesPanel
      emptyContactsLabel={t('admin_messages_empty')}
      getContactSubtitle={(c) => `${t(`role_${c.role}`)}${c.region ? ` · ${geoLabel(t, c.region)}` : ''}`}
    />
  );
}
