// Dynamic import for "next/head"
const { default: Head } = await import("next/head");
// Dynamic import for "react-datocms"
const { renderMetaTags, useQuerySubscription } = await import("react-datocms");
// Dynamic import for "../components/container"
const { default: Container } = await import("../components/container");
// Dynamic import for "../components/hero-post"
const { default: HeroPost } = await import("../components/hero-post");
// Dynamic import for "../components/intro"
const { default: Intro } = await import("../components/intro");
// Dynamic import for "../components/layout"
const { default: Layout } = await import("../components/layout");
// Dynamic import for "../components/more-stories"
const { default: MoreStories } = await import("../components/more-stories");
// Dynamic import for "next/router"
import { useRouter } from "next/router";
// Dynamic import for "../components/language-bar"
const { default: LanguageBar } = await import("../components/language-bar");
// Dynamic import for "../lib/datocms"
const { request } = await import("../lib/datocms");
// Dynamic import for "../lib/fragments"
const { metaTagsFragment } = await import("../lib/fragments");

export async function getStaticProps({ preview, locale }) {
  const formattedLocale = locale.split("-")[0];
  const graphqlRequest = {
    query: `
      {
        site: _site {
          favicon: faviconMetaTags {
            ...metaTagsFragment
          }
        }
        blog {
          seo: _seoMetaTags {
            ...metaTagsFragment
          }
        }
        allPosts(locale: ${formattedLocale}, orderBy: date_DESC, first: 20) {
          title
          slug
          excerpt
          date
          coverImage {
            url(imgixParams: {auto: format, fit: crop, w: 2000, h: 1000, crop: focalpoint })
            width
            height
            basename
            alt
            blurUpThumb
            smartTags
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
  };

  return {
    props: {
      subscription: preview
        ? {
            ...graphqlRequest,
            initialData: await request(graphqlRequest),
            token: process.env.NEXT_EXAMPLE_CMS_DATOCMS_API_TOKEN,
            environment: process.env.NEXT_DATOCMS_ENVIRONMENT || null,
          }
        : {
            enabled: false,
            initialData: await request(graphqlRequest),
          },
    },
  };
}

export default function Index({ subscription }) {
  const {
    data: { allPosts, site, blog },
  } = useQuerySubscription(subscription);

  const { locale, locales, asPath } = useRouter().locale;

  const heroPost = allPosts[0];
  const morePosts = allPosts.slice(1);
  const metaTags = blog.seo.concat(site.favicon);

  return (
    <>
      <Layout preview={subscription.preview}>
        <Head>{renderMetaTags(metaTags)}</Head>
        <Container>
          <LanguageBar />
          <Intro />
          {heroPost && (
            <HeroPost
              title={heroPost.title}
              coverImage={heroPost.coverImage}
              date={heroPost.date}
              author={heroPost.author}
              slug={heroPost.slug}
              excerpt={heroPost.excerpt}
            />
          )}
          {morePosts.length > 0 && <MoreStories posts={morePosts} />}
        </Container>
      </Layout>
    </>
  );
}
