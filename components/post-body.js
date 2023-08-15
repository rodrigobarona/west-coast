import { StructuredText, Image } from "react-datocms";
import { Splide } from "@splidejs/react-splide";

export default function PostBody({ content }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="prose prose-lg prose-blue">
        <StructuredText
          data={content}
          renderBlock={({ record }) => {
            if (record.__typename === "ImageBlockRecord") {
              return <Image data={record.image.responsiveImage} />;
            }
            if (record.__typename === "VideoBlockRecord") {
              return (
                <video controls poster={record.video.thumbnailUrl}>
                  <source src={record.video.url} type={record.video.mimeType} />
                </video>
              );
            }
            if (record.__typename === "GalleryBlockRecord") {
              return (
                <Splide
                  options={{
                    perPage: 1,
                    height: "fit-content",
                    rewind: true,
                    gap: "2rem",
                    paginationKeyboard: true,
                    drag: true,
                    padding: { left: "0.5rem", right: "0.5rem" },
                  }}
                  onMoved={(splide, newIndex) => {}}
                >
                  {record.gallery.map(() => (
                    <SplideSlide>
                      <img
                        src="{record.image.responsiveImage}"
                        alt="{record.image.alt}"
                      />
                    </SplideSlide>
                  ))}
                </Splide>
              );
            }
            return (
              <>
                <p>Don't know how to render a block!</p>
                <pre>{JSON.stringify(record, null, 2)}</pre>
              </>
            );
          }}
        />
      </div>
    </div>
  );
}
