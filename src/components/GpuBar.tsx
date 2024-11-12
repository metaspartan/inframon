import { VscChip } from "react-icons/vsc";

// Inspiration from https://github.com/exo-explore/exo 
// Use Inframon to monitor GPU performance from using exo ;)

interface GpuBarProps {
  flops: number; // FP16 TFLOPS value
}

export function GpuBar({ flops }: GpuBarProps) {
  // Use tanh for smooth scaling between 0-1
  const normalizedPos = Math.tanh(flops / 100);
  const percentage = normalizedPos * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>GPU poor</span>
        <span>GPU rich</span>
      </div>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
        <div 
          className="absolute top-0 w-1 h-full bg-white rounded-full transition-all duration-300"
          style={{ left: `calc(${percentage}% - 2px)` }}
        />
      </div>
      <div className="text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center">
          <VscChip className="h-4 w-4 mr-1" /> {flops.toFixed(2)} TFLOPS
        </div>
      </div>
    </div>
  );
}