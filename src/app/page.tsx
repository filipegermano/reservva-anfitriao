import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  MessageCircleOff,
  Printer,
  QrCode,
  Sparkles,
  Star,
  Wifi,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const painPoints = [
  {
    icon: MessageCircleOff,
    title: "As mesmas perguntas, todo check-in",
    description:
      "Senha do wi-fi, horário de check-out, como chega até a casa… o hóspede pergunta, você repete pela enésima vez no WhatsApp.",
  },
  {
    icon: Printer,
    title: "Informação espalhada e sem cara profissional",
    description:
      "Um bilhete escrito à mão, um PDF perdido no grupo — nada que passe a confiança que o seu espaço merece.",
  },
  {
    icon: Star,
    title: "Avaliações que poderiam ser melhores",
    description:
      "Hóspede perdido ou mal informado vira reclamação. E reclamação vira nota mais baixa.",
  },
];

const products = [
  {
    icon: Printer,
    title: "Cartaz de boas-vindas",
    description:
      "Um cartaz pronto para imprimir e emoldurar, com QR code para o guia completo. Deixe na entrada ou na mesa da sala.",
    href: "/registrar",
    cta: "Criar meu cartaz",
  },
  {
    icon: QrCode,
    title: "Guia digital do hóspede",
    description:
      "Uma página só sua, acessível por link ou QR code, sempre atualizada: wi-fi, check-in/out, regras e dicas da região.",
    href: "/registrar",
    cta: "Criar meu guia",
  },
];

const benefits = [
  {
    icon: MessageCircleOff,
    title: "Menos perguntas repetidas",
    description: "O hóspede encontra tudo sozinho, sem precisar te chamar no WhatsApp.",
  },
  {
    icon: Sparkles,
    title: "Visual profissional",
    description: "Guias e cartazes com cara de marca, sem precisar saber nada de design.",
  },
  {
    icon: QrCode,
    title: "Atualiza sem reimprimir",
    description: "Mudou a senha do wi-fi? Edita o guia digital e pronto — o cartaz continua valendo.",
  },
  {
    icon: Wifi,
    title: "Tudo em um só lugar",
    description: "Wi-fi, regras da casa, check-in/out e dicas locais, organizados e fáceis de achar.",
  },
  {
    icon: BookOpenCheck,
    title: "Pronto em minutos",
    description: "Preencha um formulário simples e o guia já está no ar, pronto para compartilhar.",
  },
  {
    icon: Star,
    title: "Hóspedes mais satisfeitos",
    description: "Check-in tranquilo e informação clara ajudam a conquistar avaliações melhores.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Reservva <span className="text-primary">Anfitrião</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/entrar">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/registrar">Criar conta grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" />
            Feito para anfitriões de Airbnb, pousadas e temporadas
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            O primeiro contato do hóspede com o seu espaço merece ser profissional
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-balance">
            Crie cartazes de boas-vindas e guias digitais com wi-fi, check-in/out,
            regras da casa e dicas da região — sem precisar saber nada de design.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/registrar">
                Criar meu guia grátis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/entrar">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        {/* Problema */}
        <section className="border-y bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Você conhece esse cenário?
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {painPoints.map((point) => (
                <Card key={point.title} className="border-none bg-background shadow-sm">
                  <CardContent className="flex flex-col items-start gap-3 pt-6">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <point.icon className="size-5" />
                    </div>
                    <p className="font-medium">{point.title}</p>
                    <p className="text-sm text-muted-foreground">{point.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Produtos */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Dois formatos, um único guia
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Cadastre as informações uma vez e use nos dois formatos — impresso e digital.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {products.map((product) => (
              <Card key={product.title}>
                <CardContent className="flex flex-col gap-4 pt-6">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <product.icon className="size-6" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{product.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  <Button asChild variant="outline" className="mt-auto w-fit">
                    <Link href={product.href}>
                      {product.cta}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefícios */}
        <section className="border-t bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Por que anfitriões usam o Reservva Anfitrião
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <benefit.icon className="size-4.5" />
                  </div>
                  <div>
                    <p className="font-medium">{benefit.title}</p>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Comece a receber melhor a partir de hoje
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Leva menos de 10 minutos para montar o guia completo do seu imóvel.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/registrar">
                Criar meu guia grátis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>Reservva Anfitrião — parte do ecossistema Reservva.</p>
          <div className="flex gap-4">
            <Link href="/entrar" className="hover:text-foreground">
              Entrar
            </Link>
            <Link href="/registrar" className="hover:text-foreground">
              Criar conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
