import { useState } from 'react';
import { Card, Button, Badge, Input, Table, Tr, Td, Avatar, SectionHeader, Modal, Select } from '../components/ui';
import { MOCK_USERS, PERMISSIONS } from '../data';
import type { Role } from '../data';

export default function Users() {
  const [tab, setTab] = useState<'users' | 'roles'>('users');
  const [search, setSearch] = useState('');
  const [newUserModal, setNewUserModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('admin');

  const filtered = MOCK_USERS.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleStyles: Record<Role, string> = {
    admin: 'bg-purple-50 text-purple-700 border border-purple-200',
    agent: 'bg-sky-50 text-sky-700 border border-sky-200',
    marketing: 'bg-pink-50 text-pink-700 border border-pink-200',
    sales: 'bg-amber-50 text-amber-700 border border-amber-200',
    customer: 'bg-slate-50 text-slate-600 border border-slate-200',
  };

  const roles: Role[] = ['admin', 'agent', 'marketing', 'sales', 'customer'];
  const roleLabels: Record<Role, string> = {
    admin: 'Admin', agent: 'Service Agent', marketing: 'Marketing Manager', sales: 'Sales Manager', customer: 'Customer',
  };

  return (
    <div className="p-6 space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-slate-900">{MOCK_USERS.length}</p><p className="text-xs text-slate-500">Total Users</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{MOCK_USERS.filter(u => u.status === 'active').length}</p><p className="text-xs text-slate-500">Active</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-slate-400">{MOCK_USERS.filter(u => u.status === 'inactive').length}</p><p className="text-xs text-slate-500">Inactive</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{MOCK_USERS.filter(u => u.status === 'pending').length}</p><p className="text-xs text-slate-500">Pending</p></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[['users', 'Users'], ['roles', 'Role & Permission Matrix']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as typeof tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${tab === k ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <Card>
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <Input placeholder="Search users…" value={search} onChange={setSearch} className="w-72"
              icon={<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>}
            />
            <Select value="all" onChange={() => {}} className="w-40" options={[
              { value: 'all', label: 'All roles' },
              ...roles.map(r => ({ value: r, label: roleLabels[r] })),
            ]} />
            <Select value="all" onChange={() => {}} className="w-40" options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' },
            ]} />
            <Button variant="primary" size="sm" className="ml-auto" onClick={() => setNewUserModal(true)}>+ Create User</Button>
          </div>

          <Table headers={['User', 'Role', 'Department', 'Status', 'Last Login', 'Created', 'Actions']}>
            {filtered.map(user => (
              <Tr key={user.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar initials={user.avatar} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleStyles[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </Td>
                <Td><span className="text-sm text-slate-600">{user.department}</span></Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : user.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    <span className="text-sm text-slate-600 capitalize">{user.status}</span>
                  </div>
                </Td>
                <Td><span className="text-xs text-slate-500 font-mono">{user.lastLogin}</span></Td>
                <Td><span className="text-xs text-slate-500">{user.createdAt}</span></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">{user.status === 'active' ? 'Deactivate' : 'Activate'}</Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'roles' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <SectionHeader title="Role Permission Matrix" subtitle="What each role can access and perform" />
            <div className="flex gap-2 mt-2">
              {roles.map(r => (
                <button key={r} onClick={() => setSelectedRole(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedRole === r ? 'bg-[#1e3a5f] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {roleLabels[r]}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-64">Permission</th>
                  {roles.map(r => (
                    <th key={r} className={`text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider ${selectedRole === r ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>
                      {roleLabels[r].split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(PERMISSIONS).map(([perm, roleMap]) => (
                  <tr key={perm} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 font-medium text-sm">{perm}</td>
                    {roles.map(r => (
                      <td key={r} className={`px-4 py-3 text-center ${selectedRole === r ? 'bg-indigo-50' : ''}`}>
                        {roleMap[r] ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-300 text-xs">✕</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create User Modal */}
      <Modal open={newUserModal} onClose={() => setNewUserModal(false)} title="Create New User" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="First name" />
            <Input label="Last Name" placeholder="Last name" />
          </div>
          <Input label="Email Address" type="email" placeholder="user@university.edu" />
          <Select label="Role" value="agent" onChange={() => {}} options={roles.map(r => ({ value: r, label: roleLabels[r] }))} />
          <Input label="Department" placeholder="e.g. Student Services" />
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            A welcome email with login instructions will be sent to the user's email address.
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => setNewUserModal(false)}>Create User</Button>
            <Button variant="secondary" onClick={() => setNewUserModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
