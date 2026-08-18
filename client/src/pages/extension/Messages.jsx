import React from 'react';
import MessagesPanel from '../../components/messaging/MessagesPanel';

export default function ExtensionMessages() {
  return (
    <MessagesPanel
      title="💬 My Assigned Farmers"
      emptyContactsLabel="No farmers have been assigned to you yet. Please contact an administrator."
      getContactSubtitle={(c) => (c.role === 'admin' ? 'Admin' : (c.phone || 'Farmer'))}
    />
  );
}
