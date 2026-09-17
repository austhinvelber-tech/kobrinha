import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import avatar from "../assets/avatar.png";
import projectShop from "../assets/project-shop.png";
import projectGarden from "../assets/project-garden.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SNAKE.EXE — Jogo retrô jogável | Portfólio DEV.EXE" },
      {
        name: "description",
        content:
          "Snake em estilo Game Boy, feito em HTML, CSS e JavaScript puro: jogue no navegador, bata o recorde e conheça o desenvolvedor por trás do jogo.",
      },
      { property: "og:title", content: "SNAKE.EXE — Jogo retrô jogável" },
      {
        property: "og:description",
        content:
          "Snake em estilo Game Boy feito do zero: jogue no navegador e confira o portfólio do desenvolvedor.",
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

// ===== Constantes do jogo =====
const COLS = 15;
const ROWS = 17;
const CELL = 10; // célula lógica em px (canvas é escalado via CSS)
const BASE_TICK_MS = 170;

type Point = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";
type Phase = "title" | "playing" | "paused" | "over";

const DIRS: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function randomFood(snake: Point[]): Point {
  let p: Point;
  do {
    p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some((s) => s.x === p.x && s.y === p.y));
  return p;
}

// Bip retrô via Web Audio (criado no primeiro toque/click)
let audioCtx: AudioContext | null = null;
function beep(freq: number, duration = 0.08) {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // áudio é opcional
  }
}

function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Point[]>([]);
  const foodRef = useRef<Point>({ x: 7, y: 8 });
  const dirRef = useRef<Dir>("right");
  const queueRef = useRef<Dir[]>([]);
  const touchStartRef = useRef<Point | null>(null);

  const [phase, setPhase] = useState<Phase>("title");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  // score espelhado em ref para o tick ler o valor atual sem reiniciar
  const scoreRef = useRef(0);

  // Recorde salvo no navegador (lido só no cliente)
  useEffect(() => {
    const saved = Number(window.localStorage.getItem("snake-best") ?? "0");
    if (saved > 0) setBest(saved);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const LCD_BG = "#9bbc0f";
    const LCD_LOW = "#8bac0f";
    const LCD_MID = "#306230";
    const LCD_INK = "#0f380f";

    ctx.fillStyle = LCD_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pontinhos da grade, como o fundo de um LCD
    ctx.fillStyle = LCD_LOW;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        ctx.fillRect(x * CELL + 4, y * CELL + 4, 2, 2);
      }
    }

    // Maçã
    const f = foodRef.current;
    ctx.fillStyle = LCD_INK;
    ctx.fillRect(f.x * CELL + 1, f.y * CELL + 1, CELL - 2, CELL - 2);
    ctx.fillStyle = LCD_BG;
    ctx.fillRect(f.x * CELL + 3, f.y * CELL + 3, 2, 2);

    // Cobra
    snakeRef.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? LCD_INK : LCD_MID;
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      if (i === 0) {
        // "olhos" do pixel
        ctx.fillStyle = LCD_BG;
        ctx.fillRect(s.x * CELL + 3, s.y * CELL + 3, 2, 2);
      }
    });
  }, []);

  const startGame = useCallback(() => {
    snakeRef.current = [
      { x: 5, y: 8 },
      { x: 4, y: 8 },
      { x: 3, y: 8 },
    ];
    dirRef.current = "right";
    queueRef.current = [];
    foodRef.current = randomFood(snakeRef.current);
    setScore(0);
    setPhase("playing");
    beep(660);
  }, []);

  const turn = useCallback((dir: Dir) => {
    setPhase((phase) => {
      if (phase === "playing") {
        const last = queueRef.current.at(-1) ?? dirRef.current;
        if (dir !== last && dir !== OPPOSITE[last]) {
          queueRef.current.push(dir);
        }
      }
      return phase;
    });
  }, []);

  // Loop do jogo
  useEffect(() => {
    if (phase !== "playing") return;

    const tick = () => {
      const next = queueRef.current.shift();
      if (next) dirRef.current = next;
      const d = DIRS[dirRef.current];
      const snake = snakeRef.current;
      const headSeg = snake[0];
      if (!headSeg) return;
      const head = { x: headSeg.x + d.x, y: headSeg.y + d.y };

      const hitWall = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;
      const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
      if (hitWall || hitSelf) {
        beep(110, 0.25);
        setPhase("over");
        setBest((b) => {
          const nb = Math.max(b, scoreRef.current);
          window.localStorage.setItem("snake-best", String(nb));
          return nb;
        });
        return;
      }

      snake.unshift(head);
      const food = foodRef.current;
      if (head.x === food.x && head.y === food.y) {
        beep(880);
        setScore((s) => s + 10);
        foodRef.current = randomFood(snake);
      } else {
        snake.pop();
      }
      draw();
    };

    const id = window.setInterval(tick, Math.max(70, BASE_TICK_MS - Math.floor(score / 30) * 15));
    return () => window.clearInterval(id);
    // score na dependência reinicia o intervalo para acelerar gradualmente
  }, [phase, score, draw]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Desenha sempre que a fase muda (título, pausa, fim)
  useEffect(() => {
    draw();
  }, [phase, draw]);

  // Teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const dirs: Record<string, Dir> = {
        arrowup: "up",
        w: "up",
        arrowdown: "down",
        s: "down",
        arrowleft: "left",
        a: "left",
        arrowright: "right",
        d: "right",
      };
      if (dirs[key]) {
        if (phase === "playing") {
          e.preventDefault();
          turn(dirs[key]);
        }
        return;
      }
      if (key === " " || key === "enter") {
        if (phase === "title" || phase === "over") {
          e.preventDefault();
          startGame();
        } else if (phase === "playing" || phase === "paused") {
          e.preventDefault();
          setPhase((p) => (p === "playing" ? "paused" : "playing"));
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, turn, startGame]);

  // Toque: arraste sobre o tabuleiro para mudar a direção
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start || phase !== "playing") return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? "right" : "left");
    else turn(dy > 0 ? "down" : "up");
  };

  return (
    <section id="jogo" className="scroll-mt-4 px-4 py-8">
      {/* HUD */}
      <div className="mx-auto mb-3 flex max-w-[340px] items-end justify-between border-b-2 border-lcd-ink pb-2">
        <div>
          <p className="text-[6px] opacity-60">SCORE</p>
          <p className="font-crt text-2xl leading-none">{String(score).padStart(4, "0")}</p>
        </div>
        <div className="text-right">
          <p className="text-[6px] opacity-60">RECORDE</p>
          <p className="font-crt text-2xl leading-none">{String(best).padStart(4, "0")}</p>
        </div>
      </div>

      {/* Tabuleiro */}
      <div
        className="relative mx-auto max-w-[340px] border-4 border-lcd-ink bg-lcd-bg shadow-[6px_6px_0_0_var(--color-lcd-ink)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          className="pixelated block w-full"
        />

        {/* Overlays de estado */}
        {phase !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-lcd-bg/90 px-4 text-center">
            {phase === "title" && (
              <>
                <p className="text-sm">SNAKE.EXE</p>
                <p className="font-crt text-lg leading-tight opacity-70">
                  Coma as maçãs, cresça
                  <br />e não bata em nada!
                </p>
                <button
                  onClick={startGame}
                  className="border-2 border-lcd-ink bg-lcd-ink px-6 py-3 text-[10px] text-lcd-bg transition-transform active:translate-x-0.5 active:translate-y-0.5"
                >
                  ▶ JOGAR
                </button>
                <p className="animate-[pixel-blink_1s_steps(1)_infinite] text-[7px] opacity-70">
                  SETAS / WASD OU ARRASTE
                </p>
              </>
            )}
            {phase === "paused" && (
              <>
                <p className="text-sm">PAUSA</p>
                <button
                  onClick={() => setPhase("playing")}
                  className="border-2 border-lcd-ink px-6 py-3 text-[10px] transition-colors active:bg-lcd-ink active:text-lcd-bg"
                >
                  CONTINUAR
                </button>
              </>
            )}
            {phase === "over" && (
              <>
                <p className="text-sm">GAME OVER</p>
                <p className="font-crt text-xl">
                  {score > 0 && score >= best ? "NOVO RECORDE! " : ""}
                  {score} PTS
                </p>
                <button
                  onClick={startGame}
                  className="border-2 border-lcd-ink bg-lcd-ink px-6 py-3 text-[10px] text-lcd-bg transition-transform active:translate-x-0.5 active:translate-y-0.5"
                >
                  ↻ TENTAR DE NOVO
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Botão de pausa */}
      {phase === "playing" && (
        <div className="mx-auto mt-3 max-w-[340px] text-center">
          <button
            onClick={() => setPhase("paused")}
            className="border-2 border-lcd-ink px-4 py-2 text-[8px] transition-colors active:bg-lcd-ink active:text-lcd-bg"
          >
            | | PAUSA
          </button>
        </div>
      )}

      {/* D-pad para celular */}
      <div className="mx-auto mt-6 grid max-w-[180px] grid-cols-3 gap-2">
        <div />
        <DpadButton label="▲" onPress={() => turn("up")} />
        <div />
        <DpadButton label="◀" onPress={() => turn("left")} />
        <div className="flex items-center justify-center">
          <div className="size-3 bg-lcd-ink" />
        </div>
        <DpadButton label="▶" onPress={() => turn("right")} />
        <div />
        <DpadButton label="▼" onPress={() => turn("down")} />
        <div />
      </div>
    </section>
  );
}

function DpadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className="flex aspect-square items-center justify-center border-2 border-lcd-ink bg-lcd-bg text-sm transition-transform active:translate-x-0.5 active:translate-y-0.5 active:bg-lcd-ink active:text-lcd-bg"
      aria-label={`Direção ${label}`}
    >
      {label}
    </button>
  );
}

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

        <a href="#jogo" className="group relative inline-block">
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

      {/* O JOGO */}
      <SnakeGame />

      {/* SOBRE OS PROJETOS */}
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
            href="#jogo"
            className="border-2 border-lcd-ink py-3 text-[10px] uppercase transition-colors active:bg-lcd-ink active:text-lcd-bg"
          >
            Jogar de novo
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
