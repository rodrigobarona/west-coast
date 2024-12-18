import Image from "next/image";
import cn from "classnames";
import Link from "next/link";

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
      loader={({ src, width }) => `${src}?w=${width}`}
      width={width}
      height={height}
      alt={alt}
      quality={80}
      {...(priority
        ? { priority: "true" }
        : { loading: "lazy", placeholder: "blur", blurDataURL: blurUpThumb })}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 50vw"
      className={cn("shadow-small w-full", {
        "hover:shadow-medium transition-shadow duration-200": slug,
      })}
    />
  );
  return (
    <div className="-mx-5 sm:mx-0 aspect-[2/1] bg-slate-200  md:rounded-xl overflow-hidden">
      {slug ? (
        <Link legacyBehavior as={`/posts/${slug}`} href="/posts/[slug]">
          <a aria-label={title}>{image}</a>
        </Link>
      ) : (
        image
      )}
    </div>
  );
}
