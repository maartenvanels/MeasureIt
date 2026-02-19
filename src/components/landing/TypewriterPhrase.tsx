'use client';
import { useState, useEffect } from 'react';

const WORDS = ['a photo', 'a 3D model'];

export function TypewriterPhrase() {
  const [displayed, setDisplayed] = useState(WORDS[0]);
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 520);
    return () => clearInterval(id);
  }, []);

  // Typewriter logic
  useEffect(() => {
    const target = WORDS[wordIndex];

    if (!isDeleting && displayed === target) {
      const t = setTimeout(() => setIsDeleting(true), 2400);
      return () => clearTimeout(t);
    }

    if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setWordIndex((i) => (i + 1) % WORDS.length);
      return;
    }

    const delay = isDeleting ? 55 : 95;
    const t = setTimeout(() => {
      setDisplayed(
        isDeleting
          ? target.slice(0, displayed.length - 1)
          : target.slice(0, displayed.length + 1)
      );
    }, delay);
    return () => clearTimeout(t);
  }, [displayed, isDeleting, wordIndex]);

  return (
    <span className="text-rose-500">
      from {displayed}
      <span style={{ opacity: cursorOn ? 1 : 0, transition: 'opacity 0.1s' }}>|</span>
    </span>
  );
}
