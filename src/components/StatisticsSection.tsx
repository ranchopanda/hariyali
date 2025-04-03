
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

const statistics = [
  { value: 92, label: "Disease Detection Accuracy", suffix: "%" },
  { value: 15, label: "Indian States Supported", suffix: "" },
  { value: 25, label: "Crop Varieties Available", suffix: "+" }
];

const StatisticsSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  return (
    <section 
      ref={ref} 
      className="py-16 bg-kisan-green text-white"
    >
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Empowering Indian Agriculture
          </h2>
          <p className="text-white/80">
            Using technology to revolutionize farming practices across India.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {statistics.map((stat, index) => (
            <div key={index} className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <CounterAnimation value={stat.value} inView={inView} duration={2000} suffix={stat.suffix} />
              <p className="text-kisan-gold font-medium mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CounterAnimation = ({ value, inView, duration, suffix }: { value: number, inView: boolean, duration: number, suffix: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!inView) return;
    
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      
      const elapsedTime = timestamp - startTimeRef.current;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentCount = Math.floor(progress * value);
      
      if (countRef.current !== currentCount) {
        countRef.current = currentCount;
        setCount(currentCount);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    
    return () => {
      startTimeRef.current = null;
    };
  }, [inView, value, duration]);
  
  return (
    <div className="text-3xl md:text-4xl font-bold">
      {count.toLocaleString()}{suffix}
    </div>
  );
};

export default StatisticsSection;
