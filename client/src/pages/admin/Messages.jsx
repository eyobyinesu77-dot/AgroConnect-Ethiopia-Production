import React from 'react';
import MessagesPanel from '../../components/messaging/MessagesPanel';

export default function AdminMessages() {
  return (
    <MessagesPanel
      emptyContactsLabel="No users to message yet."
      getContactSubtitle={(c) => `${c.role.charAt(0).toUpperCase()}${c.role.slice(1)}${c.region ? ` · ${c.region}` : ''}`}
    />
  );
}
