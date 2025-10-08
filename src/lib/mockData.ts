import { Member, Team, DateAssignment, Shadow } from '@/types';

// Mock data store (in a real app, this would be a database)
export const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '+1-555-0101',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    phone: '+1-555-0102',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    name: 'Carol Williams',
    email: 'carol@example.com',
    phone: '+1-555-0103',
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david@example.com',
    phone: '+1-555-0104',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
];

export const mockTeams: Team[] = [
  {
    id: 't1',
    name: 'Platform Team',
    description: 'Infrastructure and platform services',
    color: '#0ea5e9',
    memberIds: ['1', '2'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 't2',
    name: 'Product Team',
    description: 'Product development and features',
    color: '#8b5cf6',
    memberIds: ['3', '4'],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
];

export const mockShadows: Shadow[] = [
  {
    id: 's1',
    userId: '1',
    shadowUserId: '2',
    startDate: new Date('2025-10-01'),
  },
];

export const mockAssignments: DateAssignment[] = [
  {
    id: 'a1',
    date: '2025-10-08',
    teamId: 't1',
    memberIds: ['1'],
    shadowIds: ['s1'],
    notes: 'Regular rotation',
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-01'),
  },
  {
    id: 'a2',
    date: '2025-10-08',
    teamId: 't2',
    memberIds: ['3'],
    shadowIds: [],
    notes: 'Product on-call',
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-01'),
  },
  {
    id: 'a3',
    date: '2025-10-09',
    teamId: 't1',
    memberIds: ['2'],
    shadowIds: [],
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-01'),
  },
];
