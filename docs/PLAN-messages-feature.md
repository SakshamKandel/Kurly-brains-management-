# Messages Feature - Complete Implementation Plan

## Overview

Comprehensive messaging system for Kurly Brains Dashboard with direct messages, group chats, real-time updates, file attachments, and notifications.

**Project Type:** WEB (Next.js)  
**Primary Agent:** `frontend-specialist` + `backend-specialist`

---

## Success Criteria

- [x] Users can send/receive direct messages that persist in database
- [x] Messages appear in real-time without page refresh (polling)
- [ ] Users can create and manage group conversations
- [ ] File/image attachments supported
- [ ] Typing indicators work
- [x] Read receipts show when messages are seen
- [x] Unread message count badge in sidebar
- [ ] Conversation search works

---

## Current State (Already Done)

- [x] Basic Messages UI with contacts sidebar and chat area
- [x] Messages API with conversation auto-creation
- [x] Basic send/receive functionality
- [x] Prisma schema with Conversation, Message, ConversationMember models

---

## Task Breakdown

### Phase 1: Database Persistence Fix (P0 - Critical)
*Agent: backend-specialist*

#### Task 1.1: Verify Message Saving
- **INPUT:** Current messages API
- **OUTPUT:** Messages persist after page reload
- **VERIFY:** Send message → Refresh → Message still visible

#### Task 1.2: Add Read Status to Messages
- **INPUT:** Message model has `isRead: Boolean`
- **OUTPUT:** API endpoint to mark messages as read
- **VERIFY:** Opening conversation marks messages as read

---

### Phase 2: Real-Time Updates (P1)
*Agent: frontend-specialist*

#### Task 2.1: Implement Polling for New Messages
- **INPUT:** Current manual fetch on load
- **OUTPUT:** Messages auto-refresh every 3 seconds while chat is open
- **VERIFY:** Send message from another user → Appears without refresh

#### Task 2.2: Typing Indicators
- **INPUT:** None
- **OUTPUT:** API to broadcast typing status + UI indicator
- **VERIFY:** User types → Other user sees "typing..." indicator

---

### Phase 3: Conversation Management (P1)
*Agent: frontend-specialist + backend-specialist*

#### Task 3.1: Conversation List with Last Message Preview
- **INPUT:** Current contacts list
- **OUTPUT:** Show last message preview + timestamp for each conversation
- **VERIFY:** Conversations sorted by most recent message

#### Task 3.2: Unread Message Count
- **INPUT:** Read status from Task 1.2
- **OUTPUT:** Badge showing unread count per conversation + total in sidebar
- **VERIFY:** New message → Badge increments → Open conversation → Badge clears

#### Task 3.3: Conversation Search
- **INPUT:** User input in search box
- **OUTPUT:** Filter conversations by name or message content
- **VERIFY:** Type name → Matching conversations shown

---

### Phase 4: Group Chats (P2)
*Agent: backend-specialist*

#### Task 4.1: Create Group Conversation API
- **INPUT:** Group name + member IDs
- **OUTPUT:** New conversation with `isGroup: true`
- **VERIFY:** POST to API creates group with multiple members

#### Task 4.2: Group Chat UI
- **INPUT:** Group conversations
- **OUTPUT:** UI to create group, show member avatars
- **VERIFY:** User can create group and send messages

#### Task 4.3: Add/Remove Group Members
- **INPUT:** Existing group
- **OUTPUT:** API + UI to manage members
- **VERIFY:** Admin can add/remove members

---

### Phase 5: File Attachments (P2)
*Agent: backend-specialist + frontend-specialist*

#### Task 5.1: File Upload API
- **INPUT:** File from client
- **OUTPUT:** File stored, URL returned
- **VERIFY:** Upload image → URL accessible

#### Task 5.2: Attach Files to Messages
- **INPUT:** Message content + file URLs
- **OUTPUT:** Message with attachments displayed
- **VERIFY:** Send image → Displays inline in chat

#### Task 5.3: File Preview in Chat
- **INPUT:** Attached files
- **OUTPUT:** Images show preview, others show download link
- **VERIFY:** Images render, PDFs show icon + download

---

### Phase 6: Read Receipts & Status (P2)
*Agent: frontend-specialist*

#### Task 6.1: Read Receipt UI
- **INPUT:** `isRead` status from database
- **OUTPUT:** Checkmarks on messages (✓ sent, ✓✓ read)
- **VERIFY:** Message sent → Single check → Opened by recipient → Double check

#### Task 6.2: Online Status (Optional)
- **INPUT:** User activity
- **OUTPUT:** Green dot for online users
- **VERIFY:** User active → Green dot appears

---

### Phase 7: Notifications (P3)
*Agent: frontend-specialist*

#### Task 7.1: Sidebar Unread Badge
- **INPUT:** Total unread messages count
- **OUTPUT:** Badge on Messages nav item
- **VERIFY:** New message → Badge shows count

#### Task 7.2: Browser Notifications (Optional)
- **INPUT:** New message received
- **OUTPUT:** Browser notification if tab not focused
- **VERIFY:** User away → Notification appears

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── messages/
│   │       ├── route.ts          # GET/POST messages
│   │       ├── read/route.ts     # Mark as read
│   │       ├── typing/route.ts   # Typing indicator
│   │       └── upload/route.ts   # File upload
│   └── dashboard/
│       └── messages/
│           └── page.tsx          # Main messages UI
├── components/
│   └── messages/
│       ├── ConversationList.tsx  # Sidebar with conversations
│       ├── ChatArea.tsx          # Message thread
│       ├── MessageBubble.tsx     # Individual message
│       ├── MessageInput.tsx      # Input with attachments
│       ├── TypingIndicator.tsx   # "User is typing..."
│       ├── GroupCreateModal.tsx  # Create group dialog
│       └── AttachmentPreview.tsx # File/image preview
└── lib/
    └── hooks/
        └── useMessages.ts        # Message fetching hook
```

---

## Phase X: Verification Checklist

### Automated Checks
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] TypeScript no errors

### Manual Verification
- [ ] Send message → Persists after refresh
- [ ] Unread badge shows correct count
- [ ] Typing indicator appears
- [ ] Read receipts update correctly
- [ ] File upload works
- [ ] Group chat creation works
- [ ] Search finds conversations

### Security Checks
- [ ] Only conversation participants can view messages
- [ ] File uploads validated for type/size
- [ ] No XSS in message content

---

## Implementation Order

| Order | Task | Priority | Est. Time |
|-------|------|----------|-----------|
| 1 | Fix database persistence | P0 | 30 min |
| 2 | Add read status API | P1 | 20 min |
| 3 | Implement polling | P1 | 30 min |
| 4 | Unread badges | P1 | 30 min |
| 5 | Conversation previews | P1 | 30 min |
| 6 | Read receipt UI | P2 | 20 min |
| 7 | Typing indicators | P2 | 45 min |
| 8 | Group chat API | P2 | 45 min |
| 9 | Group chat UI | P2 | 45 min |
| 10 | File upload | P2 | 60 min |
| 11 | Attachments in chat | P2 | 45 min |
| 12 | Sidebar notification badge | P3 | 20 min |

**Total Estimated Time:** ~7 hours

---

## Next Steps

After plan approval:
1. Start with P0 (database fix) and P1 (real-time + unread counts)
2. Proceed to P2 (group chats, attachments, read receipts)
3. Finish with P3 (notifications)

