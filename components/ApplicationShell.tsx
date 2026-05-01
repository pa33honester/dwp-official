import { StepIndicator } from "./StepIndicator";

export function ApplicationShell({
  title,
  subtitle,
  steps,
  currentStep,
  children,
}: {
  title: string;
  subtitle?: string;
  steps: { label: string }[];
  currentStep: number;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-8 md:p-12">
        <div className="text-center">
          <h1 className="font-display text-xl font-semibold uppercase tracking-wide text-gold sm:text-2xl md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
          )}
        </div>
        <div className="mt-10">
          <StepIndicator steps={steps} current={currentStep} />
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </main>
  );
}
