#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored status messages
print_status() {
    echo -e "${GREEN}[+]${NC} $1"
}

print_error() {
    echo -e "${RED}[!]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [[ "$(uname)" == "Linux" ]]; then
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi
fi

# Check system type
if [[ "$(uname)" == "Darwin" ]]; then
    OS_TYPE="macos"
elif [[ "$(uname)" == "Linux" ]]; then
    OS_TYPE="linux"
else
    print_error "Unsupported operating system"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."

# Install bun
if ! command -v bun &> /dev/null; then
    print_status "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi

# Clone repository
# print_status "Cloning Inframon repository..."
# git clone https://github.com/metaspartan/inframon.git
# cd inframon

# Install node dependencies
print_status "Installing dependencies..."
bun install

# Configuration setup
print_status "Configuration setup..."

# Ask if this is a master node
while true; do
    read -p "Is this a master node? (If this is your first node, it should be master) (y/n): " is_master
    case $is_master in
        [Yy]* ) 
            IS_MASTER=true
            break
            ;;
        [Nn]* ) 
            IS_MASTER=false
            if [[ $IS_MASTER == false ]]; then
                read -p "Enter master node local network URL on port 3899 (e.g., http://192.168.1.250:3899): " MASTER_URL
                if [[ -z "$MASTER_URL" ]]; then
                    print_error "Master URL cannot be empty for non-master nodes"
                    continue
                fi
            fi
            break
            ;;
        * ) echo "Please answer yes or no.";;
    esac
done

# Create .env file
print_status "Creating .env file..."
echo "IS_MASTER=$IS_MASTER" > .env
if [[ $IS_MASTER == false ]]; then
    echo "IS_MASTER=false" >> .env
    echo "MASTER_URL=$MASTER_URL" >> .env
fi

# Ensure if old install exists, unload it if darwin
if [[ "$(uname)" == "Darwin" ]]; then
    launchctl bootout system/com.inframon.service 2>/dev/null || true
    launchctl unload -w /Users/$SUDO_USER/Library/LaunchAgents/com.inframon.service.plist 2>/dev/null || true
fi

# Build the application
print_status "Building application..."
bun run build

if [[ $IS_MASTER == true ]]; then
    bun run compile
else
    bun run compile
fi

# Ask about systemd service installation
if [[ "$OS_TYPE" == "linux" ]]; then
    while true; do
        read -p "Do you want to install Inframon as a systemd service? *Linux Only* (y/n): " install_service
        case $install_service in
            [Yy]* )
                # Get current user
                CURRENT_USER=$SUDO_USER
                if [ -z "$CURRENT_USER" ]; then
                    CURRENT_USER=$(whoami)
                fi
                
                # Create systemd service file
                cat > /etc/systemd/system/inframon.service << EOF
[Unit]
Description=Inframon Server Monitor
After=network.target

[Service]
Environment=IS_MASTER=$IS_MASTER
EOF

                if [[ $IS_MASTER == false ]]; then
                    echo "Environment=MASTER_URL=$MASTER_URL" >> /etc/systemd/system/inframon.service
                fi

                cat >> /etc/systemd/system/inframon.service << EOF
ExecStart=/root/.bun/bin/bun run $(pwd)/inframon.ts
WorkingDirectory=$(pwd)
Restart=always
User=$CURRENT_USER
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

                # Enable and start service
                systemctl daemon-reload
                systemctl enable inframon.service
                systemctl start inframon.service
                
                print_status "Systemd service installed and started"
                break
                ;;
            [Nn]* ) 
                print_status "Skipping systemd service installation"
                break
                ;;
            * ) echo "Please answer yes or no.";;
        esac
    done
elif [[ "$OS_TYPE" == "macos" ]]; then
    while true; do
        read -p "Do you want to install Inframon as a system service? *macOS Only* (y/n): " install_service
        case $install_service in
            [Yy]* )
                # Get current user
                CURRENT_USER=$SUDO_USER
                if [ -z "$CURRENT_USER" ]; then
                    CURRENT_USER=$(whoami)
                fi
                
# Create LaunchDaemon plist file
PLIST_PATH="/Users/${CURRENT_USER}/Library/LaunchAgents/com.inframon.service.plist"
APP_DIR=$(pwd)
# Verify binary exists and is executable
BINARY_PATH="${APP_DIR}/inframon"
if [ ! -f "$BINARY_PATH" ]; then
    print_error "Compiled binary not found at $BINARY_PATH"
    exit 1
fi

if [ -f "$PLIST_PATH" ]; then
    print_status "Removing old plist file at $PLIST_PATH"
    rm "$PLIST_PATH"
fi

# Make binary executable
# sudo chmod +x "$BINARY_PATH"

# Create the plist file
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>EnvironmentVariables</key>
    <dict>
        <key>IS_MASTER</key>
        <string>${IS_MASTER}</string>
        <key>HOST</key>
        <string>0.0.0.0</string>
EOF

if [[ $IS_MASTER == false ]]; then
    cat >> "$PLIST_PATH" << EOF
        <key>MASTER_URL</key>
        <string>${MASTER_URL}</string>
EOF
fi

cat >> "$PLIST_PATH" << EOF
    </dict>
    <key>GroupName</key>
    <string>wheel</string>
    <key>KeepAlive</key>
    <true/>
    <key>Label</key>
    <string>com.inframon.service</string>
    <key>ProcessType</key>
    <string>Standard</string>
    <key>Program</key>
    <string>${BINARY_PATH}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>${APP_DIR}/inframon.stderr.log</string>
    <key>StandardOutPath</key>
    <string>${APP_DIR}/inframon.stdout.log</string>
    <key>UserName</key>
    <string>root</string>
    <key>WorkingDirectory</key>
    <string>${APP_DIR}</string>
</dict>
</plist>
EOF

# Set permissions and ownership
# sudo chown root:wheel "$PLIST_PATH"
# sudo chmod 644 "$PLIST_PATH"
# sudo chown root:wheel "$BINARY_PATH"
# sudo chmod 755 "$BINARY_PATH"

# launchctl limit maxfiles 2147483646 2147483646

# Unload and load the service
# sudo launchctl bootout system/com.inframon.service 2>/dev/null || true
# sudo launchctl bootstrap system "$PLIST_PATH"

print_status "Loading the service..."
# These must be ran WITHOUT sudo
launchctl load -w $PLIST_PATH
launchctl enable system/com.inframon.service
launchctl start com.inframon.service

# Verify the service status
print_status "Verifying service status..."

if sudo launchctl print system/com.inframon.service 2>/dev/null; then
    print_status "Service is loaded"
            if pgrep -f "inframon"; then
                print_status "Inframon launchd process is running!"
            else
                print_error "Process not running. Check logs at ${APP_DIR}/inframon.stderr.log"
            fi
                else
                    print_error "Service failed to load. Check logs at ${APP_DIR}/inframon.stderr.log"
                fi
                break
                ;;
            [Nn]* ) 
                print_status "Skipping service installation"
                break
                ;;
            * ) echo "Please answer yes or no.";;
        esac
    done
fi

# Function to get local IP based on OS
get_local_ip() {
    if [[ "$OS_TYPE" == "linux" ]]; then
        hostname -I | awk '{print $1}'
    elif [[ "$OS_TYPE" == "macos" ]]; then
        ipconfig getifaddr en0 || ipconfig getifaddr en1
    else
        echo "localhost"
    fi
}

# Print completion message
print_status "Installation complete!"
if [[ $IS_MASTER == true ]]; then
    LOCAL_IP=$(get_local_ip) # Get local IP address for linux or darwin
    print_status "Master node installed. Access the dashboard via browser at http://$LOCAL_IP:3869"
else
    print_status "Node installed and configured to connect to master at $MASTER_URL"
fi
if [[ "$(uname)" == "Linux" ]]; then
    print_warning "Note: If you installed the systemd service, the application is running in the background."
    print_warning "You can check the status with: sudo systemctl status inframon"
fi
if [[ "$(uname)" == "Darwin" ]]; then
    print_warning "Note: If you installed the launchd service, the application is running in the background."
    print_warning "You can check the status with: sudo launchctl print system/com.inframon.service"
fi