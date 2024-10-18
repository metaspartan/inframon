import { spawn } from 'child_process';

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
  try {
    const output = await executeCommand('cat /sys/class/hwmon/hwmon*/power1_input');
    const microwatts = parseInt(output, 10);
    return isNaN(microwatts) ? 0 : microwatts / 1_000_000;
  } catch (error) {
    console.error('Error getting power usage:', error);
    return 0;
  }
}

export async function getCpuUsage(): Promise<number> {
  try {
    const output = await executeCommand("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'");
    return parseFloat(output);
  } catch (error) {
    console.error('Error getting CPU usage:', error);
    return 0;
  }
}

export async function getMemoryUsage(): Promise<number> {
  try {
    const output = await executeCommand("free | grep Mem | awk '{print $3/$2 * 100.0}'");
    return parseFloat(output);
  } catch (error) {
    console.error('Error getting memory usage:', error);
    return 0;
  }
}

export async function getLocalIp(): Promise<string> {
  try {
    const output = await executeCommand("hostname -I | awk '{print $1}'");
    return output.trim();
  } catch (error) {
    console.error('Error getting local IP:', error);
    return 'Unknown';
  }
}

export async function isCloudflaredRunning(): Promise<boolean> {
  try {
    await executeCommand('pgrep cloudflared');
    return true;
  } catch (error) {
    return false;
  }
}

export async function getTotalMemory(): Promise<number> {
  try {
    const output = await executeCommand("free -b | awk '/Mem:/ {print $2}'");
    return parseInt(output, 10) / (1024 * 1024 * 1024); // Convert to GB
  } catch (error) {
    console.error('Error getting total memory:', error);
    return 0;
  }
}

export async function getUsedMemory(): Promise<number> {
  try {
    const output = await executeCommand("free -b | awk '/Mem:/ {print $3}'");
    return parseInt(output, 10) / (1024 * 1024 * 1024); // Convert to GB
  } catch (error) {
    console.error('Error getting used memory:', error);
    return 0;
  }
}

export async function getCpuCoreCount(): Promise<number> {
  try {
    const output = await executeCommand("nproc");
    return parseInt(output, 10);
  } catch (error) {
    console.error('Error getting CPU core count:', error);
    return 0;
  }
}

export async function getNetworkTraffic(): Promise<{ rx: number; tx: number }> {
  try {
    const output = await executeCommand("cat /proc/net/dev | grep -v 'lo:' | awk '{rx += $2; tx += $10} END {print rx \",\" tx}'");
    const [rx, tx] = output.split(',').map(val => parseInt(val, 10) / (1024 * 1024)); // Convert to MB
    return { rx, tx };
  } catch (error) {
    console.error('Error getting network traffic:', error);
    return { rx: 0, tx: 0 };
  }
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

export async function getUptime(): Promise<string> {
  try {
    const output = await executeCommand("uptime -p");
    return output.trim();
  } catch (error) {
    console.error('Error getting uptime:', error);
    return 'Unknown';
  }
}

export async function getCpuModel(): Promise<string> {
  try {
    const output = await executeCommand("lscpu | grep 'Model name' | awk -F': ' '{print $2}'");
    return output.trim();
  } catch (error) {
    console.error('Error getting CPU model:', error);
    return 'Unknown';
  }
}


export async function getStorageInfo(): Promise<{ total: number; used: number; available: number }> {
  try {
    const output = await executeCommand("df -B1 / | tail -1 | awk '{print $2,$3,$4}'");
    const [total, used, available] = output.split(' ').map(Number);
    return {
      total: total / (1024 * 1024 * 1024), // Convert to GB
      used: used / (1024 * 1024 * 1024),
      available: available / (1024 * 1024 * 1024)
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { total: 0, used: 0, available: 0 };
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