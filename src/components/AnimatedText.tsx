import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

interface CharProps {
  char: string;
  start: number;
  end: number;
  progress: MotionValue<number>;
}

function Char({ char, start, end, progress }: CharProps) {
  const opacity = useTransform(progress, [start, end], [0.2, 1]);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {/* invisible placeholder keeps layout/width stable */}
      <span style={{ visibility: 'hidden' }}>{char === ' ' ? '\u00A0' : char}</span>
      <motion.span style={{ position: 'absolute', left: 0, top: 0, opacity }}>
        {char === ' ' ? '\u00A0' : char}
      </motion.span>
    </span>
  );
}

export default function AnimatedText({ text, className, style }: AnimatedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  });

  const characters = Array.from(text);
  const total = characters.length;

  return (
    <p ref={ref} className={className} style={style}>
      {characters.map((char, i) => {
        const start = i / total;
        const end = (i + 1) / total;
        return <Char key={i} char={char} start={start} end={end} progress={scrollYProgress} />;
      })}
    </p>
  );
}
