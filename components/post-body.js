import { StructuredText, Image } from "react-datocms";
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import styles from './post-body.module.css';

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

              const responsive = {
                desktop: {
                  breakpoint: { max: 3000, min: 1024 },
                  items: 1,
                  slidesToSlide: 1 // optional, default to 1.
                },
                tablet: {
                  breakpoint: { max: 1024, min: 464 },
                  items: 1,
                  slidesToSlide: 1 // optional, default to 1.
                },
                mobile: {
                  breakpoint: { max: 464, min: 0 },
                  items: 1,
                  slidesToSlide: 1 // optional, default to 1.
                }
              };
              
              return (
                <div className={`${styles.removeProse}`}>
                <Carousel
                  swipeable={true}
                  draggable={false}
                  showDots={true}
                  responsive={responsive}
                >
                 
                  {record.gallery.map(( slide, index ) => (
                    <div key={ index }>
                      <img
                        src={slide.url}
                        alt={slide.alt}
                      />
                    </div>
                  ))}

              </Carousel></div>
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