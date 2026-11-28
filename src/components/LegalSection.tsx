import type { ReactNode } from 'react'

type LegalSectionProps = {
  title: string
  children: ReactNode
}

export default function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="border-t border-white/5 pt-7">
      <h2 className="text-base font-medium text-white sm:text-lg">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-gray-400 [&_a]:text-amber-300 [&_a]:underline [&_a]:decoration-amber-300/40 [&_a]:underline-offset-2 [&_a:hover]:text-amber-200 [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-emerald-100 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}
