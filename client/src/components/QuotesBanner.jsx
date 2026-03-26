import React, { useState, useEffect } from 'react';

const SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=70&fm=webp&fit=crop',
    quote: 'The Earth does not belong to us. We belong to the Earth.',
    author: 'Chief Seattle',
  },
  {
    img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200&q=70&fm=webp&fit=crop',
    quote: 'We do not inherit the Earth from our ancestors — we borrow it from our children.',
    author: 'Native American Proverb',
  },
  {
    img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=70&fm=webp&fit=crop',
    quote: 'A clean city is a reflection of a conscious community.',
    author: 'CleaNova',
  },
  {
    img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=70&fm=webp&fit=crop',
    quote: 'Small acts, when multiplied by millions of people, can transform the world.',
    author: 'Howard Zinn',
  },
];

export default function QuotesBanner() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % SLIDES.length);
        setFading(false);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[idx];

  return (
    <div className="relative rounded-3xl overflow-hidden h-40 sm:h-48 card-3d">
      {/* Background image */}
      <img
        src={slide.img}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transition: 'opacity 0.4s', opacity: fading ? 0 : 1 }}
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-transparent" />

      {/* Quote text */}
      <div
        className="relative h-full flex flex-col justify-center px-6 sm:px-8"
        style={{ transition: 'opacity 0.4s', opacity: fading ? 0 : 1 }}
      >
        <svg className="w-6 h-6 text-emerald-400 mb-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <p className="text-white font-bold text-sm sm:text-base leading-snug max-w-lg line-clamp-2">
          {slide.quote}
        </p>
        <p className="text-emerald-300 text-xs font-semibold mt-2">— {slide.author}</p>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFading(true); setTimeout(() => { setIdx(i); setFading(false); }, 400); }}
            className={`rounded-full transition-all duration-300 ${i === idx ? 'w-4 h-1.5 bg-emerald-400' : 'w-1.5 h-1.5 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
