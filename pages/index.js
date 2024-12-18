import { useState, useEffect, useRef } from "react"; // Add this line
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

  const { locale } = useRouter();

  const heroPost = allPosts[0];
  const metaTags = blog.seo.concat(site.favicon);

  const pageSize = 10; // Fetch 20 posts from the server
  const [posts, setPosts] = useState(allPosts.slice(1, 1 + pageSize)); // Start with the first 'pageSize' posts after the featured post
  const [skip, setSkip] = useState(1 + pageSize); // Skip the first 'pageSize' posts for the next load
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreButtonRef = useRef(null);

  const loadMorePosts = async () => {
    if (loading || !hasMore) return; // Prevent multiple requests
    setLoading(true);

    const graphqlRequest = {
      query: `
        {
          allPosts(locale: ${
            locale.split("-")[0]
          }, orderBy: date_DESC, first: ${pageSize}, skip: ${skip}) {
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
      `,
    };

    try {
      const response = await request(graphqlRequest);
      const newPosts = response.allPosts;

      // Use pageSize to determine how many posts to add
      const postsToAdd = newPosts.slice(0, pageSize); // Only take the first 'pageSize' posts from the new results

      if (postsToAdd.length > 0) {
        setPosts((prevPosts) => [...prevPosts, ...postsToAdd]);
        setSkip((prevSkip) => prevSkip + pageSize); // Increment skip by pageSize for the next load
      } else {
        setHasMore(false); // No more posts to load
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 } // Trigger when the button is fully in view
    );

    if (loadMoreButtonRef.current) {
      observer.observe(loadMoreButtonRef.current);
    }

    return () => {
      if (loadMoreButtonRef.current) {
        observer.unobserve(loadMoreButtonRef.current);
      }
    };
  }, [loadMoreButtonRef, hasMore, loading]);

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
          {posts.length > 0 && <MoreStories posts={posts} />}
          {hasMore && (
            <div className="flex justify-center mb-12">
              <button
                ref={loadMoreButtonRef}
                type="button"
                className="mx-auto text-white right-2.5 bottom-2.5 bg-gray-900 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 transition duration-200 ease-in-out"
              >
                Load more posts
              </button>
            </div>
          )}
        </Container>
      </Layout>
    </>
  );
}
