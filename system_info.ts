import { spawn } from 'child_process';
import os from 'os';

const isMacOS = os.platform() === 'darwin';
const isLinux = os.platform() === 'linux';

async function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn('sh', ['-c', command]);
    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
      } else {
        resolve(output.trim());
      }
    });
  });
}

const isAMD = async (): Promise<boolean> => {
  try {
    const output = await executeCommand('lspci | grep -i amd');
    return output.toLowerCase().includes('amd') || output.toLowerCase().includes('radeon');
  } catch (error) {
    return false;
  }
};

const isNVIDIA = async (): Promise<boolean> => {
  try {
    const output = await executeCommand('lspci | grep -i nvidia');
    return output.toLowerCase().includes('nvidia');
  } catch (error) {
    return false;
  }
};

async function getTurbostatPower(): Promise<number> {
  try {
    const output = await executeCommand('sudo turbostat --Summary --quiet --show PkgWatt --interval 1');
    const lines = output.trim().split('\n');
    if (lines.length >= 2) {
      // Get the second line (first measurement after header)
      const powerValue = parseFloat(lines[1]);
      return isNaN(powerValue) ? 0 : powerValue;
    }
    return 0;
  } catch (error) {
    console.error('Error getting turbostat power:', error);
    return 0;
  }
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
      const isAMDGPU = await isAMD();
      if (isAMDGPU) {
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
          totalPower += gpuPower;
        } catch (error) {
          console.error('Error getting AMD power usage:', error);
        }
      }

      // Check for NVIDIA GPU
      const isNVIDIAGPU = await isNVIDIA();
      if (isNVIDIAGPU) {
        try {
          const output = await executeCommand('nvidia-smi --query-gpu=power.draw --format=csv,noheader,nounits');
          const gpuPower = parseFloat(output);
          totalPower += isNaN(gpuPower) ? 0 : gpuPower;
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
      const isAMDGPU = await isAMD();
      if (isAMDGPU) {
        try {
          const output = await executeCommand('rocm-smi --showuse');
          const match = output.match(/GPU use \(%\):\s*(\d+)/);
          return match ? parseFloat(match[1]) : 0;
        } catch (error) {
          console.error('Error getting AMD GPU usage:', error);
        }
      }

      // Check for NVIDIA
      const isNVIDIAGPU = await isNVIDIA();
      if (isNVIDIAGPU) {
        try {
          const output = await executeCommand('nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits');
          return parseFloat(output);
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