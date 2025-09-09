import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface NotificationItem {
  id: string;
  type: 'reminder' | 'rejection' | 'approved';
  title: string;
  message: string;
  userName: string;
  timestamp: string;
  status: 'unread' | 'read';
}

interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'approved',
    title: 'Timesheet Approved',
    message: 'Your timesheet for the week ending 2024-01-12 has been approved',
    userName: 'Sarah Johnson',
    timestamp: '2024-01-13 09:30',
    status: 'unread'
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Timesheet Reminder',
    message: 'Please submit your timesheet for the week ending 2024-01-12',
    userName: 'Sarah Johnson',
    timestamp: '2024-01-12 14:30',
    status: 'unread'
  },
  {
    id: '3',
    type: 'rejection',
    title: 'Timesheet Rejected',
    message: 'Your timesheet for the week ending 2024-01-05 has been rejected. Please check the time entries for ABC Corp Ltd.',
    userName: 'Michael Chen',
    timestamp: '2024-01-11 09:15',
    status: 'unread'
  },
  {
    id: '4',
    type: 'approved',
    title: 'Timesheet Approved',
    message: 'Your timesheet for the week ending 2024-01-08 has been approved. Great work!',
    userName: 'Emily Davis',
    timestamp: '2024-01-10 16:00',
    status: 'unread'
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Timesheet Reminder',
    message: 'Reminder: Your timesheet for the current week is due by end of day',
    userName: 'Emily Davis',
    timestamp: '2024-01-10 16:00',
    status: 'read'
  },
  {
    id: '6',
    type: 'approved',
    title: 'Timesheet Approved',
    message: 'Your timesheet for the week ending 2024-01-06 has been approved and processed',
    userName: 'David Wilson',
    timestamp: '2024-01-09 14:20',
    status: 'read'
  },
  {
    id: '7',
    type: 'rejection',
    title: 'Timesheet Rejected',
    message: 'Your timesheet has been rejected due to insufficient detail in project descriptions',
    userName: 'David Wilson',
    timestamp: '2024-01-09 11:20',
    status: 'read'
  },
  {
    id: '8',
    type: 'reminder',
    title: 'Timesheet Reminder',
    message: 'Your timesheet for the week ending 2024-01-05 is overdue. Please submit immediately',
    userName: 'Lisa Martinez',
    timestamp: '2024-01-08 10:45',
    status: 'read'
  },
  {
    id: '9',
    type: 'approved',
    title: 'Timesheet Approved',
    message: 'Your timesheet for the week ending 2024-01-01 has been approved. Total hours: 40',
    userName: 'Rachel Green',
    timestamp: '2024-01-07 17:00',
    status: 'read'
  },
  {
    id: '10',
    type: 'rejection',
    title: 'Timesheet Rejected',
    message: 'Your timesheet for the week ending 2024-12-29 was rejected. Missing client approval for overtime hours',
    userName: 'Tom Anderson',
    timestamp: '2024-01-06 16:45',
    status: 'read'
  },
  {
    id: '11',
    type: 'reminder',
    title: 'Timesheet Reminder',
    message: 'Weekly timesheet submission deadline is approaching. Due in 2 hours',
    userName: 'Sophie White',
    timestamp: '2024-01-05 09:30',
    status: 'read'
  },
  {
    id: '12',
    type: 'approved',
    title: 'Timesheet Approved',
    message: 'Your timesheet for the week ending 2024-12-22 has been approved. Holiday hours recorded correctly',
    userName: 'Operations Manager',
    timestamp: '2024-01-04 14:15',
    status: 'read'
  }
];

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, status: 'read' as const }
          : notification
      )
    );
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};