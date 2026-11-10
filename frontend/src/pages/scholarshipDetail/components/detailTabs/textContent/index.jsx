// Đoạn văn giữ nguyên xuống dòng của dữ liệu gốc
export default function TextContent({ children }) {
  return <p className="whitespace-pre-line text-[14.5px] leading-[1.7] text-fg">{children}</p>;
}
