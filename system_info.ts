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

export async function getPowerUsage(): Promise<number> {
  if (isLinux) {
    try {
      const output = await executeCommand('cat /sys/class/hwmon/hwmon*/power1_input');
      const microwatts = parseInt(output, 10);
      return isNaN(microwatts) ? 0 : microwatts / 1_000_000;
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
  }
  return 0;
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