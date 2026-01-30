/**
 * Enhanced Conversation Page with MCP Features
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ConversationInsights, AIReplySuggestions, IntelligentFollowup } from '@/components/mcp';
import { MessageList } from '@/components/messages/MessageList';
import { MessageInput } from '@/components/messages/MessageInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, BarChart3, Bell } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

export default function EnhancedConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [enhancedFeatures, setEnhancedFeatures] = useState<string[]>([]);

  useEffect(() => {
    fetchMessages();
    checkEnhancedFeatures();
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/${conversationId}?includeInsights=true`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages || []);
        if (data.data.features) {
          setEnhancedFeatures(data.data.features);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnhancedFeatures = async () => {
    try {
      const response = await fetch('/api/system/capabilities');
      const data = await response.json();
      
      if (data.success && data.data.features) {
        setEnhancedFeatures(data.data.features);
      }
    } catch (error) {
      console.error('Failed to check capabilities:', error);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    // This would populate the message input with the suggestion
    console.log('Selected suggestion:', suggestion);
  };

  const handleSendMessage = async (content: string, options: any = {}) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          enableSuggestions: options.enableSuggestions || false,
          channelType: options.channelType || 'internal'
        })
      });
      
      if (response.ok) {
        await fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const hasEnhancedFeatures = enhancedFeatures.length > 0;

  return (
    <div className="flex h-screen">
      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse">Loading conversation...</div>
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
        </div>
        
        <div className="border-t p-4">
          <MessageInput 
            onSend={handleSendMessage}
            placeholder="Type a message..."
            enableEnhancements={hasEnhancedFeatures}
          />
        </div>
      </div>

      {/* Enhanced Features Sidebar */}
      {hasEnhancedFeatures && (
        <div className="w-96 border-l bg-gray-50 overflow-y-auto">
          <Tabs defaultValue="insights" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="insights">
                <Brain className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                <MessageSquare className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="followup">
                <Bell className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="p-4">
              <ConversationInsights conversationId={conversationId} />
            </TabsContent>

            <TabsContent value="suggestions" className="p-4">
              <AIReplySuggestions 
                conversationId={conversationId}
                onSuggestionSelect={handleSuggestionSelect}
              />
            </TabsContent>

            <TabsContent value="analytics" className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Analytics content would go here */}
                    <div className="text-sm text-gray-600">
                      Advanced analytics coming soon...
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="followup" className="p-4">
              <IntelligentFollowup conversationId={conversationId} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}