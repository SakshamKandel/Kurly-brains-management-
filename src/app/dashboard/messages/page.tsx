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

  const { conversations, loading: convsLoading, totalUnread, refreshConversations } = useConversations();
  const { messages, loading: msgsLoading, sendMessage } = useMessages(selectedUserId);
  const { otherUserTyping, sendTypingStatus } = useTypingIndicator(selectedUserId);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users", { cache: "no-store" });
        if (res.ok) { const data = await res.json(); setUsers(data.filter((u: User) => u.id !== session?.user?.id)); }
      } catch (error) { console.error("Failed to fetch users:", error); }
      finally { setUsersLoading(false); }
    };
    fetchUsers();
  }, [session]);

  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");
    if (userIdFromUrl) setSelectedUserId(userIdFromUrl);
  }, [searchParams]);

  const selectedUser = selectedUserId
    ? users.find(u => u.id === selectedUserId) || conversations.find(c => c.otherUser?.id === selectedUserId)?.otherUser
    : null;

  const conversationData = users.map(user => {
    const existingConv = conversations.find(c => c.otherUser?.id === user.id);
    return existingConv || { id: `new-${user.id}`, otherUser: user, lastMessage: null, unreadCount: 0 };
  }).sort((a, b) => {
    if (a.lastMessage && !b.lastMessage) return -1;
    if (!a.lastMessage && b.lastMessage) return 1;
    if (a.lastMessage && b.lastMessage) return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
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
              padding: "12px 16px",
              borderBottom: "1px solid var(--notion-divider)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand-blue)" }} />
                <span className="text-[12px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--notion-text-secondary)" }}>
                  Conversations
                </span>
                {totalUnread > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold" style={{
                    backgroundColor: "var(--brand-blue)", color: "white", borderRadius: "2px",
                  }}>
                    {totalUnread}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowGroupModal(true)}
                className="p-1.5 border-none bg-transparent cursor-pointer transition-colors hover:text-[var(--brand-blue)]"
                style={{ color: "var(--notion-text-secondary)", borderRadius: "2px", display: "flex", alignItems: "center" }}
                title="Create Group"
              >
                <Users size={16} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: "12px", borderBottom: "1px solid var(--notion-divider)" }}>
              <Input placeholder="Search..." icon={<Search size={14} />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* Conversations List */}
            {usersLoading || convsLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {[1, 2, 3].map(i => (<div key={i} className="skeleton h-14 rounded-sm" />))}
              </div>
            ) : (
              <ConversationList conversations={conversationData} selectedUserId={selectedUserId} onSelect={setSelectedUserId} searchQuery={searchQuery} />
            )}
          </div>

          {/* Chat Area */}
          <div className="messages-chat">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--notion-divider)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "var(--notion-bg-secondary)",
                }}>
                  <div className="flex items-center gap-3">
                    <Avatar src={selectedUser.avatar || undefined} name={`${selectedUser.firstName} ${selectedUser.lastName}`} size="md" />
                    <div>
                      <div className="text-[14px] font-semibold" style={{ color: "var(--notion-text)" }}>
                        {selectedUser.firstName} {selectedUser.lastName}
                      </div>
                      {otherUserTyping.isTyping && (
                        <div className="text-[11px]" style={{ color: "var(--notion-green)" }}>typing...</div>
                      )}
                    </div>
                  </div>
                  <button className="p-1.5 border-none bg-transparent cursor-pointer transition-colors hover:text-[var(--brand-blue)]" style={{ color: "var(--notion-text-secondary)", display: "flex", alignItems: "center" }}>
                    <MoreVertical size={16} />
                  </button>
                </div>

                <ChatArea messages={messages} loading={msgsLoading} />
                <MessageInput onSend={sendMessage} onTyping={sendTypingStatus} placeholder={`Message ${selectedUser.firstName}...`} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2" style={{ color: "var(--notion-text-muted)" }}>
                  <MessageCircle size={24} strokeWidth={1} />
                  <span className="text-[11px] tracking-widest uppercase">Select a conversation</span>
                  <span className="text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>Choose someone from your contacts to start messaging.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      <GroupCreateModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} onGroupCreated={() => { refreshConversations(); }} />
    </>
  );
}
