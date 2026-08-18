import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { userService } from '../../services/userService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ROLE_COLORS = {
  admin: { bg: '#ede7f6', text: '#5e35b1' },
  farmer: { bg: '#e8f5e9', text: '#2e7d32' },
  buyer: { bg: '#e3f2fd', text: '#1565c0' },
  extension: { bg: '#fff3e0', text: '#e65100' },
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await userService.getAllUsers();
        if (isMounted) setUsers(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load users.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const filteredUsers = roleFilter === 'All' ? users : users.filter((u) => u.role === roleFilter);

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading users..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>👥 Users Management</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>Manage all registered users on the platform.</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['All', 'admin', 'farmer', 'buyer', 'extension'].map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: roleFilter === role ? '#2e7d32' : 'white',
              color: roleFilter === role ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              textTransform: 'capitalize',
            }}
          >
            {role}
          </button>
        ))}
      </div>

      {filteredUsers.length === 0 ? (
        <p style={{ color: '#666' }}>No users found.</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', fontSize: '0.85rem', color: '#555' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const colors = ROLE_COLORS[u.role] || ROLE_COLORS.buyer;
                return (
                  <tr key={u._id} style={{ borderTop: '1px solid #eee', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{u.fullName}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', backgroundColor: colors.bg, color: colors.text, fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{[u.region, u.zone].filter(Boolean).join(', ') || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#888' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
