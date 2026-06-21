import Link from "next/link";

const TOKEN = /([#@][A-Za-z0-9_]+)/g;

export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(TOKEN);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("#") && part.length > 1) {
          const tag = part.slice(1);
          return (
            <Link
              key={i}
              href={`/tag/${encodeURIComponent(tag)}`}
              className="font-medium text-amber-400 hover:underline"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith("@") && part.length > 1) {
          const username = part.slice(1);
          return (
            <Link
              key={i}
              href={`/profile/${encodeURIComponent(username)}`}
              className="font-medium text-amber-400 hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
