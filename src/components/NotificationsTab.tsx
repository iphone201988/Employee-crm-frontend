import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, CheckCircle, Clock, Check } from "lucide-react";
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import { useToast } from "@/hooks/use-toast";
import { useNotifications, NotificationItem } from '@/contexts/NotificationsContext';

const NotificationsTab = () => {
  const { notifications, markAsRead: contextMarkAsRead } = useNotifications();
  const { toast } = useToast();

  const markAsRead = (id: string) => {
    contextMarkAsRead(id);
    toast({
      description: "Notification marked as read",
    });
  };

  const getNotificationIcon = (type: 'reminder' | 'rejection' | 'approved') => {
    switch (type) {
      case 'reminder':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'rejection':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationBadge = (type: 'reminder' | 'rejection' | 'approved') => {
    switch (type) {
      case 'reminder':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Reminder</Badge>;
      case 'rejection':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Rejection</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      default:
        return null;
    }
  };

  const getNotificationRowColor = (type: 'reminder' | 'rejection' | 'approved', status: 'unread' | 'read') => {
    if (status === 'unread') {
      switch (type) {
        case 'rejection':
          return 'bg-red-50 border-red-200';
        case 'approved':
          return 'bg-green-50 border-green-200';
        default:
          return 'bg-blue-50 border-blue-200';
      }
    }
    switch (type) {
      case 'rejection':
        return 'bg-red-25 border-red-100 hover:bg-red-50';
      case 'approved':
        return 'bg-green-25 border-green-100 hover:bg-green-50';
      default:
        return 'bg-blue-25 border-blue-100 hover:bg-blue-50';
    }
  };

  const unreadNotifications = notifications.filter(n => n.status === 'unread');
  const readNotifications = notifications.filter(n => n.status === 'read');

  const renderNotificationList = (notificationList: NotificationItem[]) => (
    <div className="space-y-4">
      {notificationList.map((notification) => (
        <div
          key={notification.id}
          className={`border rounded-lg p-4 space-y-3 transition-colors ${getNotificationRowColor(notification.type, notification.status)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">
                    {notification.title}
                  </h3>
                  {getNotificationBadge(notification.type)}
                  {notification.status === 'unread' && (
                    <Badge variant="outline" className="bg-blue-600 text-white border-blue-600">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={getProfileImage(notification.userName)} />
                    <AvatarFallback className="text-xs">
                      {getUserInitials(notification.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {notification.userName}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {notification.timestamp}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notification.status === 'unread' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                  className="h-7 px-2"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark as read
                </Button>
              )}
              {notification.status === 'read' && (
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
      ))}
      {notificationList.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No notifications in this category
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="unread" className="flex items-center gap-2">
                Unread
                {unreadNotifications.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read" className="flex items-center gap-2">
                Read
                {readNotifications.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {readNotifications.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="unread" className="mt-0">
              {renderNotificationList(unreadNotifications)}
            </TabsContent>
            
            <TabsContent value="read" className="mt-0">
              {renderNotificationList(readNotifications)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;