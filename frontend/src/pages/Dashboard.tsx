import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface Conversation {
  id: string;
  title: string | null;
  followUps: string[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // STEP 2 STATE: Store list of conversations and current active conversation
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // STEP 3 STATE: Store current search input text
  const [query, setQuery] = useState("");

  // Check if user is authenticated. If not, redirect to login page.
  useEffect(() => {
    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/auth");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    }
    checkUser();
  }, [navigate]);

  // STEP 2 EFFECT: Fetch user conversations when authenticated
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // STEP 2 API: Fetch recent conversations from the backend
  async function fetchConversations() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await axios.get("http://localhost:3000/conversations", {
        headers: {
          Authorization: session.access_token,
        },
      });
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }

  // STEP 2: Clear active chat state for a "New Chat"
  function handleNewChat() {
    setActiveConversationId(null);
  }

  // STEP 3: Handle search query submission
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    console.log("Submitting query:", query);
    
    // Temporarily set a dummy conversation ID to transition layout to active chat
    setActiveConversationId("temp-chat-id");
    
    // Clear query
    setQuery("");
  }

  // Handle logging out
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/auth");
  }

  // Show a basic loading state while verifying authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090B11] text-zinc-100 font-sans">
        <div className="text-lg">Loading DeepFind...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#090B11] text-zinc-100 font-sans overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#0d0e12] border-r border-zinc-800 flex flex-col justify-between p-4 shrink-0">
        {/* Top Part of Sidebar */}
        <div className="flex flex-col gap-6 overflow-hidden flex-1">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-zinc-950">
              D
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
              DeepFind
            </span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl font-medium transition duration-200 text-sm cursor-pointer border border-zinc-700 text-zinc-200 hover:text-zinc-100 shrink-0 text-left flex items-center justify-center"
          >
            + New Chat
          </button>

          {/* Conversation History List */}
          <div className="flex flex-col gap-2 overflow-hidden flex-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 shrink-0">
              Recent Chats
            </span>
            
            <div className="overflow-y-auto flex-1 pr-1">
              {conversations.length === 0 ? (
                <div className="text-zinc-500 text-xs px-2 italic mt-1">
                  No recent conversations
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {conversations.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setActiveConversationId(chat.id)}
                      className={`w-full text-left py-2 px-3 rounded-lg text-sm truncate transition duration-200 cursor-pointer ${
                        activeConversationId === chat.id
                          ? "bg-zinc-850 text-emerald-400 font-medium border border-zinc-700/50"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                      }`}
                    >
                      {chat.title || "Untitled Chat"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Part of Sidebar */}
        <div className="flex flex-col gap-4 border-t border-zinc-800 pt-4 shrink-0">
          {/* User Information */}
          <div className="px-2">
            <div className="text-xs text-zinc-500">Logged in as:</div>
            <div className="text-sm font-medium truncate text-zinc-300">
              {user?.email}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 hover:border-red-900/60 text-red-400 rounded-lg text-sm transition duration-200 cursor-pointer font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-radial-[at_center_top] from-zinc-900/20 via-transparent to-transparent overflow-hidden">
        {activeConversationId === null ? (
          /* WELCOME STATE: Centered search bar */
          <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-3xl mx-auto w-full">
            <div className="text-center mb-8 animate-fade-in duration-500">
              <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-4">
                Where knowledge begins.
              </h2>
              <p className="text-zinc-400 text-base">
                Ask any question and DeepFind will search the web and synthesize the answer for you.
              </p>
            </div>

            {/* Central Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="w-full bg-[#161820]/90 border border-zinc-800 hover:border-zinc-750 focus-within:border-emerald-500/50 rounded-2xl p-2 flex items-center gap-2 shadow-2xl transition duration-200"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent border-0 outline-none text-zinc-100 placeholder-zinc-500 px-4 py-3 text-base focus:ring-0"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-sm transition duration-200 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                Ask
              </button>
            </form>
          </div>
        ) : (
          /* ACTIVE CONVERSATION STATE: Chat history scroll area + input at bottom */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Scrollable message feed (placeholder for now) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="text-zinc-500 text-sm italic">
                Active chat messages will appear here... (Step 4)
              </div>
            </div>

            {/* Bottom Search Form */}
            <div className="p-6 border-t border-zinc-900 bg-[#090B11]/50 backdrop-blur-sm">
              <form
                onSubmit={handleSearchSubmit}
                className="max-w-3xl mx-auto w-full bg-[#161820]/90 border border-zinc-800 hover:border-zinc-750 focus-within:border-emerald-500/50 rounded-2xl p-2 flex items-center gap-2 shadow-2xl transition duration-200"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a follow-up..."
                  className="flex-1 bg-transparent border-0 outline-none text-zinc-100 placeholder-zinc-500 px-4 py-3 text-base focus:ring-0"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-sm transition duration-200 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  Ask
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}