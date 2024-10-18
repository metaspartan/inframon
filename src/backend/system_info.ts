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

export async function getNetworkTraffic(): Promise<number> {
  try {
    const output = await executeCommand("cat /proc/net/dev | grep -v 'lo:' | awk '{sum += $2 + $10} END {print sum/1024/1024}'");
    return parseFloat(output);
  } catch (error) {
    console.error('Error getting network traffic:', error);
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