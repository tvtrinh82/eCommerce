"use client";

import React from "react";
import { Carousel, Button, Tag } from "antd";
import { ArrowRightOutlined, ThunderboltFilled } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { MOCK_HERO_SLIDES } from "@/lib/mockData";
import styles from "./HeroCarousel.module.scss";

export default function HeroCarousel() {
  const router = useRouter();

  return (
    <div className={styles.carouselWrapper}>
      <Carousel autoplay autoplaySpeed={5000} effect="fade" dots={{ className: styles.customDots }}>
        {MOCK_HERO_SLIDES.map((slide) => (
          <div key={slide.id}>
            <div
              className={styles.slideCard}
              style={{ background: slide.bgGradient }}
            >
              <div className={styles.slideContent}>
                <div className={styles.textContent}>
                  <Tag className={styles.tagBadge} icon={<ThunderboltFilled />}>
                    {slide.tag}
                  </Tag>

                  <h1 className={styles.title}>{slide.title}</h1>
                  <p className={styles.subtitle}>{slide.subtitle}</p>

                  <div className={styles.priceHighlight}>
                    <span className={styles.price}>{slide.priceText}</span>
                  </div>

                  <div className={styles.buttonGroup}>
                    <Button
                      type="primary"
                      size="large"
                      className={styles.ctaPrimary}
                      icon={<ArrowRightOutlined />}
                      iconPosition="end"
                      onClick={() => router.push(slide.ctaLink)}
                    >
                      {slide.ctaText}
                    </Button>
                    <Button
                      ghost
                      size="large"
                      className={styles.ctaSecondary}
                      onClick={() => router.push("/#popular")}
                    >
                      Tìm hiểu thêm
                    </Button>
                  </div>
                </div>

                <div className={styles.imageWrapper}>
                  <div className={styles.glowCircle} />
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className={styles.heroImage}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
}
