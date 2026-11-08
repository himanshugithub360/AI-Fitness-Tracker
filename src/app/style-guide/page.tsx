import type { Metadata } from "next";
import { ArrowRight, Camera, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SliderDemo } from "./demos";

export const metadata: Metadata = {
  title: "Style guide | APEX",
  description: "Colours, type and components for the APEX design system.",
};

const swatches = [
  { name: "Background", token: "--background", hex: "#090b12", cls: "bg-background" },
  { name: "Card", token: "--card", hex: "#0e1120", cls: "bg-card" },
  { name: "Secondary", token: "--secondary", hex: "#151a2e", cls: "bg-secondary" },
  { name: "Foreground", token: "--foreground", hex: "#eaeef8", cls: "bg-foreground" },
  { name: "Muted text", token: "--muted-foreground", hex: "#8f98b3", cls: "bg-muted-foreground" },
  { name: "Ember", token: "--ember", hex: "#ff6a3d", cls: "bg-ember" },
  { name: "Ice", token: "--ice", hex: "#82d6ff", cls: "bg-ice" },
  { name: "Gold", token: "--gold", hex: "#ffc857", cls: "bg-gold" },
  { name: "Success", token: "--ok", hex: "#6fe3a0", cls: "bg-ok" },
  { name: "Danger", token: "--destructive", hex: "#ff5d6c", cls: "bg-destructive" },
];

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border flex flex-col gap-6 border-t pt-12">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-14 px-5 py-16 sm:px-8 sm:py-24">
      <header className="flex flex-col gap-4">
        <span className="eyebrow">Design system / v0.1</span>
        <h1 className="text-5xl leading-[1.02] font-bold sm:text-7xl">
          APEX <span className="text-heat">style guide</span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          One deliberate look: deep ink for the ground, ember for heat and action, ice for
          structure. Every screen in the app is built from the pieces on this page.
        </p>
      </header>

      <Section eyebrow="01 / Colour" title="Ink, ember and ice">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {swatches.map((s) => (
            <div key={s.token} className="flex flex-col gap-2">
              <div className={`h-20 rounded-xl border border-white/10 ${s.cls}`} />
              <div>
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-muted-foreground font-mono text-xs">{s.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="02 / Type" title="Three typefaces, three jobs">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Display / Bricolage Grotesque</CardDescription>
              <CardTitle className="text-5xl leading-none">Aa</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Headlines and big numbers. Tight tracking, sentence case.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Body / Instrument Sans</CardDescription>
              <CardTitle className="font-sans text-5xl leading-none font-medium">Aa</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Paragraphs, buttons and form text. Calm and readable.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Data / JetBrains Mono</CardDescription>
              <CardTitle className="font-mono text-5xl leading-none font-medium">Aa</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Labels, units and readouts like{" "}
              <span className="text-foreground font-mono">535 kcal</span>.
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-display text-6xl leading-none font-extrabold tracking-tight tabular-nums">
            1,640 <span className="text-muted-foreground text-2xl font-medium">of 2,690 kcal</span>
          </p>
          <p className="text-3xl font-bold">A heading reads like this</p>
          <p className="text-foreground/90 max-w-prose text-base">
            Body text sits at 16 pixels with generous line height. Keep lines near 65 characters so
            long paragraphs stay comfortable to read on any screen.
          </p>
          <p className="eyebrow">Eyebrow label</p>
        </div>
      </Section>

      <Section eyebrow="03 / Actions" title="Buttons and badges">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            Start free <ArrowRight />
          </Button>
          <Button variant="outline">
            <Camera /> Snap a meal
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="link">Read more</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add entry">
            <Plus />
          </Button>
          <Button size="icon" variant="outline" aria-label="Add entry">
            <Plus />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Pro</Badge>
          <Badge variant="ice">Confidence 92%</Badge>
          <Badge variant="gold">14 day streak</Badge>
          <Badge variant="success">On target</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Over budget</Badge>
        </div>
      </Section>

      <Section eyebrow="04 / Inputs" title="Forms and feedback">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sg-email">Email</Label>
              <Input id="sg-email" type="email" placeholder="you@example.com" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sg-bad">Password</Label>
              <Input id="sg-bad" type="password" defaultValue="abc" aria-invalid="true" />
              <p className="text-destructive text-sm">Use at least 8 characters.</p>
            </div>
            <SliderDemo />
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground flex justify-between font-mono text-xs tracking-widest uppercase">
                <span>Protein</span>
                <span>102 / 150 g</span>
              </div>
              <Progress value={68} aria-label="Protein progress" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground flex justify-between font-mono text-xs tracking-widest uppercase">
                <span>Carbs</span>
                <span>165 / 300 g</span>
              </div>
              <Progress value={55} aria-label="Carbs progress" />
            </div>
            <Tabs defaultValue="food">
              <TabsList>
                <TabsTrigger value="food">Food</TabsTrigger>
                <TabsTrigger value="train">Train</TabsTrigger>
                <TabsTrigger value="coach">Coach</TabsTrigger>
              </TabsList>
              <TabsContent value="food" className="text-muted-foreground pt-2">
                Log meals by photo, voice or barcode.
              </TabsContent>
              <TabsContent value="train" className="text-muted-foreground pt-2">
                Plans adapt to how you recover.
              </TabsContent>
              <TabsContent value="coach" className="text-muted-foreground pt-2">
                Ask anything. The coach remembers.
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Section>

      <Section eyebrow="05 / Surfaces" title="Glass cards">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Energy today</CardDescription>
              <CardTitle className="text-4xl font-bold tabular-nums">1,640 kcal</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Progress value={61} aria-label="Calories consumed" />
              <p className="text-muted-foreground">1,050 kcal left. Dinner fits a full thali.</p>
            </CardContent>
            <CardFooter className="justify-between">
              <Badge variant="success">On target</Badge>
              <Button size="sm" variant="outline">
                Add food <Plus />
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Coach says</CardDescription>
              <CardTitle>You are 38 g short on protein</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Paneer bhurji or a curd bowl would close the gap and keep dinner under budget.
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">Log paneer bhurji</Button>
              <Button size="sm" variant="ghost">
                Not now
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      <footer className="border-border text-muted-foreground border-t pt-6 font-mono text-xs">
        Dark only by design. Components live in src/components/ui.
      </footer>
    </main>
  );
}
