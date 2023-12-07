// Dynamic import for "../components/post-preview"
const { default: PostPreview } = await import("../components/post-preview")
// Dynamic import for "next/router"
const { useRouter } = await import("next/router")
// Dynamic import for "../lib/i18n"
const { default: i18n } = await import("../lib/i18n")

export default function MoreStories({ posts }) {
  const { locale } = useRouter()
  return (
    <section>
      <h2 className="mb-8 text-6xl md:text-7xl font-bold tracking-tighter leading-tight">
        {i18n.stories.more[locale]}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32 mb-32">
        {posts.map((post) => (
          <PostPreview
            key={post.slug}
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            author={post.author}
            slug={post.slug}
            excerpt={post.excerpt}
          />
        ))}
      </div>
    </section>
  )
}
