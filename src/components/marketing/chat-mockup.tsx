import { Check, CheckCheck } from "lucide-react";

const questions = [
  "Qual a senha do wi-fi?",
  "Que horas posso fazer check-in?",
  "Tem estacionamento por perto?",
  "Onde deixo as chaves na saída?",
];

export function ChatMockup() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border bg-card p-4 shadow-sm">
      <div className="space-y-2">
        {questions.map((question, index) => (
          <div key={question} className="flex justify-end">
            <div
              className="max-w-[80%] rounded-2xl rounded-tr-sm bg-muted px-3 py-2 text-sm text-foreground"
              style={{ opacity: 1 - index * 0.12 }}
            >
              {question}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
          Tá tudo no guia! 👉 reservva.app/g/vista-mar-302
          <div className="mt-1 flex items-center justify-end gap-1 text-[0.65rem] opacity-80">
            Respondido uma vez, pra sempre
            <CheckCheck className="size-3" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3.5 text-accent-foreground" />
        Sem mais repetir a mesma resposta a cada hóspede
      </div>
    </div>
  );
}
