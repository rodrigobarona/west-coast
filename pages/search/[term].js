// Dynamic import for "@datocms/CMA-client"
const { buildClient } = await import("@datocms/cma-client")
// Dynamic import for "next/link"
const { default: Link } = await import("next/link")
// Dynamic import for "next/router"
import { useRouter } from "next/router"
// Dynamic import for "react"
const { useEffect } = await import("react")
// Dynamic import for "react-datocms"
const { useSiteSearch } = await import("react-datocms")
// Dynamic import for "../../components/container"
const { default: Container } = await import("../../components/container")
// Dynamic import for "../../components/intro"
const { default: Intro } = await import("../../components/intro")
// Dynamic import for "../../components/language-bar"
const { default: LanguageBar } = await import("../../components/language-bar")
// Dynamic import for "../../components/layout"
const { default: Layout } = await import("../../components/layout")

export async function getServerSideProps(context) {
  const token = process.env.NEXT_EXAMPLE_CMS_DATOCMS_API_TOKEN_SITE_SEARCH
  const buildTriggerId = process.env.NEXT_EXAMPLE_CMS_DATOCMS_BUILD_TRIGGER_ID
  return {
    props: { token, buildTriggerId },
  }
}

export default function Search(props) {
  const router = useRouter()
  const { term } = router.query

  const client = buildClient({
    apiToken: props.token,
  })

  const { state, data } = useSiteSearch({
    client,
    buildTriggerId: props.buildTriggerId,
    initialState: { locale: router.locale },
    highlightMatch: (text, key, context) => <strong key={key}>{text}</strong>,
  })

  useEffect(() => {
    state.setLocale(router.locale)
    state.setQuery(term)
  }, [term, router.locale])

  return (
    <Layout>
      <Container>
        <LanguageBar />
        <Intro />
        {data &&
          data.pageResults.map((result) => {
            const paramsArray = result.url.split("/")
            const slug = paramsArray[paramsArray.length - 1]
            const isNotHomePage = slug && slug != "it"

            if (isNotHomePage) {
              const formatedSlug = "/posts/" + slug

              return (
                <div key={result.id} className="mb-5">
                  <h3 className="text-3xl mb-3 leading-snug">
                    <Link legacyBehavior as={formatedSlug} href={formatedSlug}>
                      <a className="hover:underline">{result.title}</a>
                    </Link>
                  </h3>
                  <p className="text-lg leading-relaxed mb-4">
                    {result.bodyExcerpt}
                  </p>
                </div>
              )
            }
          })}
      </Container>
    </Layout>
  )
}
