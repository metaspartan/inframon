// Copyright 2024 Carsen Klock
// Licensed under the MIT License
// https://github.com/carsenk/inframon
// system_info.ts - Handles system information and device capabilities

import { spawn } from 'child_process';
import { DeviceFlops, DeviceCapabilities } from './src/types';
import os from 'os';
// import { logger } from './src/lib/logger';

// logger;
const isMacOS = os.platform() === 'darwin';
const isLinux = os.platform() === 'linux';

// TFLOPS is a constant that represents the number of FLOPS in a single second
// 1 TFLOPS = 1,000,000,000,000 FLOPS
// Credits to https://github.com/exo-explore/exo for the chip flops data
const TFLOPS = 1.00;
const CHIP_FLOPS: Record<string, DeviceFlops> = {
  // M chips
  "Apple M1": { fp32: 2.29*TFLOPS, fp16: 4.58*TFLOPS, int8: 9.16*TFLOPS },
  "Apple M1 Pro": { fp32: 5.30*TFLOPS, fp16: 10.60*TFLOPS, int8: 21.20*TFLOPS },
  "Apple M1 Max": { fp32: 10.60*TFLOPS, fp16: 21.20*TFLOPS, int8: 42.40*TFLOPS },
  "Apple M1 Ultra": { fp32: 21.20*TFLOPS, fp16: 42.40*TFLOPS, int8: 84.80*TFLOPS },
  "Apple M2": { fp32: 3.55*TFLOPS, fp16: 7.10*TFLOPS, int8: 14.20*TFLOPS },
  "Apple M2 Pro": { fp32: 5.68*TFLOPS, fp16: 11.36*TFLOPS, int8: 22.72*TFLOPS },
  "Apple M2 Max": { fp32: 13.49*TFLOPS, fp16: 26.98*TFLOPS, int8: 53.96*TFLOPS },
  "Apple M2 Ultra": { fp32: 26.98*TFLOPS, fp16: 53.96*TFLOPS, int8: 107.92*TFLOPS },
  "Apple M3": { fp32: 3.55*TFLOPS, fp16: 7.10*TFLOPS, int8: 14.20*TFLOPS },
  "Apple M3 Pro": { fp32: 4.97*TFLOPS, fp16: 9.94*TFLOPS, int8: 19.88*TFLOPS },
  "Apple M3 Max": { fp32: 14.20*TFLOPS, fp16: 28.40*TFLOPS, int8: 56.80*TFLOPS },
  "Apple M4": { fp32: 4.26*TFLOPS, fp16: 8.52*TFLOPS, int8: 17.04*TFLOPS },
  "Apple M4 Pro": { fp32: 5.72*TFLOPS, fp16: 11.44*TFLOPS, int8: 22.88*TFLOPS },
  "Apple M4 Max": { fp32: 18.03*TFLOPS, fp16: 36.07*TFLOPS, int8: 72.14*TFLOPS },

  // A chips
  "Apple A13 Bionic": { fp32: 0.69*TFLOPS, fp16: 1.38*TFLOPS, int8: 2.76*TFLOPS },
  "Apple A14 Bionic": { fp32: 0.75*TFLOPS, fp16: 1.50*TFLOPS, int8: 3.00*TFLOPS },
  "Apple A15 Bionic": { fp32: 1.37*TFLOPS, fp16: 2.74*TFLOPS, int8: 5.48*TFLOPS },
  "Apple A16 Bionic": { fp32: 1.79*TFLOPS, fp16: 3.58*TFLOPS, int8: 7.16*TFLOPS },
  "Apple A17 Pro": { fp32: 2.15*TFLOPS, fp16: 4.30*TFLOPS, int8: 8.60*TFLOPS },

  // NVIDIA RTX 40 series
  "NVIDIA GEFORCE RTX 4090": { fp32: 82.58*TFLOPS, fp16: 165.16*TFLOPS, int8: 330.32*TFLOPS },
  "NVIDIA GEFORCE RTX 4080": { fp32: 48.74*TFLOPS, fp16: 97.48*TFLOPS, int8: 194.96*TFLOPS },
  "NVIDIA GEFORCE RTX 4080 SUPER": { fp32: 52.0*TFLOPS, fp16: 104.0*TFLOPS, int8: 208.0*TFLOPS },
  "NVIDIA GEFORCE RTX 4070 TI SUPER": { fp32: 40.0*TFLOPS, fp16: 80.0*TFLOPS, int8: 160.0*TFLOPS },
  "NVIDIA GEFORCE RTX 4070 TI": { fp32: 39.43*TFLOPS, fp16: 78.86*TFLOPS, int8: 157.72*TFLOPS },
  "NVIDIA GEFORCE RTX 4070 SUPER": { fp32: 30.0*TFLOPS, fp16: 60.0*TFLOPS, int8: 120.0*TFLOPS },
  "NVIDIA GEFORCE RTX 4070": { fp32: 29.0*TFLOPS, fp16: 58.0*TFLOPS, int8: 116.0*TFLOPS },
  "NVIDIA GEFORCE RTX 4060 TI 16GB": { fp32: 22.0*TFLOPS, fp16: 44.0*TFLOPS, int8: 88.0*TFLOPS },
  "NVIDIA GEFORCE RTX 4060 TI": { fp32: 22.0*TFLOPS, fp16: 44.0*TFLOPS, int8: 88.0*TFLOPS },

  // NVIDIA RTX 30 series
  "NVIDIA GEFORCE RTX 3050": { fp32: 9.11*TFLOPS, fp16: 18.22*TFLOPS, int8: 36.44*TFLOPS },
  "NVIDIA GEFORCE RTX 3060": { fp32: 13.0*TFLOPS, fp16: 26.0*TFLOPS, int8: 52.0*TFLOPS },
  "NVIDIA GEFORCE RTX 3060 TI": { fp32: 16.2*TFLOPS, fp16: 32.4*TFLOPS, int8: 64.8*TFLOPS },
  "NVIDIA GEFORCE RTX 3070": { fp32: 20.3*TFLOPS, fp16: 40.6*TFLOPS, int8: 81.2*TFLOPS },
  "NVIDIA GEFORCE RTX 3070 TI": { fp32: 21.8*TFLOPS, fp16: 43.6*TFLOPS, int8: 87.2*TFLOPS },
  "NVIDIA GEFORCE RTX 3080 (10 GB)": { fp32: 29.8*TFLOPS, fp16: 59.6*TFLOPS, int8: 119.2*TFLOPS },
  "NVIDIA GEFORCE RTX 3080 (12 GB)": { fp32: 30.6*TFLOPS, fp16: 61.2*TFLOPS, int8: 122.4*TFLOPS },
  "NVIDIA GEFORCE RTX 3080 TI": { fp32: 34.1*TFLOPS, fp16: 68.2*TFLOPS, int8: 136.4*TFLOPS },
  "NVIDIA GEFORCE RTX 3090": { fp32: 35.6*TFLOPS, fp16: 71.2*TFLOPS, int8: 142.4*TFLOPS },
  "NVIDIA GEFORCE RTX 3090 TI": { fp32: 40.0*TFLOPS, fp16: 80.0*TFLOPS, int8: 160.0*TFLOPS },

  // NVIDIA RTX 20 series
  "NVIDIA GEFORCE RTX 2060": { fp32: 6.45*TFLOPS, fp16: 12.9*TFLOPS, int8: 25.8*TFLOPS },
  "NVIDIA GEFORCE RTX 2060 SUPER": { fp32: 7.2*TFLOPS, fp16: 14.4*TFLOPS, int8: 28.8*TFLOPS },
  "NVIDIA GEFORCE RTX 2070": { fp32: 7.46*TFLOPS, fp16: 14.93*TFLOPS, int8: 29.86*TFLOPS },
  "NVIDIA GEFORCE RTX 2070 SUPER": { fp32: 9.06*TFLOPS, fp16: 18.12*TFLOPS, int8: 36.24*TFLOPS },
  "NVIDIA GEFORCE RTX 2080": { fp32: 10.07*TFLOPS, fp16: 20.14*TFLOPS, int8: 40.28*TFLOPS },
  "NVIDIA GEFORCE RTX 2080 TI": { fp32: 13.45*TFLOPS, fp16: 26.9*TFLOPS, int8: 40.28*TFLOPS },
  "NVIDIA GEFORCE RTX 2080 SUPER": { fp32: 11.15*TFLOPS, fp16: 22.30*TFLOPS, int8: 44.60*TFLOPS },
  "NVIDIA TITAN RTX": { fp32: 16.31*TFLOPS, fp16: 32.62*TFLOPS, int8: 65.24*TFLOPS },

  // NVIDIA GTX series
  "NVIDIA GEFORCE GTX 1050 TI": { fp32: 2.0*TFLOPS, fp16: 4.0*TFLOPS, int8: 8.0*TFLOPS },
  "NVIDIA GeForce GTX 1660 TI": { fp32: 4.8*TFLOPS, fp16: 9.6*TFLOPS, int8: 19.2*TFLOPS },

  // NVIDIA Professional
  "NVIDIA RTX A2000": { fp32: 7.99*TFLOPS, fp16: 7.99*TFLOPS, int8: 31.91*TFLOPS },
  "NVIDIA RTX A4000": { fp32: 19.17*TFLOPS, fp16: 19.17*TFLOPS, int8: 76.68*TFLOPS },
  "NVIDIA RTX A4500": { fp32: 23.65*TFLOPS, fp16: 23.65*TFLOPS, int8: 94.6*TFLOPS },
  "NVIDIA RTX A5000": { fp32: 27.8*TFLOPS, fp16: 27.8*TFLOPS, int8: 111.2*TFLOPS },
  "NVIDIA RTX A6000": { fp32: 38.71*TFLOPS, fp16: 38.71*TFLOPS, int8: 154.84*TFLOPS },
  "NVIDIA RTX 4000 ADA GENERATION": { fp32: 26.7*TFLOPS, fp16: 26.7*TFLOPS, int8: 258.0*TFLOPS },

  // NVIDIA Data Center
  "NVIDIA A40 48GB PCIE": { fp32: 37.4*TFLOPS, fp16: 149.7*TFLOPS, int8: 299.3*TFLOPS },
  // TODO: These need real data
  "NVIDIA A100 40GB PCIE": { fp32: 19.5*TFLOPS, fp16: 312.0*TFLOPS, int8: 624.0*TFLOPS },
  "NVIDIA A800 40GB PCIE": { fp32: 19.5*TFLOPS, fp16: 312.0*TFLOPS, int8: 624.0*TFLOPS },
  "NVIDIA A100 80GB PCIE": { fp32: 19.5*TFLOPS, fp16: 312.0*TFLOPS, int8: 624.0*TFLOPS },
  "NVIDIA A800 80GB PCIE": { fp32: 19.5*TFLOPS, fp16: 312.0*TFLOPS, int8: 624.0*TFLOPS },
  "NVIDIA A100 80GB SXM": { fp32: 19.5*TFLOPS, fp16: 312.0*TFLOPS, int8: 624.0*TFLOPS },
  "NVIDIA A800 80GB SXM": { fp32: 19.5*TFLOPS, fp16: 312.0*TFLOPS, int8: 624.0*TFLOPS },

  // AMD RX 6000 series
  "AMD Radeon RX 6900 XT": { fp32: 23.04*TFLOPS, fp16: 46.08*TFLOPS, int8: 92.16*TFLOPS },
  "AMD Radeon RX 6800 XT": { fp32: 20.74*TFLOPS, fp16: 41.48*TFLOPS, int8: 82.96*TFLOPS },
  "AMD Radeon RX 6800": { fp32: 16.17*TFLOPS, fp16: 32.34*TFLOPS, int8: 64.68*TFLOPS },
  "AMD Radeon RX 6700 XT": { fp32: 13.21*TFLOPS, fp16: 26.42*TFLOPS, int8: 52.84*TFLOPS },
  "AMD Radeon RX 6700": { fp32: 11.4*TFLOPS, fp16: 22.8*TFLOPS, int8: 45.6*TFLOPS },
  "AMD Radeon RX 6600 XT": { fp32: 10.6*TFLOPS, fp16: 21.2*TFLOPS, int8: 42.4*TFLOPS },
  "AMD Radeon RX 6600": { fp32: 8.93*TFLOPS, fp16: 17.86*TFLOPS, int8: 35.72*TFLOPS },
  "AMD Radeon RX 6500 XT": { fp32: 5.77*TFLOPS, fp16: 11.54*TFLOPS, int8: 23.08*TFLOPS },
  "AMD Radeon RX 6400": { fp32: 3.57*TFLOPS, fp16: 7.14*TFLOPS, int8: 14.28*TFLOPS },

  // AMD RX 7000 series
  "AMD Radeon RX 7900 XTX": { fp32: 61.4*TFLOPS, fp16: 122.8*TFLOPS, int8: 245.6*TFLOPS },
  "AMD Radeon RX 7900 XT": { fp32: 53.4*TFLOPS, fp16: 106.8*TFLOPS, int8: 213.6*TFLOPS },
  "AMD Radeon RX 7800 XT": { fp32: 42.6*TFLOPS, fp16: 85.2*TFLOPS, int8: 170.4*TFLOPS },
  "AMD Radeon RX 7700 XT": { fp32: 34.2*TFLOPS, fp16: 68.4*TFLOPS, int8: 136.8*TFLOPS },
  "AMD Radeon RX 7600": { fp32: 21.5*TFLOPS, fp16: 43.0*TFLOPS, int8: 86.0*TFLOPS },
  "AMD Radeon RX 7500": { fp32: 16.2*TFLOPS, fp16: 32.4*TFLOPS, int8: 64.8*TFLOPS }
};

// Add laptop variants
Object.keys(CHIP_FLOPS).forEach(key => {
  CHIP_FLOPS[`LAPTOP GPU ${key}`] = CHIP_FLOPS[key];
  CHIP_FLOPS[`Laptop GPU ${key}`] = CHIP_FLOPS[key];
  CHIP_FLOPS[`${key} LAPTOP GPU`] = CHIP_FLOPS[key];
  CHIP_FLOPS[`${key} Laptop GPU`] = CHIP_FLOPS[key];
});

async function executeCommand(command: string, asUser: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    // get current user
    const user = os.userInfo().username;
    // const uid = process?.getuid?.();
    console.log('Running command as user:', user);
    if (asUser) {
      command = `su - ${user} -c "${command}"`;
    }
    const proc = spawn('sh', ['-c', command]);
    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
      } else {
        resolve(output.trim());
      }
    });
  });
}

// At the top of the file with other interfaces
interface GPUState {
  hasNVIDIA: boolean;
  hasAMD: boolean;
  initialized: boolean;
}

// Global GPU state
let gpuState: GPUState = {
  hasNVIDIA: false,
  hasAMD: false,
  initialized: false
};

// Initialize GPU detection once
export async function initializeGPUState() {
  if (gpuState.initialized) return;

  try {
    // Check NVIDIA
    try {
      const output = await executeCommand('nvidia-smi --query-gpu=name --format=csv,noheader,nounits');
      gpuState.hasNVIDIA = output.includes('NVIDIA');
      console.log('NVIDIA GPU detected:', output.trim());
    } catch (error) {
      gpuState.hasNVIDIA = false;
      console.log('No NVIDIA GPU available');
    }

    // Check AMD
    try {
      const output = await executeCommand('rocm-smi --showproductname');
      gpuState.hasAMD = output.includes('AMD') || output.includes('Radeon');
      console.log('AMD GPU detected:', output.trim());
    } catch (error) {
      gpuState.hasAMD = false;
      console.log('No AMD GPU available');
    }
  } finally {
    gpuState.initialized = true;
  }
}

// async function getTurbostatPower(): Promise<number> {
//   try {
//     const output = await executeCommand('sudo turbostat --Summary --quiet --show PkgWatt --interval 1');
//     const lines = output.trim().split('\n');
//     if (lines.length >= 2) {
//       // Get the second line (first measurement after header)
//       const powerValue = parseFloat(lines[1]);
//       return isNaN(powerValue) ? 0 : powerValue;
//     }
//     return 0;
//   } catch (error) {
//     console.error('Error getting turbostat power:', error);
//     return 0;
//   }
// }

export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  if (isMacOS) {
    try {
      const model = await executeCommand('system_profiler SPHardwareDataType');
      const modelMatch = model.match(/Model Name: (.+)/);
      const chipMatch = model.match(/Chip: (.+)/);
      const memoryMatch = model.match(/Memory: (\d+) (GB|MB)/);
      
      const modelId = modelMatch ? modelMatch[1].trim() : 'Unknown Model';
      const chipId = chipMatch ? chipMatch[1].trim() : 'Unknown Chip';
      let memory = 0;
      
      if (memoryMatch) {
        const value = parseInt(memoryMatch[1]);
        memory = memoryMatch[2] === 'GB' ? value * 1024 : value;
      }

      return {
        model: modelId,
        chip: chipId,
        memory,
        flops: CHIP_FLOPS[chipId] || { fp32: 0, fp16: 0, int8: 0 }
      };
    } catch (error) {
      console.error('Error getting device capabilities:', error);
      return {
        model: 'Unknown Model',
        chip: 'Unknown Chip',
        memory: 0,
        flops: { fp32: 0, fp16: 0, int8: 0 }
      };
    }
  } else if (isLinux) {
    try {
      // Check for NVIDIA GPU
      if (gpuState.hasNVIDIA) {
        const output = await executeCommand('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader');
        const [name, memoryStr] = output.split(',').map(s => s.trim());
        const memory = parseInt(memoryStr);

        const normalizedName = name.toUpperCase()
        .replace(/\s+/g, ' ')
        .trim();
        
        return {
          model: `Linux Box (${name})`,
          chip: normalizedName,
          memory,
          flops: CHIP_FLOPS[normalizedName] || { fp32: 0, fp16: 0, int8: 0 }
        };
      }
      
      // Check for AMD GPU
      if (gpuState.hasAMD) {
        // Add AMD detection logic here
        return {
          model: 'Linux Box (AMD)',
          chip: 'Unknown AMD',
          memory: 0,
          flops: { fp32: 0, fp16: 0, int8: 0 }
        };
      }
    } catch (error) {
      console.error('Error getting device capabilities:', error);
    }
  }
  
  return {
    model: 'Unknown Device',
    chip: 'Unknown Chip',
    memory: 0,
    flops: { fp32: 0, fp16: 0, int8: 0 }
  };
}

export async function getPowerUsage(): Promise<number> {
  if (isLinux) {
    try {
      let totalPower = 0;
      
      // Get CPU power from turbostat
      // const cpuPower = await getTurbostatPower();
      const cpuPower = 0; // TODO: fix this
      totalPower += cpuPower;

      // Check for AMD GPU
      if (gpuState.hasAMD) {
        try {
          // Switching to use power1_input for AMD power usage
          const output = await executeCommand('cat /sys/class/hwmon/hwmon*/power1_input');
          const microwatts = parseInt(output, 10);
          const gpuPower = isNaN(microwatts) ? 0 : microwatts / 1_000_000;
          totalPower += gpuPower;

          // Use rocm-smi to get power usage in watts
          // const output = await executeCommand('rocm-smi --showpower');
          // const match = output.match(/Current Socket Graphics Package Power \(W\):\s*(\d+\.\d+)/);
          // const gpuPower = match ? parseFloat(match[1]) : 0;

        } catch (error) {
          console.error('Error getting AMD power usage:', error);
        }
      }

      // Check for NVIDIA GPU
      if (gpuState.hasNVIDIA) {
        try {
          const output = await executeCommand('nvidia-smi --query-gpu=power.draw --format=csv,noheader,nounits');
          const gpuPower = parseFloat(output.trim()); // Add trim() to remove any whitespace
          if (!isNaN(gpuPower)) {
            totalPower += gpuPower;
          }
        } catch (error) {
          console.error('Error getting NVIDIA power usage:', error);
        }
      }

      return totalPower;
    } catch (error) {
      console.error('Error getting power usage:', error);
      return 0;
    }
  } else if (isMacOS) {
    try {
      // Run powermetrics with a brief sample to get power data
      const output = await executeCommand('sudo powermetrics -n 1 -i 1000 --samplers cpu_power');
      // Parse the CPU package power from the output (now in milliwatts)
      const packageMatch = output.match(/Combined Power \(CPU \+ GPU \+ ANE\): (\d+) mW/);
      if (packageMatch) {
        return parseFloat((Number(packageMatch[1]) / 1000).toFixed(2)); // Convert mW to W and round to 2 decimal places  
      }
      return 0;
    } catch (error) {
      console.error('Error getting power usage:', error);
      return 0;
    }
  }
  return 0;
}

export async function getCpuUsage(): Promise<number> {
  if (isLinux) {
    try {
      const output = await executeCommand("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'");
      return parseFloat(output);
    } catch (error) {
      console.error('Error getting CPU usage:', error);
      return 0;
    }
  } else if (isMacOS) {
    try {
      const output = await executeCommand("top -l 1 | grep 'CPU usage' | awk '{print $3}' | cut -d'%' -f1");
      return parseFloat(output);
    } catch (error) {
      console.error('Error getting CPU usage:', error);
      return 0;
    }
  }
  return 0;
}

export async function getMemoryUsage(): Promise<number> {
  if (isLinux) {
    try {
      const output = await executeCommand("free | grep Mem | awk '{print $3/$2 * 100.0}'");
      return parseFloat(output);
    } catch (error) {
      console.error('Error getting memory usage:', error);
      return 0;
    }
  } else if (isMacOS) {
    try {
      // Get page size and memory stats using vm_stat
      const vmStatOutput = await executeCommand('vm_stat');
      
      // Parse page size
      const pageSizeMatch = vmStatOutput.match(/page size of (\d+) bytes/);
      const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1], 10) : 16384; // Default to 16KB if not found

      // Parse memory pages
      const pages: { [key: string]: number } = {};
      vmStatOutput.split('\n').forEach(line => {
        const match = line.match(/Pages\s+(free|active|inactive|speculative|throttled|wired down|compressor):\s+(\d+)/);
        if (match) {
          pages[match[1]] = parseInt(match[2], 10);
        }
      });

      // Calculate used memory using the same formula as getUsedMemory
      const used = (
        (pages['active'] || 0) + 
        (pages['wired down'] || 0) + 
        (pages['occupied by compressor'] || 0) +
        (pages['File-backed'] || 0) +
        (pages['Anonymous'] || 0) +
        (pages['speculative'] || 0) + 
        (pages['throttled'] || 0)
      ) * pageSize;

      // Get total memory
      const totalMemory = parseInt(await executeCommand("sysctl -n hw.memsize"), 10);

      // Calculate percentage
      return (used / totalMemory) * 100;
    } catch (error) {
      console.error('Error getting memory usage:', error);
      return 0;
    }
  }
  return 0;
}

export async function getLocalIp(): Promise<string> {
  if (isLinux) {
    try {
      const output = await executeCommand("hostname -I | awk '{print $1}'");
      return output.trim();
    } catch (error) {
      console.error('Error getting local IP:', error);
      return 'Unknown';
    }
  } else if (isMacOS) {
    try {
      const output = await executeCommand("ipconfig getifaddr en0 || ipconfig getifaddr en1");
      return output.trim();
    } catch (error) {
      console.error('Error getting local IP:', error);
      return 'Unknown';
    }
  }
  return 'Unknown';
}

export async function changeHostname(newHostname: string): Promise<void> {
  if (isLinux) {
    await executeCommand(`sudo hostnamectl set-hostname ${newHostname}`);
  } else if (isMacOS) {
    await executeCommand(`sudo scutil --set HostName ${newHostname}`);
  }
}

export async function isCloudflaredRunning(): Promise<boolean> {
  if (isLinux) {
    try {
      await executeCommand('pgrep cloudflared');
      return true;
    } catch (error) {
      return false;
    }
  } else if (isMacOS) {
    try {
      await executeCommand('pgrep -x cloudflared');
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

export async function getTotalMemory(): Promise<number> {
  if (isLinux) {
    try {
      const output = await executeCommand("free -b | awk '/Mem:/ {print $2}'");
      return parseInt(output, 10) / (1024 * 1024 * 1024);
    } catch (error) {
      console.error('Error getting total memory:', error);
      return 0;
    }
  } else if (isMacOS) {
    try {
      const output = await executeCommand("sysctl -n hw.memsize");
      return parseInt(output, 10) / (1024 * 1024 * 1024);
    } catch (error) {
      console.error('Error getting total memory:', error);
      return 0;
    }
  }
  return 0;
}

export async function getUsedMemory(): Promise<number> {
  if (isLinux) {
    try {
      const output = await executeCommand("free -b | awk '/Mem:/ {print $3}'");
      return parseInt(output, 10) / (1024 * 1024 * 1024);
    } catch (error) {
      console.error('Error getting used memory:', error);
      return 0;
    }
  } else if (isMacOS) {
    try {
      // Get page size and memory stats using vm_stat
      const vmStatOutput = await executeCommand('vm_stat');
      
      // Parse page size
      const pageSizeMatch = vmStatOutput.match(/page size of (\d+) bytes/);
      const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1], 10) : 16384; // Default to 16KB if not found

      // Parse memory pages
      const pages: { [key: string]: number } = {};
      vmStatOutput.split('\n').forEach(line => {
        const match = line.match(/Pages\s+(free|active|inactive|speculative|throttled|wired down|compressor):\s+(\d+)/);
        if (match) {
          pages[match[1]] = parseInt(match[2], 10);
        }
      });

      // Calculate used memory (active + wired + compressed + speculative + throttled)
      const used = (
        (pages['active'] || 0) + 
        (pages['wired down'] || 0) + 
        (pages['occupied by compressor'] || 0) +
        (pages['File-backed'] || 0) +
        (pages['Anonymous'] || 0) +
        (pages['speculative'] || 0) + 
        (pages['throttled'] || 0)
      ) * pageSize;

      return used / (1024 * 1024 * 1024); // Convert to GB
    } catch (error) {
      console.error('Error getting used memory:', error);
      return 0;
    }
  }
  return 0;
}

export async function getCpuCoreCount(): Promise<number> {
  if (isLinux) {
    try {
      const output = await executeCommand("nproc");
      return parseInt(output, 10);
    } catch (error) {
      console.error('Error getting CPU core count:', error);
      return 0;
    }
  } else if (isMacOS) {
    try {
      const output = await executeCommand("sysctl -n hw.ncpu");
      return parseInt(output, 10);
    } catch (error) {
      console.error('Error getting CPU core count:', error);
      return 0;
    }
  }
  return 0;
}

export async function getNetworkTraffic(): Promise<{ rx: number; tx: number }> {
  if (isLinux) {
    try {
      const output = await executeCommand("cat /proc/net/dev | grep -v 'lo:' | awk '{rx += $2; tx += $10} END {print rx \",\" tx}'");
      const [rx, tx] = output.split(',').map(val => parseInt(val, 10) / (1024 * 1024));
      return { rx, tx };
    } catch (error) {
      console.error('Error getting network traffic:', error);
      return { rx: 0, tx: 0 };
    }
  } else if (isMacOS) {
    try {
      const output = await executeCommand("netstat -ib | grep -e 'en0' -e 'en1' | awk '{rx += $7; tx += $10} END {print rx \",\" tx}'");
      const [rx, tx] = output.split(',').map(val => parseInt(val, 10) / (1024 * 1024));
      return { rx, tx };
    } catch (error) {
      console.error('Error getting network traffic:', error);
      return { rx: 0, tx: 0 };
    }
  }
  return { rx: 0, tx: 0 };
}

export async function getSystemName(): Promise<string> {
  try {
    const output = await executeCommand("hostname");
    return output.trim();
  } catch (error) {
    console.error('Error getting system name:', error);
    return 'Unknown';
  }
}

export async function getOs(): Promise<string> {
  if (isLinux) {
    return 'Linux';
  } else if (isMacOS) {
    return 'macOS';
  }
  return 'Unknown';
}

export async function getUptime(): Promise<string> {
  if (isLinux) {
    try {
      const output = await executeCommand("uptime -p");
      return output.trim();
    } catch (error) {
      console.error('Error getting uptime:', error);
      return 'Unknown';
    }
  } else if (isMacOS) {
    try {
      const output = await executeCommand("sysctl -n kern.boottime | awk '{print $4}' | tr -d ','");
      const bootTime = parseInt(output, 10);
      const uptime = Math.floor(Date.now() / 1000) - bootTime;
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      return `up ${days} days, ${hours} hours, ${minutes} minutes`;
    } catch (error) {
      console.error('Error getting uptime:', error);
      return 'Unknown';
    }
  }
  return 'Unknown';
}

export async function getCpuModel(): Promise<string> {
  if (isLinux) {
    try {
      const output = await executeCommand("lscpu | grep 'Model name' | awk -F': ' '{print $2}'");
      return output.trim();
    } catch (error) {
      console.error('Error getting CPU model:', error);
      return 'Unknown';
    }
  } else if (isMacOS) {
    try {
      const output = await executeCommand("sysctl -n machdep.cpu.brand_string");
      return output.trim();
    } catch (error) {
      console.error('Error getting CPU model:', error);
      return 'Unknown';
    }
  }
  return 'Unknown';
}


export async function getStorageInfo(): Promise<{ total: number; used: number; available: number }> {
  if (isLinux) {
    try {
      const output = await executeCommand("df -B1 / | tail -1 | awk '{print $2,$3,$4}'");
      const [total, used, available] = output.split(' ').map(Number);
      return {
        total: total / (1024 * 1024 * 1024),
        used: used / (1024 * 1024 * 1024),
        available: available / (1024 * 1024 * 1024)
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { total: 0, used: 0, available: 0 };
    }
  } else if (isMacOS) {
    try {
      const output = await executeCommand("df -k / | tail -1 | awk '{print $2,$3,$4}'");
      const [total, used, available] = output.split(' ').map(n => parseInt(n) * 1024); // Convert from KB to bytes
      return {
        total: total / (1024 * 1024 * 1024),
        used: (total - available) / (1024 * 1024 * 1024),
        available: available / (1024 * 1024 * 1024)
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { total: 0, used: 0, available: 0 };
    }
  }
  return { total: 0, used: 0, available: 0 };
}

export async function getGpuUsage(): Promise<number> {
  if (isMacOS) {
    try {
      const output = await executeCommand('sudo powermetrics -n 1 -i 1000 --samplers gpu_power --show-process-gpu');
      
      // Parse GPU active residency
      const activeMatch = output.match(/(?:GPU active|GPU HW active) residency:\s+(\d+(\.\d+)?)/);
      if (activeMatch) {
        return parseFloat(activeMatch[1]);
      }
      return 0;
    } catch (error) {
      console.error('Error getting GPU usage:', error);
      return 0;
    }
  } else if (isLinux) {
    try {
      // Check for AMD first
      if (gpuState.hasAMD) {
        try {
          const output = await executeCommand('rocm-smi --showuse');
          const match = output.match(/GPU use \(%\):\s*(\d+)/);
          return match ? parseFloat(match[1]) : 0;
        } catch (error) {
          console.error('Error getting AMD GPU usage:', error);
        }
      }

      // Check for NVIDIA
      if (gpuState.hasNVIDIA) {
        try {
          const output = await executeCommand('nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits');
          const usage = parseInt(output.trim(), 10);
          console.log('NVIDIA GPU usage', usage);
          if (!isNaN(usage)) {
            return usage; // Return the whole number directly
          }
        } catch (error) {
          console.error('Error getting NVIDIA GPU usage:', error);
        }
      }

      return 0;
    } catch (error) {
      console.error('Error getting GPU usage:', error);
      return 0;
    }
  }
  return 0;
}

export async function getGpuCoreCount(): Promise<number> {
  if (isMacOS) {
    try {
      const output = await executeCommand('system_profiler -detailLevel basic SPDisplaysDataType');
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('Total Number of Cores')) {
          const parts = line.split(':');
          if (parts.length > 1) {
            const cores = parseInt(parts[1].trim(), 10);
            return isNaN(cores) ? 0 : cores;
          }
          break;
        }
      }
      return 0;
    } catch (error) {
      console.error('Error getting GPU core count:', error);
      return 0;
    }
  }
  return 0;
}

// get the inframon logs for this node
export async function getInframonLogs(): Promise<string> {
  try {
    const location = process.cwd();
    const stdout = await executeCommand(`cat ${location}/inframon.stdout.log 2>/dev/null || echo "No stdout log file"`);
    const stderr = await executeCommand(`cat ${location}/inframon.stderr.log 2>/dev/null || echo "No stderr log file"`);
    // or other log files
    const out = await executeCommand(`cat ${location}/inframon.out.log 2>/dev/null || echo "No out log file"`);
    const err = await executeCommand(`cat ${location}/inframon.err.log 2>/dev/null || echo "No err log file"`); 
    return `=== STDOUT ===\n${stdout.trim()}\n\n=== STDERR ===\n${stderr.trim()}\n\n=== OUT ===\n${out.trim()}\n\n=== ERR ===\n${err.trim()}`;
  } catch (error) {
    console.error('Error getting inframon logs:', error);
    return 'Unable to retrieve logs';
  }
}

// export async function getNvmeInfo(): Promise<{ total: number; used: number }> {
//   try {
//     const output = await executeCommand("df -B1 /dev/nvme0n1p1 | tail -1 | awk '{print $2,$3}'");
//     const [total, used] = output.split(' ').map(Number);
//     return {
//       total: total / (1024 * 1024 * 1024), // Convert to GB
//       used: used / (1024 * 1024 * 1024)
//     };
//   } catch (error) {
//     console.error('Error getting NVME info:', error);
//     return { total: 0, used: 0 };
//   }
// }