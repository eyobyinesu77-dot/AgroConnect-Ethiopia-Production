import React from 'react';
import MessagesPanel from '../../components/messaging/MessagesPanel';

export default function BuyerMessages() {
  return (
    <MessagesPanel
      emptyContactsLabel="No contacts available yet."
      getContactSubtitle={(c) => (c.role === 'admin' ? 'Admin' : (c.region || 'Farmer'))}
    />
  );
}
