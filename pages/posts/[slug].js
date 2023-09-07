import { format } from "date-fns";
import Head from "next/head";
import { renderMetaTags, useQuerySubscription } from "react-datocms";
import Container from "../../components/container";
import Header from "../../components/header";
import Layout from "../../components/layout";
import MoreStories from "../../components/more-stories";
import PostBody from "../../components/post-body";
import PostHeader from "../../components/post-header";
import SectionSeparator from "../../components/section-separator";
import { request } from "../../lib/datocms";
import { metaTagsFragment, responsiveImageFragment } from "../../lib/fragments";
import LanguageBar from "../../components/language-bar";

export async function getStaticPaths({ locales }) {
  const data = await request({ query: `{ allPosts { slug } }` });
  const pathsArray = [];
  data.allPosts.map((post) => {
    locales.map((language) => {
      pathsArray.push({ params: { slug: post.slug }, locale: language });
    });
  });

  return {
    paths: pathsArray,
    fallback: false,
  };
}

export async function getStaticProps({ params, preview = false, locale }) {
  const formattedLocale = locale.split("-")[0];
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
                  url (imgixParams: {auto: format, fit: clamp, w: 800, crop: focalpoint}) 
                  width
                  height
                  alt
                  blurUpThumb
                }
              }
              ...on VideoBlockRecord {
                id
                video {
                  url
                  video {
                    thumbnailUrl (format: gif)
                    mp4Url(res: high)
                  }
                  mimeType
                }
              }
              ... on GalleryBlockRecord {
                id
                gallery {
                  width
                  height
                  alt
                  blurUpThumb
                  url(imgixParams: {auto: format, fit: crop, w: 1000, h: 1000, crop: focalpoint})
                }
              }
            }
          }
          date
          ogImage: coverImage{
            url(imgixParams: {auto: format, fit: crop, w: 2000, h: 1000 })
          }
          coverImage {
            responsiveImage(imgixParams: {auto: format, fit: crop, w: 2000, h: 1000, crop: focalpoint }) {
              ...responsiveImageFragment
            }
          }
          author {
            name
            picture {
              url(imgixParams: {auto: format, fit: crop, w: 100, h: 100, sat: -100, crop: focalpoint})
            }
          }
        }

        morePosts: allPosts(locale: ${formattedLocale}, orderBy: date_DESC, first: 2, filter: {slug: {neq: $slug}}) {
          title
          slug
          excerpt
          date
          coverImage {
            responsiveImage(imgixParams: {auto: format, fit: crop, w: 2000, h: 1000, crop: focalpoint}) {
              ...responsiveImageFragment
            }
          }
          author {
            name
            picture {
              url(imgixParams: {auto: format, fit: crop, w: 100, h: 100, sat: -100})
            }
          }
        }
      }

      ${responsiveImageFragment}
      ${metaTagsFragment}
    `,
    preview,
    variables: {
      slug: params.slug,
    },
  };

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
  };
}

export default function Post({ subscription, preview }) {
  const {
    data: { site, post, morePosts },
  } = useQuerySubscription(subscription);

  const metaTags = post.seo.concat(site.favicon);

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
  );
}
