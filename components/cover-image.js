// Dynamic import for "next/image"
const { Image } = await import("next/image")
// Dynamic import for "classnames"
const cn = await import("classnames")
// Dynamic import for "next/link"
const { Link } = await import("next/link")

export default function CoverImage({
  title,
  src,
  width,
  height,
  alt,
  slug,
  blurUpThumb,
  priority,
}) {
  const image = (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      quality={80}
      {...(priority
        ? { priority: "true" }
        : { loading: "lazy", placeholder: "blur", blurDataURL: blurUpThumb })}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 50vw"
      className={cn("shadow-small", {
        "hover:shadow-medium transition-shadow duration-200": slug,
      })}
    />
  )
  return (
    <div className="-mx-5 sm:mx-0">
      {slug ? (
        <Link legacyBehavior as={`/posts/${slug}`} href="/posts/[slug]">
          <a aria-label={title}>{image}</a>
        </Link>
      ) : (
        image
      )}
    </div>
  )
}
