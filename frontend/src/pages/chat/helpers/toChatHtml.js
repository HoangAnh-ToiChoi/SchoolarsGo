// Định dạng tối giản của bot: **đậm**, dòng bắt đầu bằng "• ", xuống dòng.
// Kết quả là HTML thô, nơi hiển thị bắt buộc qua sanitizeHtml().
export function toChatHtml(text) {
  const bolded = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  const bulleted = bolded.replace(/^• /gm, '&bull;&nbsp;');
  return bulleted.replace(/\n/g, '<br/>');
}
