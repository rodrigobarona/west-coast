// Dynamic import for "date-fns"
const { format } = await import("date-fns")
// Dynamic import for "next/head"
const { default: Head } = await import("next/head")
// Dynamic import for "react-datocms"
const { renderMetaTags, useQuerySubscription } = await import("react-datocms")
// Dynamic import for "../../components/container"
const { default: Container } = await import("../../components/container")
// Dynamic import for "../../components/comment"
const { default: Comment } = await import("../../components/comment")
// Dynamic import for "../../components/header"
const { default: Header } = await import("../../components/header")
// Dynamic import for "../../components/layout"
const { default: Layout } = await import("../../components/layout")
// Dynamic import for "../../components/more-stories"
const { default: MoreStories } = await import("../../components/more-stories")
// Dynamic import for "../../components/post-body"
const { default: PostBody } = await import("../../components/post-body")
// Dynamic import for "../../components/post-header"
const { default: PostHeader } = await import("../../components/post-header")
// Dynamic import for "../../components/section-separator"
const { default: SectionSeparator } = await import(
  "../../components/section-separator"
)
// Dynamic import for "../../lib/datocms"
const { request } = await import("../../lib/datocms")
// Dynamic import for "../../lib/fragments"
const { metaTagsFragment } = await import("../../lib/fragments")
// Dynamic import for "../../components/language-bar"
const { default: LanguageBar } = await import("../../components/language-bar")

export async function getStaticPaths({ locales }) {
  const data = await request({ query: `{ allPosts { slug } }` })
  const pathsArray = []
  data.allPosts.map((post) => {
    locales.map((language) => {
      pathsArray.push({ params: { slug: post.slug }, locale: language })
    })
  })

  return {
    paths: pathsArray,
    fallback: false,
  }
}

export async function getStaticProps({ params, preview = false, locale }) {
  const formattedLocale = locale.split("-")[0]
  const graphqlRequest = {
    query: `
      query PostBySlug($slug: String) {
        site: _site {
          favicon: faviconMetaTags {
            ...metaTagsFragment
          }
        }
        post(locale: ${formattedLocale}, filter: {slug: {eq: $slug}}) {
          seo: _seoMetaTags {
            ...metaTagsFragment
          }
          title
          slug
          content {
            value
            blocks {
              __typename
              ...on ImageBlockRecord {
                id
                image {
                  url (imgixParams: {auto: format, fit: clamp, w: 700, crop: focalpoint}) 
                  width
                  height
                  basename
                  alt
                  blurUpThumb
                  smartTags
                }
              }
              ...on VideoBlockRecord {
                id
                video {
                  url
                  title
                  basename
                  thumbhash
                  height
                  width
                  blurUpThumb
                  blurhash
                  video {
                    framerate
                    duration
                    muxPlaybackId
                    muxAssetId
                    streamingUrl
                    thumbnailUrl
                    mp4Url(res: high)
                  }
                  height
                  width
                  mimeType
                }
              }
              ... on AudioBlockRecord {
                id
                audio {
                  url
                  mimeType
                }
              }
              ... on GalleryBlockRecord {
                id
                gallery {
                  width
                  height
                  basename
                  alt
                  blurUpThumb
                  smartTags
                  url(imgixParams: {auto: format, fit: crop, w: 700, h: 700, crop: focalpoint})
                }
              }
            }
          }
          date
          ogImage: coverImage{
            url(imgixParams: {auto: format, fit: crop, w: 2000, h: 1000 })
          }
          coverImage {
            width
            height
            basename
            alt
            blurUpThumb
            smartTags
            url(imgixParams: {auto: format, fit: crop, w: 2000, h: 1000, crop: focalpoint })
          }
          author {
            name
            picture {
              url(imgixParams: {auto: format, fit: crop, w: 100, h: 100, sat: -100, crop: focalpoint})
            }
          }
        }

        morePosts: allPosts(locale: ${formattedLocale}, orderBy: date_DESC, first: 10, filter: {slug: {neq: $slug}}) {
          title
          slug
          excerpt
          date
          coverImage {
            width
            height
            basename
            alt
            blurUpThumb
            smartTags
            url(imgixParams: {auto: format, fit: crop, w: 2000, h: 1000, crop: focalpoint})
          }
          author {
            name
            picture {
              url(imgixParams: {auto: format, fit: crop, w: 100, h: 100, sat: -100})
            }
          }
        }
      }

      ${metaTagsFragment}
    `,
    preview,
    variables: {
      slug: params.slug,
    },
  }

  return {
    props: {
      subscription: preview
        ? {
            ...graphqlRequest,
            initialData: await request(graphqlRequest),
            token: process.env.NEXT_EXAMPLE_CMS_DATOCMS_API_TOKEN,
          }
        : {
            enabled: false,
            initialData: await request(graphqlRequest),
          },
      preview,
    },
  }
}

export default function Post({ subscription, preview }) {
  const {
    data: { site, post, morePosts },
  } = useQuerySubscription(subscription)

  const metaTags = post.seo.concat(site.favicon)

  return (
    <Layout preview={preview}>
      <Head>{renderMetaTags(metaTags)}</Head>
      <Container>
        <LanguageBar />
        <Header />
        <article>
          <PostHeader
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            author={post.author}
          />
          <PostBody content={post.content} />
        </article>

        <SectionSeparator />
        {morePosts.length > 0 && <MoreStories posts={morePosts} />}
      </Container>
    </Layout>
  )
}
