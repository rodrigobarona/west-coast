// Dynamic import for "./container"
const { default: Container } = await import("./container")
// Dynamic import for "next/router"
const { useRouter } = await import("next/router")
// Dynamic import for "../lib/i18n"
const { default: i18n } = await import("../lib/i18n")

export default function Footer() {
  const { locale } = useRouter()
  return (
    <footer className="bg-accent-1 border-t border-accent-2">
      <Container>
        <div className="py-10 lg:py-28 flex flex-col lg:flex-row items-center">
          <h3 className="text-base tracking-tighter leading-tight text-center lg:text-left mb-10 lg:mb-0 lg:pr-4 lg:w-1/2">
            {i18n.footer.static[locale]}
          </h3>
          <div className="flex flex-col lg:flex-row justify-center items-center lg:pl-4 lg:w-1/2">
            <a
              href="https://www.buymeacoffee.com/westcoast"
              className="text-xs lg:text-base mx-3 bg-black hover:bg-white hover:text-black border border-black text-white font-bold py-3 px-12 lg:px-8 duration-200 transition-colors mb-6 lg:mb-0"
            >
              {i18n.footer.read[locale]}
            </a>
            <a
              href="mailto:patimota@gmail.com"
              className="mx-3 font-bold hover:underline"
            >
              {i18n.footer.github[locale]}
            </a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
