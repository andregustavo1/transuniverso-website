import { useEffect, useState } from "react";

const TopProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const winHeight = window.innerHeight;
      const total = Math.max(docHeight - winHeight, 1);
      const pct = Math.min(100, Math.max(0, (scrollTop / total) * 100));
      setProgress(pct);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div style={{ position: "fixed", left: 0, top: 0, right: 0, height: 2, zIndex: 9999 }}>
      <div
        aria-hidden
        style={{
          height: 2,
          width: `${progress}%`,
          backgroundColor: "#dc2626", // red-600
          transition: "width 150ms linear",
          transformOrigin: "left",
        }}
      />
    </div>
  );
};

export default TopProgress;
