"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Search, MessageCircle, MoreVertical, Users } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import ConversationList from "@/components/messages/ConversationList";
import ChatArea from "@/components/messages/ChatArea";
import MessageInput from "@/components/messages/MessageInput";
import TypingIndicator from "@/components/messages/TypingIndicator";
import GroupCreateModal from "@/components/messages/GroupCreateModal";
import { useMessages, useConversations, useTypingIndicator } from "@/lib/hooks/useMessages";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get("userId"));
  const [searchQuery, setSearchQuery] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);

  // Custom hooks
  const { conversations, loading: convsLoading, totalUnread, refreshConversations } = useConversations();
  const { messages, loading: msgsLoading, sendMessage } = useMessages(selectedUserId);
  const { otherUserTyping, sendTypingStatus } = useTypingIndicator(selectedUserId);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Fetch users for new conversations
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.filter((u: User) => u.id !== session?.user?.id));
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
    fetchUsers();
  }, [session]);

  // Sync with URL params
  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");
    if (userIdFromUrl) {
      setSelectedUserId(userIdFromUrl);
    }
  }, [searchParams]);

  // Get selected user info
  const selectedUser = selectedUserId
    ? users.find(u => u.id === selectedUserId) ||
    conversations.find(c => c.otherUser?.id === selectedUserId)?.otherUser
    : null;

  // Merge users with conversations for the list
  const conversationData = users.map(user => {
    const existingConv = conversations.find(c => c.otherUser?.id === user.id);
    return existingConv || {
      id: `new-${user.id}`,
      otherUser: user,
      lastMessage: null,
      unreadCount: 0
    };
  }).sort((a, b) => {
    if (a.lastMessage && !b.lastMessage) return -1;
    if (!a.lastMessage && b.lastMessage) return 1;
    if (a.lastMessage && b.lastMessage) {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    }
    return 0;
  });

  return (
    <>
      <PageContainer title="Messages" icon="💬">
        <Breadcrumb />

        <div className="messages-layout">

          {/* Contacts Sidebar */}
          <div className="messages-sidebar">
            {/* Header */}
            <div style={{
              padding: "var(--space-3) var(--space-4)",
              borderBottom: "1px solid var(--notion-divider)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "var(--notion-text)",
                }}>
                  Conversations
                </span>
                {totalUnread > 0 && (
                  <span style={{
                    backgroundColor: "var(--notion-blue)",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                  }}>
                    {totalUnread}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowGroupModal(true)}
                className="hover-bg"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "var(--space-1)",
                  color: "var(--notion-text-secondary)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Create Group"
              >
                <Users size={18} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: "var(--space-3)", borderBottom: "1px solid var(--notion-divider)" }}>
              <Input
                placeholder="Search..."
                icon={<Search size={14} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Conversations List */}
            {usersLoading || convsLoading ? (
              <div style={{ padding: "var(--space-4)" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton" style={{ height: "60px", marginBottom: "var(--space-2)", borderRadius: "var(--radius-md)" }} />
                ))}
              </div>
            ) : (
              <ConversationList
                conversations={conversationData}
                selectedUserId={selectedUserId}
                onSelect={setSelectedUserId}
                searchQuery={searchQuery}
              />
            )}
          </div>

          {/* Chat Area */}
          <div className="messages-chat">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding: "var(--space-3) var(--space-5)",
                  borderBottom: "1px solid var(--notion-divider)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "var(--notion-bg-secondary)",
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Avatar src={selectedUser.avatar || undefined} name={`${selectedUser.firstName} ${selectedUser.lastName}`} size="md" />
                    <div>
                      <div style={{ fontWeight: "600", color: "var(--notion-text)", fontSize: "15px" }}>
                        {selectedUser.firstName} {selectedUser.lastName}
                      </div>
                      {otherUserTyping.isTyping && (
                        <div style={{ fontSize: "12px", color: "var(--notion-green)" }}>
                          typing...
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="hover-bg"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--notion-text-secondary)',
                      cursor: 'pointer',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                {/* Messages */}
                <ChatArea messages={messages} loading={msgsLoading} />

                {/* Input */}
                <MessageInput
                  onSend={sendMessage}
                  onTyping={sendTypingStatus}
                  placeholder={`Message ${selectedUser.firstName}...`}
                />
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <EmptyState
                  icon={<MessageCircle size={56} strokeWidth={1} />}
                  title="Select a Conversation"
                  description="Choose someone from your contacts to start messaging."
                />
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      {/* Group Create Modal */}
      <GroupCreateModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={() => {
          refreshConversations();
        }}
      />
    </>
  );
}
