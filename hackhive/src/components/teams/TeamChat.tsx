
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, LoaderCircle, MessageCircle } from "lucide-react";
import type { TeamMember } from "@/components/teams/TeamMemberList";

import { createClient } from "@/lib/supabase/client";
import type { TeamMessage } from "@/types/teamMessage";

interface TeamChatProps {
  teamId: string;
  members: TeamMember[];
}

export default function TeamChat({ teamId, members }: TeamChatProps) {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    }

    setSending(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#fffdf5] p-4">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center">
            <LoaderCircle className="animate-spin" size={28} />
            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff3b0]">
              <MessageCircle size={25} />
            </div>

            <h4 className="mt-3 font-black">No messages yet!</h4>

            <p className="mt-1 text-sm text-gray-500">
              Say hello and start your team's conversation.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl border-2 border-[#223141] px-3 py-2 ${
                    isOwnMessage
                      ? "rounded-br-sm bg-[#ffda3d]"
                      : "rounded-bl-sm bg-white"
                  }`}
                >
                  <p className="mb-1 text-[10px] font-black uppercase text-[#223141]/60">
                    {isOwnMessage
  ? "You"
  : members.find((member) => member.id === message.senderId)?.fullName ||
    "Team member"}
                  </p>

                  <p className="whitespace-pre-wrap break-words text-sm font-medium text-[#223141]">
                    {message.content}
                  </p>

                  <p className="mt-1 text-right text-[10px] text-[#223141]/60">
                    {new Date(message.createdAt).toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <p className="border-t border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {/* Message input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 border-t-2 border-[#223141] bg-white p-3"
      >
        <input
          type="text"
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          disabled={loading || !currentUserId || sending}
          className="min-w-0 flex-1 rounded-xl border-2 border-[#223141]/20 bg-[#fffdf5] px-3 py-2.5 text-sm outline-none transition focus:border-[#223141] disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!messageText.trim() || loading || sending || !currentUserId}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#223141] bg-[#ffda3d] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
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
