import type { Metadata } from "next";
import { SectionHeading, ButtonLink } from "@/components/ui";
import { TemplateGallery } from "@/components/marketing/template-gallery";

export const metadata: Metadata = {
  title: "Templates",
  description: "Proven starting points for AI coworkers — lead lists, price monitoring, portal collection, candidate sourcing, cited research, and more.",
};

export default function TemplatesPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="Templates"
            title="Start from a playbook that already works"
            lede="Every template is a complete agent brief — instructions, tool connections, approval rules, and output format — refined across thousands of production runs. Pick one, customize the details, run."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <TemplateGallery />
        <div className="mt-16 rounded-2xl border border-ink-100 bg-ink-50/60 px-8 py-10 text-center">
          <h2 className="text-xl font-semibold text-ink-950">Every template is fully editable</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">
            Templates set you up; your edits make it yours. Change the instructions, swap the outputs,
            tighten the approval rules — then save it to your team&rsquo;s shared library.
          </p>
          <div className="mt-6">
            <ButtonLink href="/signup">Use a template free</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
