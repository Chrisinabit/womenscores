type PageHeaderProps = {
  eyebrow: string
  title: string
  lead?: string
}

export default function PageHeader({ eyebrow, title, lead }: PageHeaderProps) {
  return (
    <>
      <p className="mb-3 text-[10px] font-extrabold tracking-[.2em] text-emerald-300">{eyebrow}</p>
      <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
        {title}<span className="text-amber-300">.</span>
      </h1>
      {lead && <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400">{lead}</p>}
    </>
  )
}
