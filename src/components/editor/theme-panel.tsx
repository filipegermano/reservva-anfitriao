"use client";

import { Check } from "lucide-react";

import { guideThemes, homeTileColors } from "@/lib/guide/themes";
import { cn } from "@/lib/utils";
import { useEditor } from "@/components/editor/editor-context";

export function ThemePanel() {
  const { editor } = useEditor();
  const current = editor.guide.property.theme;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Aparência do guia</h2>
        <p className="text-sm text-muted-foreground">
          O tema muda cores, cantos e tipografia de todas as seções. A mudança aparece na hora na pré-visualização.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {guideThemes.map((theme) => {
          const active = theme.id === current;
          return (
            <button
              key={theme.id}
              type="button"
              aria-pressed={active}
              onClick={() => editor.updateProperty({ theme: theme.id })}
              className={cn(
                "overflow-hidden rounded-xl border bg-card text-left transition hover:shadow-md",
                active && "ring-2 ring-primary",
              )}
            >
              <div className="space-y-2 p-3" style={{ background: theme.background }}>
                <div className="h-8 rounded-md" style={{ background: theme.headerGradient }} />
                <div className="grid grid-cols-2 gap-1.5">
                  {[0, 1, 2, 3].map((index) => {
                    const tile = homeTileColors(theme, { tone: index, index, featured: index === 0 });
                    return (
                      <div
                        key={index}
                        className="flex h-8 items-center justify-center"
                        style={{
                          background: tile.background,
                          borderRadius: `calc(${theme.radius} * 0.6)`,
                          border: theme.tileBorder ? `1px solid ${theme.border}` : undefined,
                        }}
                      >
                        <span className="size-2.5 rounded-full" style={{ background: tile.foreground }} />
                      </div>
                    );
                  })}
                </div>
                <div className="h-2 w-2/3 rounded-full" style={{ background: theme.muted, opacity: 0.4 }} />
              </div>
              <div className="flex items-start justify-between gap-2 border-t p-3">
                <div>
                  <p className="text-sm font-medium">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </div>
                {active && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
