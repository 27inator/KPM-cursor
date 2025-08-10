import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";

interface WebSocketNotification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

export default function ToastNotifications() {
  const { toast } = useToast();
  
  // WebSocket connection for real-time notifications
  const { lastMessage, connectionStatus } = useWebSocket('/ws/notifications');

  useEffect(() => {
    if (lastMessage) {
      try {
        const notification: WebSocketNotification = JSON.parse(lastMessage);
        
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default',
          duration: notification.duration || 5000,
        });
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    }
  }, [lastMessage, toast]);

  // Show connection status notifications
  useEffect(() => {
    if (connectionStatus === 'connected') {
      toast({
        title: "Connected",
        description: "Real-time notifications enabled",
        duration: 3000,
      });
    } else if (connectionStatus === 'disconnected') {
      toast({
        title: "Disconnected",
        description: "Real-time notifications disabled",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [connectionStatus, toast]);

  return null; // This component doesn't render anything
}