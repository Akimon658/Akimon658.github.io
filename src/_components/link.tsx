interface LinkData extends Lume.Data {
  className?: string
  href: string
  title?: string
}

export default ({ children, className, href, title }: LinkData) => {
  const isExternal = href.startsWith("http")
  if (className == undefined) {
    className = `
      dark:text-blue-400
      hover:underline
      text-blue-600
      visited:dark:text-purple-400
      visited:text-purple-700
    `

    if (isExternal) {
      className +=
        " after:content-open-in-new after:dark:content-open-in-new-dark"
    }
  }

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={className}
      title={title}
    >
      {children}
    </a>
  )
}
