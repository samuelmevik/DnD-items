import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreateWebWorkerMLCEngine,
  WebWorkerMLCEngine,
  hasModelInCache,
  deleteModelAllInfoInCache,
  prebuiltAppConfig,
  AppConfig,
  ChatOptions,
} from "@mlc-ai/web-llm";
import {
  AVAILABLE_MODELS,
  ChatMessage,
  WebGpuStatus,
} from "./types";
import { buildSystemPrompt } from "./retriever";
import { parseAssistantMessage } from "./actionParser";

const STORAGE_KEY_MESSAGES = "dnd-items.ai.messages.v1";
const STORAGE_KEY_SELECTED_MODEL = "dnd-items.ai.selected-model.v1";

// WebLLM prebuiltAppConfig has a known issue for gemma3 where both context_window_size (4096)
// and sliding_window_size (512) are positive, triggering WindowSizeConfigurationError.
// Overriding sliding_window_size to -1 allows Gemma 3 to use the full 4096 context window.
export const customAppConfig: AppConfig = {
  ...prebuiltAppConfig,
  model_list: prebuiltAppConfig.model_list.map((m) => {
    if (m.model_id.toLowerCase().includes("gemma3")) {
      return {
        ...m,
        overrides: {
          ...m.overrides,
          sliding_window_size: -1,
          context_window_size: 4096,
        },
      };
    }
    return m;
  }),
};

export function useAiAssistant() {
  const [gpuStatus, setGpuStatus] = useState<WebGpuStatus>({
    supported: false,
    reason: "Checking WebGPU support...",
  });

  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    if (typeof window === "undefined") return AVAILABLE_MODELS[0].id;
    const stored = localStorage.getItem(STORAGE_KEY_SELECTED_MODEL);
    if (
      stored &&
      stored !== "gemma3-1b-it-q4f16_1-MLC" &&
      AVAILABLE_MODELS.some((m) => m.id === stored)
    ) {
      return stored;
    }
    // Default to Llama 3.2 1B (or first verified available model)
    return AVAILABLE_MODELS[0].id;
  });

  const [isCached, setIsCached] = useState<boolean>(false);
  const [engine, setEngine] = useState<WebWorkerMLCEngine | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  });

  const workerRef = useRef<Worker | null>(null);
  const engineRef = useRef<WebWorkerMLCEngine | null>(null);
  const abortControllerRef = useRef<boolean>(false);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      // Don't persist if streaming
      const nonStreaming = messages.map((m) => ({ ...m, isStreaming: false }));
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(nonStreaming));
    } catch {
      // ignore
    }
  }, [messages]);

  // Check WebGPU capabilities
  useEffect(() => {
    let active = true;

    async function checkWebGPU() {
      const nav = navigator as unknown as {
        gpu?: {
          requestAdapter: () => Promise<{
            requestAdapterInfo?: () => Promise<{ description?: string; vendor?: string }>;
          } | null>;
        };
      };

      if (!nav || !nav.gpu) {
        if (active) {
          setGpuStatus({
            supported: false,
            reason:
              "WebGPU is not enabled or supported in this browser. Please use Chrome 113+, Edge 113+, or Safari 18+ on desktop.",
          });
        }
        return;
      }

      try {
        const adapter = await nav.gpu.requestAdapter();
        if (!adapter) {
          if (active) {
            setGpuStatus({
              supported: false,
              reason:
                "WebGPU is present in the browser, but no compatible hardware GPU was detected.",
            });
          }
          return;
        }

        const info = await adapter.requestAdapterInfo?.();
        const adapterName = info?.description || info?.vendor || "WebGPU Adapter";

        if (active) {
          setGpuStatus({
            supported: true,
            adapterName,
          });
        }
      } catch (err) {
        if (active) {
          setGpuStatus({
            supported: false,
            reason:
              err instanceof Error
                ? err.message
                : "Unable to request WebGPU adapter.",
          });
        }
      }
    }

    checkWebGPU();
    return () => {
      active = false;
    };
  }, []);

  // Check if current model is in Cache
  const checkCacheStatus = useCallback(async (modelId: string) => {
    try {
      const cached = await hasModelInCache(modelId);
      setIsCached(cached);
    } catch {
      setIsCached(false);
    }
  }, []);

  useEffect(() => {
    checkCacheStatus(selectedModelId);
  }, [selectedModelId, checkCacheStatus]);

  // Initialize or reload model
  const loadModel = useCallback(
    async (targetModelId?: string) => {
      const modelId = targetModelId || selectedModelId;
      if (isLoading) return;

      setIsLoading(true);
      setLoadingProgress(0);
      setLoadingStatus("Initializing WebGPU worker...");
      setLoadError(null);

      try {
        // Terminate existing worker if any
        if (workerRef.current) {
          try {
            await engineRef.current?.unload();
          } catch {
            // ignore
          }
          workerRef.current.terminate();
          workerRef.current = null;
        }

        const worker = new Worker(
          new URL("./ai.worker.ts", import.meta.url),
          { type: "module" },
        );
        workerRef.current = worker;

        const chatOpts: ChatOptions = modelId.toLowerCase().includes("gemma3")
          ? { sliding_window_size: -1, context_window_size: 4096 }
          : {};

        const newEngine = await CreateWebWorkerMLCEngine(
          worker,
          modelId,
          {
            appConfig: customAppConfig,
            initProgressCallback: (report) => {
              setLoadingProgress(Math.min(100, Math.round(report.progress * 100)));
              setLoadingStatus(report.text);
            },
          },
          chatOpts,
        );

        engineRef.current = newEngine;
        setEngine(newEngine);
        setSelectedModelId(modelId);
        localStorage.setItem(STORAGE_KEY_SELECTED_MODEL, modelId);
        setIsCached(true);
      } catch (err) {
        console.error("Failed to load model:", err);
        setLoadError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading the WebGPU model.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, selectedModelId],
  );

  // Send message
  const sendMessage = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || isGenerating) return;

      let currentEngine = engineRef.current;
      if (!currentEngine) {
        // Auto-load if not loaded yet
        await loadModel();
        currentEngine = engineRef.current;
        if (!currentEngine) return;
      }

      const userMsgId = `user_${Date.now()}`;
      const assistantMsgId = `assistant_${Date.now()}`;

      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const initialAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
      setIsGenerating(true);
      abortControllerRef.current = false;

      try {
        // In follow-ups (e.g. "create these into a list"), include items/spells mentioned in the previous message
        const lastAssistantMsg = messages
          .filter((m) => m.role === "assistant" && m.content)
          .slice(-1)[0];
        const searchScope = lastAssistantMsg
          ? `${trimmed} ${lastAssistantMsg.content.slice(0, 400)}`
          : trimmed;
        const systemPrompt = buildSystemPrompt(searchScope);

        // Build recent history (up to last 6 messages)
        const recentHistory = messages.slice(-6).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const isGemma = selectedModelId.toLowerCase().includes("gemma");

        // Gemma models natively expect system instructions prepended inside the user turn
        // rather than emitted outside the turn markers, preventing formatting degradation.
        const chatMessages = isGemma
          ? [
              ...recentHistory,
              {
                role: "user" as const,
                content: `${systemPrompt}\n\nUser Question:\n${trimmed}`,
              },
            ]
          : [
              { role: "system" as const, content: systemPrompt },
              ...recentHistory,
              { role: "user" as const, content: trimmed },
            ];

        const chunks = await currentEngine.chat.completions.create({
          messages: chatMessages,
          temperature: 0.7,
          repetition_penalty: 1.15,
          presence_penalty: 0.2,
          max_tokens: 800,
          stop: ["<end_of_turn>", "<eos>"],
          stream: true,
        });

        let accumulatedContent = "";

        for await (const chunk of chunks) {
          if (abortControllerRef.current) {
            break;
          }
          const delta = chunk.choices[0]?.delta?.content || "";
          accumulatedContent += delta;

          // Parse intermediate actions/links
          const parsed = parseAssistantMessage(accumulatedContent);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: parsed.cleanedText,
                    actionList: parsed.action,
                    isStreaming: true,
                  }
                : msg,
            ),
          );
        }

        // Final parse when generation complete
        const finalParsed = parseAssistantMessage(accumulatedContent);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: finalParsed.cleanedText || accumulatedContent,
                  actionList: finalParsed.action,
                  isStreaming: false,
                }
              : msg,
          ),
        );
      } catch (err) {
        console.error("AI Generation error:", err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    "Sorry, an error occurred during response generation.",
                  error: err instanceof Error ? err.message : "Generation failed",
                  isStreaming: false,
                }
              : msg,
          ),
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, loadModel, messages, selectedModelId],
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current = true;
    try {
      engineRef.current?.interruptGenerate();
    } catch {
      // ignore
    }
    setIsGenerating(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    );
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
    } catch {
      // ignore
    }
  }, []);

  const clearModelCache = useCallback(
    async (modelId?: string) => {
      const target = modelId || selectedModelId;
      try {
        await deleteModelAllInfoInCache(target);
        setIsCached(false);
      } catch (e) {
        console.error("Error clearing model cache:", e);
      }
    },
    [selectedModelId],
  );

  return {
    gpuStatus,
    selectedModelId,
    setSelectedModelId,
    isModelLoaded: Boolean(engine),
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
  };
}
