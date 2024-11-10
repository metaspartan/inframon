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
    print_error "Please run as root (use sudo)"
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
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi

# Clone repository
print_status "Cloning Inframon repository..."
git clone https://github.com/metaspartan/servermon.git
cd servermon

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
ExecStart=/root/.bun/bin/bun run $(pwd)/servermon.ts
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

print_warning "Note: If you installed the systemd service, the application is running in the background."
print_warning "You can check the status with: sudo systemctl status inframon"