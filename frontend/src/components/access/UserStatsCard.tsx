'use client';

import React from 'react';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import { UserItem, RoleItem } from '@/lib/access/types';

interface UserStatsCardProps {
  users: UserItem[];
  roles: RoleItem[];
}

export default function UserStatsCard({ users, roles }: UserStatsCardProps) {
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const inactiveUsers = totalUsers - activeUsers;
  const totalRoles = roles.length;

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      desc: 'Registered accounts',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Active Users',
      value: activeUsers,
      desc: 'Can access system',
      icon: UserCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Inactive Users',
      value: inactiveUsers,
      desc: 'Deactivated accounts',
      icon: UserX,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      title: 'Configured Roles',
      value: totalRoles,
      desc: 'System & custom roles',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className={`p-4 sm:p-5 rounded-2xl bg-white border ${item.borderColor} shadow-xs flex items-center justify-between transition-all hover:shadow-sm`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500">{item.title}</p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{item.value}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
