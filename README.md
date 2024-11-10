# Infra⚡Mon

Inframon Server⚡Monitor is a lightweight, real-time server monitoring application that provides a sleek local dashboard for tracking various system metrics, particularly useful for local server nodes that run `cloudflared` tunnels or clusters of Mac Minis. Written by Carsen Klock (@metaspartan)

This is intended only to be used with Linux AMD machines with ROCm GPU drivers installed OR Apple Silicon Macs (any M-series chip)

![Inframon](dashboard.png)
![Server Monitor Dashboard](screenshotdual.png)

## Features

- Real-time monitoring of CPU usage, memory usage, and power consumption
- System information display (hostname, CPU model, uptime)
- Storage usage visualization
- Historical data charts for CPU, memory, and power usage
- Light and dark mode theme support (Built with Shadcn/UI)
- Local IP address display (with toggle to show/hide)
- Cloudflared status indicator
- GPU usage monitoring for Apple Silicon Macs

## Supported Platforms and Devices

- MacOS (Apple Silicon)
- Linux (x86_64) AMD Ryzen Only (Requires ROCm GPU drivers installed)

## Installation on AMD Linux (Ubuntu Recommended)

1. Clone the repository:
   ```
   git clone https://github.com/metaspartan/servermon.git
   cd servermon
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Build the application:
   ```
   bun run build
   ```

   ```
   bun run compile-master
   ```

   Optional (if running multiple machines on a local network):
   ```
   bun run compile-node
   ```

4. Setup the master server:

```
sudo IS_MASTER=true bun run servermon.ts
```

For running multiple machines on a local network:
(Repeat steps 1-3 for each node server, replacing `192.168.1.250` with your master server's local IP address, and master runs on port 3899)

4. Setup the node server (replace `192.168.1.250` with your master server's local IP address), master runs on port 3899:

```
sudo IS_MASTER=false MASTER_URL=http://192.168.1.250:3899 bun run servermon.ts
```

5. Optional: Set up the systemd service (if AMD Linux):
   Create a new file named `servermon.service` in `/etc/systemd/system/` with the following content (edited to your needs):

   ```
   [Unit]
   Description=Server Monitor
   After=network.target

   [Service]
   ExecStart=/usr/bin/node /path/to/servermon/servermon.js
   Restart=always
   User=your_username
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

   Replace `/path/to/servermon` with the actual path to your Server⚡Monitor installation directory and `your_username` with the appropriate system username.

6. Enable and start the service:
   ```
   sudo systemctl enable servermon.service
   sudo systemctl start servermon.service
   ```

7. Open a web browser on your local network and navigate to your master server's local IP address:

```
http://192.168.1.250:3869
```

## Usage

Once the service is running, you can access the Infra⚡Mon dashboard by opening a web browser and navigating to:

```
http://your_server_ip:3869
```

Replace `your_server_ip` with the actual local network IP address of your master server.

## Configuration

Edit `lib/api.ts` to change the server's local IP address if having issues and run `bun run build` again.
