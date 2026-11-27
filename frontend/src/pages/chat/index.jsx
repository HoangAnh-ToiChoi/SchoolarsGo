import ChatHeader from '~/pages/chat/components/chatHeader';
import ChatInput from '~/pages/chat/components/chatInput';
import ChatSidebar from '~/pages/chat/components/chatSidebar';
import MessageList from '~/pages/chat/components/messageList';
import QuickReplyChips from '~/pages/chat/components/quickReplyChips';
import WelcomeScreen from '~/pages/chat/components/welcomeScreen';
import { useChatConversation } from '~/pages/chat/hooks';

export default function ChatPage() {
  const chat = useChatConversation();

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-ink-950 overflow-hidden">
      <ChatSidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader isLoading={chat.isLoading} />

        <div className="flex-1 overflow-y-auto">
          {chat.isEmptyChat ? (
            <WelcomeScreen onQuickReply={chat.sendMessage} />
          ) : (
            <MessageList
              messages={chat.messages}
              hasHistory={chat.hasHistory}
              isLoading={chat.isLoading}
              bottomRef={chat.bottomRef}
            />
          )}
        </div>

        {chat.showQuickChips && <QuickReplyChips onSelect={chat.sendMessage} />}

        <ChatInput
          input={chat.input}
          setInput={chat.setInput}
          onSend={chat.sendMessage}
          isLoading={chat.isLoading}
          inputRef={chat.inputRef}
        />
      </div>
    </div>
  );
}
