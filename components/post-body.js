import React from "react";
import { StructuredText, Image } from "react-datocms";
import { Splide, SplideSlide } from "@splidejs/react-splide";


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
                <video controls poster={record.video.video.thumbnailUrl}>
                  <source src={record.video.video.mp4Url} type="video/mp4" />
                </video>
              );
            }
            if (record.__typename === "GalleryBlockRecord") {
              return (
                <div className="non-prose">
                <Splide 
                  options={{
                    perPage: 1,
                    height: "fit-content",
                    rewind: true,
                    gap: "1px",
                    padding: 0,
                    paginationKeyboard: true,
                    drag: true
                  }}
                  
                  onMoved={(splide, newIndex) => {}}
                >
                 
                  {record.gallery.map(( slide, index ) => (
                    <SplideSlide key={ index }>
                      <img
                        src={slide.url}
                        alt={slide.alt}
                      />
                    </SplideSlide>
                  ))}

                </Splide></div>
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