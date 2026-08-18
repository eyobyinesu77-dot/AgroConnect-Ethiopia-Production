import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { messageService } from '../../services/messageService';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Shared messaging UI reused by every role's Messages page (farmer,
 * extension, buyer, admin). Who a given user is allowed to contact is
 * decided entirely by the backend (see server/controllers/messageController.js) —
 * this component just renders whatever contact list and thread the API
 * returns, so it doesn't need to know about roles itself.
 *
 * highlightRole (optional) pulls one contact of that role out of the flat
 * list and renders it as its own call-out card above the rest — used by
 * the Farmer's Messages page to show "My Extension Worker" as a single,
 * specific contact (per the current assignedExtensionWorker relationship)
 * rather than mixed into the same list as Admin/Buyer contacts.
 */
export default function MessagesPanel({
  emptyContactsLabel = 'No contacts available yet.',
  getContactSubtitle,
  title = '💬 Messages',
  highlightRole,
  highlightSectionTitle,
  highlightRoleLabel,
  highlightEmptyTitle,
  highlightEmptySubtitle,
}) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [contactsData, unreadData] = await Promise.all([
          messageService.getContacts(),
          messageService.getUnreadCounts(),
        ]);
        setContacts(contactsData);
        setUnreadCounts(unreadData);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load contacts.');
      } finally {
        setIsLoadingContacts(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedContact) return;
    setIsLoadingMessages(true);
    messageService.getConversation(selectedContact._id)
      .then((data) => {
        setMessages(data);
        // Opening a thread marks those messages read server-side (see
        // getConversation) — clear the badge immediately to match, rather
        // than waiting for a full contacts/unread-counts refetch.
        setUnreadCounts((prev) => {
          const next = { ...prev };
          delete next[selectedContact._id];
          return next;
        });
      })
      .catch((error) => toast.error(error.response?.data?.message || 'Failed to load messages.'))
      .finally(() => setIsLoadingMessages(false));
  }, [selectedContact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedContact) return;

    setIsSending(true);
    try {
      const message = await messageService.sendMessage(selectedContact._id, text.trim());
      setMessages((prev) => [...prev, message]);
      setText('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const subtitleFor = (contact) => (getContactSubtitle ? getContactSubtitle(contact) : (contact.region || ''));

  const highlightContact = highlightRole ? contacts.find((c) => c.role === highlightRole) : null;
  const listContacts = highlightRole ? contacts.filter((c) => c.role !== highlightRole) : contacts;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '1rem' }}>{title}</h2>

      {highlightRole && !isLoadingContacts && (
        highlightContact ? (
          <div style={{ backgroundColor: '#f1f8f2', border: '1px solid #c8e6c9', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#2e7d32', fontWeight: 'bold' }}>{highlightSectionTitle}</p>
              <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', fontSize: '1rem' }}>{highlightContact.fullName}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#999' }}>{highlightRoleLabel}</p>
            </div>
            <button
              onClick={() => setSelectedContact(highlightContact)}
              style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Message {highlightRoleLabel}
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#f57f17' }}>{highlightEmptyTitle}</p>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#8d6e00' }}>{highlightEmptySubtitle}</p>
          </div>
        )
      )}

      <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden', height: '500px' }}>
        {/* Contacts */}
        <div style={{ width: '220px', borderRight: '1px solid #eee', overflowY: 'auto' }}>
          {isLoadingContacts ? (
            <LoadingSpinner fullScreen={false} label="Loading..." />
          ) : listContacts.length === 0 ? (
            <p style={{ padding: '1rem', color: '#666', fontSize: '0.85rem' }}>{emptyContactsLabel}</p>
          ) : (
            listContacts.map((c) => (
              <div
                key={c._id}
                onClick={() => setSelectedContact(c)}
                style={{
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  backgroundColor: selectedContact?._id === c._id ? '#f1f8f2' : 'white',
                  borderBottom: '1px solid #f5f5f5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{c.fullName}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#999' }}>{subtitleFor(c)}</p>
                </div>
                {unreadCounts[c._id] > 0 && (
                  <span style={{
                    backgroundColor: '#e53935',
                    color: 'white',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    flexShrink: 0,
                  }}>
                    {unreadCounts[c._id]}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Conversation */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!selectedContact ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              Select a contact to start messaging
            </div>
          ) : (
            <>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                {selectedContact.fullName}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isLoadingMessages ? (
                  <LoadingSpinner fullScreen={false} label="Loading..." />
                ) : (
                  messages.map((m) => (
                    <div
                      key={m._id}
                      style={{
                        alignSelf: m.sender === selectedContact._id ? 'flex-start' : 'flex-end',
                        backgroundColor: m.sender === selectedContact._id ? '#f0f0f0' : '#2e7d32',
                        color: m.sender === selectedContact._id ? '#333' : 'white',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '12px',
                        maxWidth: '70%',
                        fontSize: '0.9rem',
                      }}
                    >
                      {m.content}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid #eee' }}>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '20px', border: '1px solid #ccc' }}
                />
                <button
                  type="submit"
                  disabled={isSending}
                  style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
