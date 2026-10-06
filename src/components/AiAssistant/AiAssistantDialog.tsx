import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles,
  Send,
  Square,
  Trash2,
  Cpu,
  Layers,
  AlertCircle,
  Database,
  ArrowRight,
  HardDrive,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Item } from "@/data/items";
import { Spell } from "@/data/spells";
import { AVAILABLE_MODELS } from "@/lib/ai/types";
import { useAiAssistant } from "@/lib/ai/useAiAssistant";
import {
  getIntelligentPromptChips,
  resolvePromptChipAction,
} from "@/lib/ai/promptChips";
import { AiMessageContent } from "./AiMessageContent";

interface AiAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem: (item: Item) => void;
  onSelectSpell: (spell: Spell) => void;
  onCreateList: (name: string, itemIds: number[], spellIds: number[]) => void;
  onToast: (msg: string) => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

const SAMPLE_PROMPTS = [
  "What are the best items for a stealthy Rogue?",
  "Recommend 3rd-level spells for an Evocation Wizard",
  "Compare Flame Tongue and Sun Blade",
  "Create a beginner dungeon-crawling gear and spell pack",
];

export const AiAssistantDialog: React.FC<AiAssistantDialogProps> = ({
  open,
  onOpenChange,
  onSelectItem,
  onSelectSpell,
  onCreateList,
  onToast,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const {
    gpuStatus,
    selectedModelId,
    setSelectedModelId,
    isModelLoaded,
    isLoading,
    loadingProgress,
    loadingStatus,
    loadError,
    isGenerating,
    isCached,
    messages,
    loadModel,
    sendMessage,
    stopGeneration,
    clearChat,
    clearModelCache,
  } = useAiAssistant();

  const [input, setInput] = useState("");
  const [showModelSettings, setShowModelSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-send initial prompt if provided (e.g. from item or spell details quick-action)
  useEffect(() => {
    if (open && initialPrompt) {
      sendMessage(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [open, initialPrompt, sendMessage, onClearInitialPrompt]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (open && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Focus textarea when modal opens and model is ready
  useEffect(() => {
    if (open && isModelLoaded) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, isModelLoaded]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isGenerating) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedChips = useMemo(() => {
    return getIntelligentPromptChips(messages, input);
  }, [messages, input]);

  const handleChipClick = (promptText: string) => {
    if (!isGenerating) {
      setInput("");
    }
    resolvePromptChipAction(
      promptText,
      isGenerating,
      sendMessage,
      (text) => {
        setInput(text);
        textareaRef.current?.focus();
      },
    );
  };

  const handleCreateListWrapper = (
    name: string,
    itemIds: number[],
    spellIds: number[],
  ) => {
    onCreateList(name, itemIds, spellIds);
    onToast(`✨ List "${name}" created and saved to My Lists!`);
  };

  const selectedModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) ||
    AVAILABLE_MODELS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[850px] w-[95vw] max-w-3xl flex-col gap-0 overflow-hidden border-stone-800 bg-stone-950 p-0 text-slate-100 shadow-2xl sm:rounded-xl">
        {/* Header */}
        <DialogHeader className="border-b border-stone-800/80 bg-stone-900/60 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-700/20 shadow-inner">
                <Sparkles className="size-4.5 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="flex items-center gap-2 text-base font-bold text-amber-100">
                  <span>D&D AI Companion</span>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-emerald-400 uppercase">
                    WebGPU
                  </span>
                </DialogTitle>
                <p className="text-xs text-stone-400">
                  {selectedModel.label}
                  {gpuStatus.adapterName ? ` · ${gpuStatus.adapterName}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowModelSettings((v) => !v)}
                className={`rounded-md p-1.5 text-xs font-medium transition-colors ${
                  showModelSettings
                    ? "bg-stone-800 text-amber-300"
                    : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                }`}
                title="Model Settings"
              >
                <Cpu className="size-4" />
              </button>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-800 hover:text-rose-400"
                  title="Clear conversation"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Model Settings Panel Dropdown */}
        {showModelSettings && (
          <div className="border-b border-stone-800 bg-stone-900/90 p-4 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-stone-300">
                Select WebGPU Model:
              </span>
              <div className="flex items-center gap-2">
                {isCached && (
                  <button
                    type="button"
                    onClick={() => {
                      clearModelCache();
                      onToast("Cached model weights deleted from browser storage.");
                    }}
                    className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-rose-400"
                    title="Delete model weights from browser storage"
                  >
                    <HardDrive className="size-3" />
                    <span>Clear Model Cache</span>
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    setSelectedModelId(model.id);
                    if (isModelLoaded && model.id !== selectedModelId) {
                      loadModel(model.id);
                    }
                  }}
                  className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                    selectedModelId === model.id
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-100"
                      : "border-stone-800 bg-stone-900/40 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-bold text-slate-100">
                      {model.label}
                    </span>
                    <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[10px] text-stone-300">
                      ~{model.vramMB} MB VRAM
                    </span>
                  </div>
                  <span className="mt-1 line-clamp-2 text-[11px] text-stone-400">
                    {model.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900/40 to-stone-950">
          {!gpuStatus.supported ? (
            /* Unsupported WebGPU */
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">
                WebGPU Not Available
              </h3>
              <p className="mt-2 max-w-md text-sm text-stone-400">
                {gpuStatus.reason}
              </p>
              <div className="mt-5 rounded-lg border border-stone-800 bg-stone-900/60 p-4 text-xs text-stone-300">
                <p className="font-semibold text-amber-300">
                  Supported Browsers:
                </p>
                <ul className="mt-1.5 space-y-1 text-stone-400">
                  <li>• Google Chrome 113+ (Desktop)</li>
                  <li>• Microsoft Edge 113+ (Desktop)</li>
                  <li>• Safari 18+ (macOS 15+ / iOS 18+)</li>
                </ul>
              </div>
            </div>
          ) : !isModelLoaded && !isLoading ? (
            /* Model Not Loaded: Launch Screen */
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-700/20 text-amber-400 shadow-lg shadow-amber-950/40">
                <Sparkles className="size-7" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-stone-100">
                In-Browser AI Assistant
              </h3>
              <p className="mt-2 max-w-md text-sm text-stone-400">
                Ask questions about items and spells, get tailored build
                recommendations, and generate custom loadouts. Runs 100% locally
                on your GPU via WebGPU.
              </p>

              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900/80 px-3.5 py-1.5 text-xs text-stone-300">
                  <Database className="size-3.5 text-amber-400" />
                  <span>Model: <strong>{selectedModel.label}</strong> (~{selectedModel.vramMB} MB VRAM)</span>
                  {isCached ? (
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300">
                      Cached
                    </span>
                  ) : (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-300">
                      First-time download
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => loadModel()}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3 font-semibold text-white shadow-md shadow-amber-950/60 transition-all hover:from-amber-500 hover:to-amber-400 active:scale-95"
                >
                  <Zap className="size-4" />
                  <span>Start AI Assistant</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>

              {loadError && (
                <div className="mt-4 flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{loadError}</span>
                </div>
              )}
            </div>
          ) : isLoading ? (
            /* Model Loading Screen with Progress */
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <RefreshCw className="size-6 animate-spin text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">
                Loading {selectedModel.label}...
              </h3>
              <p className="mt-1 text-xs text-stone-400">
                Downloading and caching weights to your browser. This only happens once.
              </p>

              <div className="mt-5 w-full max-w-sm">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Progress</span>
                  <span className="font-semibold text-amber-400">
                    {loadingProgress}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <p className="mt-2.5 truncate text-[11px] text-stone-500">
                  {loadingStatus || "Allocating GPU memory..."}
                </p>
              </div>
            </div>
          ) : (
            /* Active Chat View */
            <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5">
              {messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                    <Sparkles className="size-5" />
                  </div>
                  <h4 className="font-semibold text-stone-200 text-sm">
                    How can I assist your campaign?
                  </h4>
                  <p className="mt-1 max-w-xs text-xs text-stone-400">
                    Ask about rules, magic items, spell strategies, or request a customized list.
                  </p>

                  <div className="mt-5 grid w-full max-w-md gap-2">
                    {SAMPLE_PROMPTS.map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => sendMessage(sample)}
                        className="rounded-lg border border-stone-800/80 bg-stone-900/60 p-2.5 text-left text-xs text-stone-300 transition-all hover:border-amber-500/40 hover:bg-stone-800 hover:text-amber-200"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-amber-500/30 bg-amber-950/40 text-amber-400 shadow-xs">
                          <Sparkles className="size-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-3 shadow-md sm:max-w-[80%] ${
                          msg.role === "user"
                            ? "bg-amber-600 text-white"
                            : "border border-stone-800 bg-stone-900/90 text-stone-200"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <div className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        ) : (
                          <>
                            {msg.content ? (
                              <AiMessageContent
                                content={msg.content}
                                actionList={msg.actionList}
                                onSelectItem={onSelectItem}
                                onSelectSpell={onSelectSpell}
                                onCreateList={handleCreateListWrapper}
                              />
                            ) : msg.isStreaming ? (
                              <div className="flex items-center gap-1.5 py-1 text-xs text-stone-400">
                                <span className="size-2 animate-bounce rounded-full bg-amber-400" />
                                <span
                                  className="size-2 animate-bounce rounded-full bg-amber-400"
                                  style={{ animationDelay: "150ms" }}
                                />
                                <span
                                  className="size-2 animate-bounce rounded-full bg-amber-400"
                                  style={{ animationDelay: "300ms" }}
                                />
                              </div>
                            ) : null}

                            {msg.error && (
                              <div className="mt-2 text-xs text-rose-400">
                                ⚠️ {msg.error}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar (Only when model is ready) */}
        {isModelLoaded && (
          <div className="border-t border-stone-800 bg-stone-900/70 p-3 sm:px-5">
            {/* Intelligent Prompt Chips */}
            {suggestedChips.length > 0 && (
              <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Suggested:
                </span>
                {suggestedChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleChipClick(chip.prompt)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-800 bg-stone-900/80 px-2.5 py-1 text-[11px] font-medium text-stone-300 transition-colors hover:border-amber-500/40 hover:bg-stone-800 hover:text-amber-200 active:scale-95"
                  >
                    <Sparkles className="size-3 text-amber-400" />
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about items, spells, or say 'Create a list for...'"
                rows={1}
                disabled={isGenerating}
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-lg border border-stone-700 bg-stone-950 px-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
              />

              {isGenerating ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="flex size-11 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-600/20 text-rose-300 transition-colors hover:bg-rose-600/30 active:scale-95"
                  title="Stop generation"
                >
                  <Square className="size-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex size-11 items-center justify-center rounded-lg bg-amber-600 text-white transition-all hover:bg-amber-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                  title="Send message"
                >
                  <Send className="size-4" />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
              <span>Press Enter to send · Shift+Enter for newline</span>
              <span className="flex items-center gap-1 text-[10px]">
                <Layers className="size-3 text-amber-500/80" />
                <span>Grounded with live database</span>
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
