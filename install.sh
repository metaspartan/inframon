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
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run install.sh with (use sudo), You must be logged in as the user you want to run the service as."
    exit 1
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
    if [ -n "$SUDO_USER" ]; then
        # Install Bun as the actual user, not root
        sudo -u "$SUDO_USER" bash -c 'curl -fsSL https://bun.sh/install | bash'
        
        # Add Bun to the current session's PATH
        if [[ "$OS_TYPE" == "macos" ]]; then
            export BUN_INSTALL="$HOME/.bun"
            export PATH="$BUN_INSTALL/bin:$PATH"
        fi
        if [[ "$OS_TYPE" == "linux" ]]; then
            export BUN_INSTALL="/home/$SUDO_USER/.bun"
            export PATH="$BUN_INSTALL/bin:$PATH"
            # Source the user's bashrc
            sudo -u "$SUDO_USER" bash -c 'source ~/.bashrc'
        fi
    else
        curl -fsSL https://bun.sh/install | bash
    fi
fi

# Clone repository
print_status "Cloning Inframon repository..."
if [ -n "$SUDO_USER" ]; then
    if [[ "$OS_TYPE" == "linux" ]]; then
        sudo systemctl stop inframon
    fi
    sudo rm -rf inframon
    # Clone as the actual user instead of root
    sudo -u "$SUDO_USER" git clone https://github.com/metaspartan/inframon.git
    cd inframon
    # Set correct ownership for the entire directory
    sudo chown -R "$SUDO_USER":"$(id -gn $SUDO_USER)" .
# else
#     git clone https://github.com/metaspartan/inframon.git
#     cd inframon
fi

# Install node dependencies
print_status "Installing dependencies..."
bun install

# Configuration setup
print_status "Configuration setup..."

# Ask if this is a master node
read -p "Is this a master node? (If this is your first node, it should be master) (y/n): " is_master
while [[ ! $is_master =~ ^[YyNn]$ ]]; do
    read -p "Please answer y or n: " is_master
done

if [[ $is_master =~ ^[Yy]$ ]]; then
    IS_MASTER=true
else
    IS_MASTER=false
fi

# Create .env file
print_status "Creating .env file..."
echo "IS_MASTER=$IS_MASTER" > .env
if [[ $IS_MASTER == false ]]; then
    echo "IS_MASTER=false" >> .env
    echo "MASTER_URL=$MASTER_URL" >> .env
fi

# print_status "Ensuring auto master node discovery is allowed through firewall..."
# if [[ "$(uname)" == "Linux" ]]; then
#     sudo ufw allow 3898/tcp
#     sudo ufw allow 3899/tcp
# elif [[ "$(uname)" == "Darwin" ]]; then
#     sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add $(which bun)
#     sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock $(which bun)
# fi

# Build the application
print_status "Building application..."

if [[ $IS_MASTER == true ]]; then
    bun run build
    bun run compile
else
    bun run compile
fi

# Ensure if old install exists, unload it if darwin
if [[ "$(uname)" == "Darwin" ]]; then
    if [[ -f /Users/$SUDO_USER/Library/LaunchAgents/com.inframon.service.plist ]]; then
        print_status "Removing old launchd service..."
        sudo -u "$SUDO_USER" launchctl bootout system/com.inframon.service 2>/dev/null || true
        sudo -u "$SUDO_USER" launchctl unload -w /Users/$SUDO_USER/Library/LaunchAgents/com.inframon.service.plist 2>/dev/null || true
    fi

    APP_DIR=$(pwd)
    # After compilation, add rules for the inframon binary
    if [ -f "${APP_DIR}/inframon" ]; then
        sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add "${APP_DIR}/inframon"
        sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock "${APP_DIR}/inframon"
    fi
fi

# Find nvidia-smi path as the non-root user
if [[ "$OS_TYPE" == "linux" ]]; then
    print_status "Checking for NVIDIA GPU..."
    NVIDIA_SMI_PATH=$(sudo -u "$SUDO_USER" which nvidia-smi)
    
    if [ ! -z "$NVIDIA_SMI_PATH" ]; then
        print_status "Found nvidia-smi at: $NVIDIA_SMI_PATH"
        # Add to service environment
        echo "NVIDIA_SMI_PATH=$NVIDIA_SMI_PATH" >> .env
        
        # Add sudoers entry for the specific path
        echo "%sudo ALL=(ALL) NOPASSWD: $NVIDIA_SMI_PATH" | sudo tee /etc/sudoers.d/nvidia-smi
        sudo chmod 440 /etc/sudoers.d/nvidia-smi
        sudo visudo -c
    else
        print_status "nvidia-smi not found under sudo, GPU monitoring may be limited, try syslink your 'which nvidia-smi' path to /usr/local/bin/nvidia-smi"
    fi
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

                USER_HOME=$(eval echo ~$CURRENT_USER)
                
                # Use the user's Bun installation
                BUN_PATH="$USER_HOME/.bun/bin/bun"
                if [ ! -x "$BUN_PATH" ]; then
                    print_error "Could not find bun executable at $BUN_PATH"
                    exit 1
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
ExecStart=${BUN_PATH} run $(pwd)/inframon.ts
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
                systemctl stop inframon.service
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
PLIST_DIR="/Users/${CURRENT_USER}/Library/LaunchAgents"
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

# After compilation, add rules for the inframon binary
if [ -f "${APP_DIR}/inframon" ]; then
    sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add "${APP_DIR}/inframon"
    sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock "${APP_DIR}/inframon"
fi

# Make binary executable
# sudo chmod +x "$BINARY_PATH"

CURRENT_UID=$(id -u)
USER_UID=$(id -u "$SUDO_USER")

# Output the UID (optional)
echo "The current user's UID is: $CURRENT_UID"
echo "The target user's UID is: $USER_UID"

# Create the plist file (needs sudo)
# sudo -u "$SUDO_USER" mkdir -p "$PLIST_DIR"

# Create directories and set permissions
if [ -n "$SUDO_USER" ]; then
    # Create app directory if it doesn't exist
    # sudo mkdir -p "${APP_DIR}"
    # sudo chown -R "$SUDO_USER":"$(id -gn $SUDO_USER)" "${APP_DIR}"
    # sudo chmod 755 "${APP_DIR}"

    # Create log files with correct ownership
    sudo -u "$SUDO_USER" touch "${APP_DIR}/inframon.stdout.log"
    sudo -u "$SUDO_USER" touch "${APP_DIR}/inframon.stderr.log"
    sudo chown "$SUDO_USER":"$(id -gn $SUDO_USER)" "${APP_DIR}/inframon.stdout.log"
    sudo chown "$SUDO_USER":"$(id -gn $SUDO_USER)" "${APP_DIR}/inframon.stderr.log"
    sudo chmod 644 "${APP_DIR}/inframon.stdout.log"
    sudo chmod 644 "${APP_DIR}/inframon.stderr.log"

    # Create LaunchAgents directory if it doesn't exist
    sudo -u "$SUDO_USER" mkdir -p "$PLIST_DIR"
    # sudo chown "$SUDO_USER":"$(id -gn $SUDO_USER)" "$PLIST_DIR"
fi

# Add sudoers entry for powermetrics on macOS
if [[ "$OS_TYPE" == "macos" ]]; then
    print_status "Configuring powermetrics permissions..."
    
    # Remove any existing powermetrics sudoers file
    sudo rm -f /etc/sudoers.d/powermetrics
    sudo rm -f /etc/sudoers.d/inframon

    # Create a new sudoers file for inframon
    echo "%admin ALL=(ALL) NOPASSWD: /usr/bin/powermetrics, /usr/sbin/scutil" | sudo tee /etc/sudoers.d/inframon
    
    # Set correct permissions
    sudo chmod 440 /etc/sudoers.d/inframon
    
    # Validate sudoers file
    sudo visudo -c
    
    # if [ $? -ne 0 ]; then
    #     print_error "Failed to configure powermetrics permissions"
    #     sudo rm /etc/sudoers.d/inframon
    #     exit 1
    # fi
fi

# Create the plist file as the target user
sudo -u "$SUDO_USER" tee "$PLIST_PATH" > /dev/null << EOF
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


sudo launchctl limit maxfiles 2147483646 2147483646

print_status "Loading the service..."

# Load the LaunchAgent
sudo -u "$SUDO_USER" launchctl unload -w "$PLIST_PATH"

sudo -u "$SUDO_USER" launchctl load -w "$PLIST_PATH"

sudo -u "$SUDO_USER" launchctl enable gui/$USER_UID/com.inframon.service

sudo -u "$SUDO_USER" launchctl start gui/$USER_UID/com.inframon.service

# Check the status of the service
sudo -u "$SUDO_USER" launchctl list | grep com.inframon.service


# Verify the service status
print_status "Verifying service status..."

if sudo launchctl print gui/$USER_UID/com.inframon.service 2>/dev/null; then
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
    print_warning "You can check the status with: sudo launchctl print gui/$USER_UID/com.inframon.service"
fi