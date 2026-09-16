"use client";

import { createContext, useContext } from "react";

import type { GuideEditorApi } from "@/components/editor/use-guide-editor";

export type EditorContextValue = {
  propertyId: string;
  aiEnabled: boolean;
  storageEnabled: boolean;
  editor: GuideEditorApi;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorProvider = EditorContext.Provider;

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error("useEditor precisa estar dentro de EditorProvider");
  return value;
}
