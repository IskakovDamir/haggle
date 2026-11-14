// The two voices a visitor can pick for the agent. Voice ids are public identifiers, not secrets.
// Both are ElevenLabs default voices, so they work on every plan (library voices need a paid plan).

export type AgentVoice = "female" | "male";

export const AGENT_VOICES: Record<AgentVoice, { id: string; name: string; label: string }> = {
  female: { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", label: "Female" },
  male: { id: "iP95p4xoKVk53GoZ742B", name: "Chris", label: "Male" },
};

export const DEFAULT_AGENT_VOICE: AgentVoice = "female";

/** ElevenLabs' most expressive model built for realtime agents. */
export const AGENT_TTS_MODEL = "eleven_v4_turbo";
