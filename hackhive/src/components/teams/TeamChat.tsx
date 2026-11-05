"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import {
  Send,
  LoaderCircle,
  MessageCircle,
  Smile,
  AtSign,
  ArrowDown,
  Search,
  X,
  Copy,
  Check,
} from "lucide-react";
import type { TeamMember } from "@/components/teams/TeamMemberList";

import { createClient } from "@/lib/supabase/client";
import type { TeamMessage } from "@/types/teamMessage";

interface TeamChatProps {
  teamId: string;
  members: TeamMember[];
  /** Optional: shown in the chat header */
  teamName?: string;
  /** Optional: set false while the chat is hidden (mobile tab) */
  active?: boolean;
}

const MAX_LENGTH = 2000;
const GROUP_GAP_MS = 5 * 60 * 1000;
const EMOJIS = ["🐝", "🍯", "🔥", "🚀", "💡", "👍", "🎉", "😂", "🙌", "👀"];

const HEX_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66v34' fill='none' stroke='%230e141b' stroke-opacity='0.07' stroke-width='1.5'/%3E%3Cpath d='M28 0v34L0 50v34l28 16 28-16V50L28 34' fill='none' stroke='%230e141b' stroke-opacity='0.07' stroke-width='1.5'/%3E%3C/svg%3E")`;

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Avatar({
  member,
  name,
  size = 28,
}: {
  member?: TeamMember;
  name: string;
  size?: number;
}) {
  const style = { width: size, height: size };

  if (member?.avatarUrl) {
    return (
      <Image
        src={member.avatarUrl}
        alt={name}
        width={size}
        height={size}
        style={style}
        className="shrink-0 rounded-full border-2 border-[#0e141b] object-cover"
      />
    );
  }

  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-[#0e141b] bg-[#ffda3d] text-xs font-black text-[#0e141b]"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function TeamChat({
  teamId,
  members,
  teamName,
  active = true,
}: TeamChatProps) {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [tray, setTray] = useState<"emoji" | "mention" | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const stickRef = useRef(true);
  const prevCountRef = useRef(0);

  const memberMap = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members]
  );

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickRef.current = nearBottom;
    if (nearBottom) setShowJump(false);
  };

  const addMessage = useCallback((message: TeamMessage) => {
    setMessages((previous) => {
      if (previous.some((item) => item.id === message.id)) {
        return previous;
      }

      return [...previous, message];
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let isActive = true;

    const fetchMessages = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isActive) return;

      if (userError || !user) {
        setError("Please log in to use team chat.");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const channel = supabase
        .channel(`team-chat-${teamId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "team_messages",
            filter: `team_id=eq.${teamId}`,
          },
          (payload) => {
            const row = payload.new;

            const newMessage: TeamMessage = {
              id: row.id,
              teamId: row.team_id,
              senderId: row.sender_id,
              content: row.content,
              createdAt: row.created_at,
            };

            if (isActive) {
              addMessage(newMessage);
            }
          }
        )
        .subscribe();

      const { data, error: fetchError } = await supabase
        .from("team_messages")
        .select("id, team_id, sender_id, content, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true });

      if (!isActive) {
        await supabase.removeChannel(channel);
        return;
      }

      if (fetchError) {
        console.error("Error fetching team messages:", fetchError);
        setError("Couldn't load messages. Please try again.");
      } else {
        const formattedMessages: TeamMessage[] = (data || []).map(
          (message) => ({
            id: message.id,
            teamId: message.team_id,
            senderId: message.sender_id,
            content: message.content,
            createdAt: message.created_at,
          })
        );

        setMessages((previous) => {
          const combined = [...previous, ...formattedMessages];
          const unique = new Map(
            combined.map((message) => [message.id, message])
          );

          return Array.from(unique.values()).sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
          );
        });
      }

      setLoading(false);
    };

    fetchMessages();

    return () => {
      isActive = false;
      supabase.removeAllChannels();
    };
  }, [teamId, addMessage]);

  // Smart auto-scroll: follow new messages only if you're at the bottom
  useEffect(() => {
    if (messages.length === 0) return;

    const last = messages[messages.length - 1];
    const firstLoad = prevCountRef.current === 0;
    prevCountRef.current = messages.length;

    if (firstLoad) {
      requestAnimationFrame(() => scrollToBottom(false));
    } else if (stickRef.current || last.senderId === currentUserId) {
      scrollToBottom(true);
    } else {
      setShowJump(true);
    }
  }, [messages, currentUserId, scrollToBottom]);

  // When the chat becomes visible again (mobile tab), jump to the latest
  useEffect(() => {
    if (active) requestAnimationFrame(() => scrollToBottom(false));
  }, [active, scrollToBottom]);

  // Auto-grow the textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
    el.style.overflowY = el.scrollHeight > 96 ? "auto" : "hidden";
  }, [messageText]);

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = messageText.trim();

    if (!content || !currentUserId || sending) return;

    setSending(true);
    setError("");

    const supabase = createClient();

    const { data, error: sendError } = await supabase
      .from("team_messages")
      .insert({
        team_id: teamId,
        sender_id: currentUserId,
        content,
      })
      .select("id, team_id, sender_id, content, created_at")
      .single();

    if (sendError) {
      console.error("Error sending team message:", sendError);
      setError("Your message couldn't be sent. Please try again.");
    } else if (data) {
      addMessage({
        id: data.id,
        teamId: data.team_id,
        senderId: data.sender_id,
        content: data.content,
        createdAt: data.created_at,
      });

      setMessageText("");
      setTray(null);
    }

    setSending(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const insertText = (text: string) => {
    setMessageText((current) => (current + text).slice(0, MAX_LENGTH));
    inputRef.current?.focus();
  };

  // Highlight @Full Name mentions inside a message
  const mentionRegex = useMemo(() => {
    const names = members
      .map((m) => m.fullName.trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    return names.length ? new RegExp(`(@(?:${names.join("|")}))`, "g") : null;
  }, [members]);

  const renderContent = (content: string, own: boolean): ReactNode => {
    if (!mentionRegex) return content;

    return content.split(mentionRegex).map((part, i) =>
      part.startsWith("@") && i % 2 === 1 ? (
        <span
          key={i}
          className={`rounded px-1 font-bold ${
            own ? "bg-[#0e141b] text-[#ffda3d]" : "bg-[#ffda3d] text-[#0e141b]"
          }`}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const stack = members.slice(0, 4);

  const trimmedQuery = query.trim().toLowerCase();
  const visibleMessages = trimmedQuery
    ? messages.filter(
        (m) =>
          m.content.toLowerCase().includes(trimmedQuery) ||
          (memberMap.get(m.senderId)?.fullName || "")
            .toLowerCase()
            .includes(trimmedQuery)
      )
    : messages;

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      /* clipboard unavailable - ignore */
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-[#0e141b] bg-[#ffda3d] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#0e141b] bg-white">
            <MessageCircle size={17} />
          </div>

          <div className="min-w-0">
            <h3 className="font-black leading-tight">Team Chat</h3>
            {teamName && (
              <p className="truncate text-xs font-medium text-[#0e141b]/70">
                {teamName}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex -space-x-2">
            {stack.map((member) => (
              <Avatar
                key={member.id}
                member={member}
                name={member.fullName}
                size={28}
              />
            ))}
          </div>
          <span className="hidden text-xs font-bold sm:inline">
            {members.length} in the hive
          </span>

          <button
            type="button"
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            aria-label="Search messages"
            aria-pressed={searchOpen}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#0e141b] transition hover:bg-white ${
              searchOpen ? "bg-white" : "bg-transparent"
            }`}
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="flex shrink-0 items-center gap-2 border-b-2 border-[#0e141b] bg-white px-3 py-2">
          <Search size={15} className="shrink-0 text-[#0e141b]/50" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && closeSearch()}
            placeholder="Search messages or people..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {trimmedQuery && (
            <span className="shrink-0 text-xs font-bold text-[#0e141b]/60">
              {visibleMessages.length}{" "}
              {visibleMessages.length === 1 ? "match" : "matches"}
            </span>
          )}
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Close search"
            className="rounded p-1 transition hover:bg-black/10"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto bg-[#fffdf5] px-3 py-4 sm:px-5"
          style={{ backgroundImage: HEX_BG }}
        >
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center">
              <LoaderCircle className="animate-spin" size={28} />
              <p className="mt-3 text-sm font-medium text-gray-500">
                Loading messages...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#0e141b] bg-[#ffda3d] text-3xl">
                🐝
              </div>

              <h4 className="mt-3 font-black">No messages yet!</h4>

              <p className="mt-1 max-w-[16rem] text-sm text-gray-500">
                Say hello and start your team&apos;s conversation.
              </p>

              {currentUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setMessageText("Hey team! 🐝");
                    inputRef.current?.focus();
                  }}
                  className="mt-4 rounded-full border-2 border-[#0e141b] bg-white px-4 py-1.5 text-sm font-bold transition hover:bg-[#fff3b0]"
                >
                  Wave hello 👋
                </button>
              )}
            </div>
          ) : visibleMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Search size={22} className="text-[#0e141b]/40" />
              <p className="mt-2 text-sm font-bold">No matches</p>
              <p className="text-xs text-gray-500">
                Try a different word or a teammate&apos;s name.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {visibleMessages.map((message, index) => {
                const prev = visibleMessages[index - 1];
                const own = message.senderId === currentUserId;
                const sender = memberMap.get(message.senderId);
                const name = own ? "You" : sender?.fullName || "Team member";

                const newDay =
                  !prev || dayKey(prev.createdAt) !== dayKey(message.createdAt);
                const startsGroup =
                  newDay ||
                  prev.senderId !== message.senderId ||
                  new Date(message.createdAt).getTime() -
                    new Date(prev.createdAt).getTime() >
                    GROUP_GAP_MS;

                return (
                  <div key={message.id}>
                    {newDay && (
                      <div className="my-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-[#0e141b]/20" />
                        <span className="rounded-full border-2 border-[#0e141b] bg-white px-3 py-0.5 text-xs font-bold">
                          {dayLabel(message.createdAt)}
                        </span>
                        <div className="h-px flex-1 bg-[#0e141b]/20" />
                      </div>
                    )}

                    <div
                      className={`flex items-end gap-2 ${
                        own ? "justify-end" : "justify-start"
                      } ${startsGroup ? "mt-3" : ""}`}
                    >
                      {!own && (
                        <div className="w-7 shrink-0">
                          {startsGroup && (
                            <Avatar member={sender} name={name} size={28} />
                          )}
                        </div>
                      )}

                      <div
                        className={`group max-w-[85%] rounded-2xl border-2 border-[#0e141b] px-3 py-1.5 sm:max-w-[70%] ${
                          own
                            ? "bg-[#ffda3d] shadow-[3px_3px_0px_#0e141b]"
                            : "bg-white shadow-[3px_3px_0px_rgba(10,15,22,0.3)]"
                        } ${
                          startsGroup
                            ? own
                              ? "rounded-br-sm"
                              : "rounded-bl-sm"
                            : ""
                        }`}
                      >
                        {startsGroup && !own && (
                          <p className="mb-0.5 text-xs font-black text-[#0e141b]/70">
                            {name}
                          </p>
                        )}

                        <p className="whitespace-pre-wrap break-words text-sm font-medium text-[#0e141b]">
                          {renderContent(message.content, own)}
                        </p>

                        <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[10px] text-[#0e141b]/60">
                          <button
                            type="button"
                            onClick={() =>
                              copyMessage(message.id, message.content)
                            }
                            aria-label="Copy message"
                            className="opacity-0 transition hover:text-[#0e141b] focus:opacity-100 group-hover:opacity-100"
                          >
                            {copiedId === message.id ? (
                              <Check size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <span>
                            {new Date(message.createdAt).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showJump && (
          <button
            type="button"
            onClick={() => {
              scrollToBottom(true);
              setShowJump(false);
            }}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border-2 border-[#0e141b] bg-[#ffda3d] px-3 py-1.5 text-xs font-black shadow-[3px_3px_0px_#0e141b] transition hover:-translate-y-0.5"
          >
            <ArrowDown size={14} />
            New messages
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {/* Quick tray: emoji / mentions */}
      {tray && (
        <div className="flex shrink-0 flex-wrap gap-1.5 border-t-2 border-[#0e141b] bg-[#fff8d9] px-3 py-2">
          {tray === "emoji"
            ? EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertText(emoji)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-lg transition hover:bg-[#ffda3d]"
                >
                  {emoji}
                </button>
              ))
            : members
                .filter((member) => member.id !== currentUserId)
                .map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => insertText(`@${member.fullName} `)}
                    className="flex items-center gap-1.5 rounded-full border-2 border-[#0e141b] bg-white py-1 pl-1 pr-3 text-xs font-bold transition hover:bg-[#ffda3d]"
                  >
                    <Avatar member={member} name={member.fullName} size={22} />
                    {member.fullName}
                  </button>
                ))}

          {tray === "mention" &&
            members.filter((m) => m.id !== currentUserId).length === 0 && (
              <p className="px-1 py-1 text-xs text-gray-500">
                No teammates to mention yet.
              </p>
            )}
        </div>
      )}

      {/* Message input */}
      <form
        ref={formRef}
        onSubmit={sendMessage}
        className="flex shrink-0 items-end gap-2 border-t-2 border-[#0e141b] bg-white p-3"
      >
        <div className="flex shrink-0 gap-1 pb-0.5">
          <button
            type="button"
            onClick={() => setTray((t) => (t === "emoji" ? null : "emoji"))}
            aria-label="Add emoji"
            aria-pressed={tray === "emoji"}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#0e141b]/20 transition hover:border-[#0e141b] ${
              tray === "emoji" ? "bg-[#ffda3d]" : "bg-white"
            }`}
          >
            <Smile size={18} />
          </button>

          <button
            type="button"
            onClick={() => setTray((t) => (t === "mention" ? null : "mention"))}
            aria-label="Mention a teammate"
            aria-pressed={tray === "mention"}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#0e141b]/20 transition hover:border-[#0e141b] ${
              tray === "mention" ? "bg-[#ffda3d]" : "bg-white"
            }`}
          >
            <AtSign size={18} />
          </button>
        </div>

        <div className="relative min-w-0 flex-1">
          <textarea
            ref={inputRef}
            rows={1}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift + Enter for a new line)"
            maxLength={MAX_LENGTH}
            disabled={loading || !currentUserId || sending}
            className="block max-h-24 w-full resize-none overflow-hidden rounded-xl border-2 border-[#0e141b]/20 bg-[#fffdf5] px-3 py-2.5 text-sm outline-none transition focus:border-[#0e141b] disabled:opacity-50"
          />

          {messageText.length > MAX_LENGTH * 0.9 && (
            <span className="pointer-events-none absolute -top-5 right-1 text-[10px] font-bold text-[#0e141b]/60">
              {messageText.length}/{MAX_LENGTH}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!messageText.trim() || loading || sending || !currentUserId}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#0e141b] bg-[#ffda3d] shadow-[2px_2px_0px_#0e141b] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {sending ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
}