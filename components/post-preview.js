import Avatar from "../components/avatar"
import Date from "../components/date"
import CoverImage from "./cover-image"
import Link from "next/link"
import { generateAltFallback } from "../lib/imageUtils"

export default function PostPreview({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}) {
  return (
    <div>
      <div className="mb-5">
        <Link as={`/posts/${slug}`} href="/posts/[slug]">
          <CoverImage
            src={coverImage.url}
            width={coverImage.width}
            height={coverImage.height}
            alt={
              coverImage.alt ||
              generateAltFallback(coverImage.basename, coverImage.smartTags)
            }
            blurUpThumb={coverImage.blurUpThumb}
          />
        </Link>
      </div>
      <h3 className="text-3xl mb-3 leading-snug">
        <Link legacyBehavior as={`/posts/${slug}`} href="/posts/[slug]">
          <a className="hover:underline">{title}</a>
        </Link>
      </h3>
      <p className="text-lg leading-relaxed mb-4">{excerpt}</p>
      <Avatar name={author.name} picture={author.picture} />
    </div>
  )
}
