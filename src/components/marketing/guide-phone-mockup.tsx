import { CheckCircle2, DoorOpen, MapPin, Wifi } from "lucide-react";

export function GuidePhoneMockup() {
  return (
    <div className="relative mx-auto w-[270px] shrink-0 sm:w-[300px]">
      <div className="absolute -top-4 -right-4 z-20 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground shadow-md">
        <CheckCircle2 className="size-3.5" />
        Guia pronto
      </div>

      <div className="rounded-[2.75rem] border-[6px] border-foreground/90 bg-foreground/90 p-1.5 shadow-2xl">
        <div className="relative h-[540px] overflow-hidden rounded-[2.25rem] bg-background sm:h-[600px]">
          <div className="absolute top-0 left-1/2 z-10 h-5 w-28 -translate-x-1/2 rounded-b-xl bg-foreground/90" />

          <div className="h-full overflow-hidden">
            <div className="flex h-36 flex-col items-center justify-end bg-gradient-to-br from-primary/80 to-primary px-4 pb-4 text-center">
              <div className="rounded-lg bg-background/95 px-3 py-1.5 shadow-sm">
                <p className="font-heading text-sm font-medium">Vista Mar 302</p>
                <p className="text-[0.65rem] text-muted-foreground">Bessa, João Pessoa</p>
              </div>
            </div>

            <div className="space-y-2.5 px-3 pt-3">
              <div className="rounded-lg border bg-card p-2.5 text-card-foreground">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <Wifi className="size-3.5 text-primary" />
                  Wi-Fi
                </p>
                <p className="mt-1 font-mono text-[0.65rem] text-muted-foreground">
                  VistaMar_5G · praia2024
                </p>
              </div>

              <div className="rounded-lg border bg-card p-2.5 text-card-foreground">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <DoorOpen className="size-3.5 text-primary" />
                  Check-in
                </p>
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  A partir das 15h · autoatendimento
                </p>
              </div>

              <div className="rounded-lg border bg-card p-2.5 text-card-foreground">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <MapPin className="size-3.5 text-primary" />
                  Dicas da região
                </p>
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between rounded-md bg-accent/40 px-2 py-1">
                    <span className="text-[0.65rem]">Praia do Bessa</span>
                    <span className="text-[0.6rem] text-muted-foreground">5 min a pé</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-accent/40 px-2 py-1">
                    <span className="text-[0.65rem]">Mercado local</span>
                    <span className="text-[0.6rem] text-muted-foreground">3 min a pé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
