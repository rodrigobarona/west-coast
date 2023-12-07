import { format } from "date-fns"
import Head from "next/head"
import { renderMetaTags, useQuerySubscription } from "react-datocms"
import Container from "../../components/container"
import Comment from "../../components/comment"
import Header from "../../components/header"
import Layout from "../../components/layout"
import MoreStories from "../../components/more-stories"
import PostBody from "../../components/post-body"
import PostHeader from "../../components/post-header"
import SectionSeparator from "../../components/section-separator"
import { request } from "../../lib/datocms"
import { metaTagsFragment } from "../../lib/fragments"
import LanguageBar from "../../components/language-bar"

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
