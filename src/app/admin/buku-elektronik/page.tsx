'use client';

import React from 'react';
import EBookManagementView from '@/components/dashboard/EBookManagementView';

export default function AdminBukuElektronikPage() {
  const adminUser = {
    id: 'admin',
    name: 'Administrator',
    username: 'admin',
    role: 'administrator',
  };

  return (
    <div className="space-y-6">
      <EBookManagementView user={adminUser} isAdmin={true} />
    </div>
  );
}
