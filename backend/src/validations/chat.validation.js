import { z } from 'zod';
import {
  CHAT_ANY_MESSAGE_MAX,
  CHAT_HISTORY_KEPT,
  CHAT_MAX_MESSAGES,
  CHAT_ROLES,
  CHAT_USER_MESSAGE_MAX,
  CHAT_VALIDATION,
} from '~/constants/chat.js';

const chatMessageSchema = z.object({
  role: z.enum(CHAT_ROLES),
  content: z.string().trim().min(1, CHAT_VALIDATION.emptyContent).max(CHAT_ANY_MESSAGE_MAX),
});

function isLastMessageShort(messages) {
  const last = messages.at(-1);
  if (!last) return true; // mảng rỗng đã bị .min(1) báo lỗi
  return last.content.length <= CHAT_USER_MESSAGE_MAX;
}

function keepRecent(messages) {
  return messages.slice(-CHAT_HISTORY_KEPT);
}

const chatSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, CHAT_VALIDATION.messagesRequired)
    .max(CHAT_MAX_MESSAGES)
    .refine(isLastMessageShort, CHAT_VALIDATION.messageTooLong)
    .transform(keepRecent),
});

export { chatSchema };
