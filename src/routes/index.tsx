import { createFileRoute } from "@tanstack/react-router";
import avatar from "../assets/avatar.png";
import projectShop from "../assets/project-shop.png";
import projectGarden from "../assets/project-garden.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DEV.EXE — Portfólio jogável estilo Game Boy" },
      {
        name: "description",
        content:
          "Portfólio de desenvolvedor em estilo retrô: projetos como níveis de jogo, habilidades como atributos e contato no fim da fase.",
      },
      { property: "og:title", content: "DEV.EXE — Portfólio jogável estilo Game Boy" },
      {
        property: "og:description",
        content:
          "Projetos como níveis, skills como atributos e contato no fim da fase.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const projects = [
  {
    world: "WORLD 0-1",
    title: "LOJA_PÍXEL.TSX",
    desc: "E-commerce com React — deploy concluído",
    image: projectShop,
    alt: "Ícone pixel art de uma loja com carrinho de compras",
  },
  {
    world: "WORLD 0-2",
    title: "JARDIM_BOT.PY",
    desc: "App de lembretes de rega — ciclo de crescimento 99%",
    image: projectGarden,
    alt: "Ícone pixel art de um regador regando uma planta",
  },
];

const stats = [
  { name: "INTELECTO", value: 92 },
  { name: "AGILIDADE", value: 78 },
  { name: "VITALIDADE", value: 64 },
];

function Index() {
  return (
    <div className="min-h-screen bg-lcd-bg font-pixel text-lcd-ink selection:bg-lcd-ink selection:text-lcd-bg">
      {/* Overlay da tela: fantasma do hardware */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-[0.03]">
        <div
          className="absolute inset-0 animate-[pixel-scanline_0.2s_linear_infinite]"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent 0, transparent 2px, #000 2px, #000 4px)",
          }}
        />
      </div>

      {/* TELA DE TÍTULO */}
      <section className="relative border-b-4 border-lcd-ink px-6 pb-10 pt-12 text-center animate-[pixel-entrance_0.6s_var(--ease-pixel)_both]">
        <div className="mb-8 inline-block border-2 border-lcd-ink p-1">
          <img
            src={avatar}
            alt="Retrato pixel art do desenvolvedor"
            width={96}
            height={96}
            className="pixelated size-24 bg-lcd-low"
          />
        </div>

        <h1 className="mb-3 text-2xl uppercase tracking-tighter">DEV.EXE</h1>
        <div className="mb-10 flex items-center justify-center gap-2">
          <span className="h-1 w-1 bg-lcd-ink"></span>
          <p className="text-[7px] uppercase tracking-widest opacity-80">
            Level 12 Desenvolvedor
          </p>
          <span className="h-1 w-1 bg-lcd-ink"></span>
        </div>

        <a href="#niveis" className="group relative inline-block">
          <div className="absolute -inset-1 translate-x-1 translate-y-1 bg-lcd-ink"></div>
          <div className="relative border-2 border-lcd-ink bg-lcd-bg px-6 py-4 transition-transform active:translate-x-0.5 active:translate-y-0.5">
            <span className="text-[10px]">PRESS START</span>
          </div>
        </a>

        <div className="mt-10 flex flex-col items-center gap-2">
          <span className="animate-[pixel-blink_1s_steps(1)_infinite] text-[8px]">
            ▼ SCROLL TO PLAY
          </span>
        </div>
      </section>

      {/* SELEÇÃO DE NÍVEL (navegação principal) */}
      <section id="niveis" className="scroll-mt-4 space-y-8 px-5 py-10">
        <div className="flex items-end justify-between border-b-2 border-lcd-ink pb-2">
          <h2 className="text-[10px] uppercase leading-none">Quest Log</h2>
          <span className="font-crt text-2xl italic leading-none opacity-70">02/02</span>
        </div>

        <div className="flex flex-col gap-5">
          {projects.map((project, index) => (
            <div
              key={project.title}
              className="group relative animate-[pixel-entrance_0.6s_var(--ease-pixel)_both]"
              style={{ animationDelay: `${100 + index * 100}ms` }}
            >
              <div className="absolute inset-0 translate-x-1 translate-y-1 bg-lcd-ink opacity-20"></div>
              <div className="relative flex gap-4 border-2 border-lcd-ink bg-lcd-bg p-3">
                <img
                  src={project.image}
                  alt={project.alt}
                  width={64}
                  height={64}
                  loading="lazy"
                  className="pixelated size-16 shrink-0 border border-lcd-ink/20 bg-lcd-low"
                />
                <div className="flex min-w-0 flex-col justify-center">
                  <span className="mb-1 text-[6px] opacity-60">{project.world}</span>
                  <h3 className="mb-1 text-[9px]">{project.title}</h3>
                  <p className="font-crt text-lg leading-tight opacity-70">
                    {project.desc}
                  </p>
                </div>
                <div className="ml-auto self-center">
                  <div className="flex size-4 items-center justify-center border border-lcd-ink">
                    <div className="size-2 bg-lcd-ink"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PAINEL DE STATUS */}
      <section className="border-y-4 border-lcd-ink bg-lcd-low px-5 py-10 animate-[pixel-entrance_0.6s_var(--ease-pixel)_both_300ms]">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-[10px] uppercase">Character Stats</h2>
          <span className="bg-lcd-ink px-2 py-1 text-[8px] text-lcd-bg">EXP MAX</span>
        </div>

        <div className="space-y-6">
          {stats.map((stat) => (
            <div key={stat.name} className="space-y-2">
              <div className="flex justify-between font-crt text-xl">
                <span>{stat.name}</span>
                <span>{stat.value}/99</span>
              </div>
              <div className="h-4 border-2 border-lcd-ink p-0.5">
                <div
                  className="h-full bg-lcd-ink transition-[width] duration-700 ease-pixel"
                  style={{ width: `${stat.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="px-6 py-16 text-center animate-[pixel-entrance_0.6s_var(--ease-pixel)_both_400ms]">
        <div className="mb-8 space-y-2">
          <p className="font-crt text-2xl">END OF CHAPTER 01</p>
          <p className="text-[7px] opacity-60">WOULD YOU LIKE TO SAVE?</p>
        </div>

        <div className="mx-auto flex max-w-[200px] flex-col gap-4">
          <a
            href="mailto:seu.email@exemplo.com"
            className="border-2 border-lcd-ink bg-lcd-ink py-3 text-[10px] uppercase text-lcd-bg transition-colors active:bg-lcd-bg active:text-lcd-ink"
          >
            Save &amp; Mail
          </a>
          <a
            href="#"
            className="border-2 border-lcd-ink py-3 text-[10px] uppercase transition-colors active:bg-lcd-ink active:text-lcd-bg"
          >
            Continue
          </a>
        </div>

        <div className="mt-20 border-t border-lcd-ink/10 pt-8">
          <p className="text-[6px] leading-relaxed opacity-40">
            SYSTEM V.2026.0.1
            <br />
            POWERED BY GREEN DOT MATRIX TECHNOLOGY
          </p>
        </div>
      </footer>
    </div>
  );
}
