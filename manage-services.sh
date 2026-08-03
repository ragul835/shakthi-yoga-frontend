#!/bin/bash

set -euo pipefail

# Error trap
trap 'echo -e "[0;31m[ERROR] An error occurred on line $LINENO. Exiting...[0m" >&2 && exit 1' ERR

# Colors for better readability
RED='[0;31m'
GREEN='[0;32m'
YELLOW='[1;33m'
CYAN='[0;36m'
NC='[0m' # No Color

# Logging functions
log_info() { echo -e "${CYAN}[INFO] $1${NC}"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
log_error() { echo -e "${RED}[ERROR] $1${NC}" >&2; }
log_success() { echo -e "${GREEN}[SUCCESS] $1${NC}"; }

check_dependencies() {
    local missing=0
    for cmd in node npm npx pm2; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "$cmd could not be found. Please install it."
            missing=1
        fi
    done
    if [ $missing -eq 1 ]; then
        log_warn "Some dependencies are missing. Exiting."
        exit 1
    fi
}

ssh_connect() {
    local key="$SSH_KEY"
    # If the default key doesn't exist, prompt for a path
    if [ ! -f "$key" ]; then
        log_warn "SSH key not found at: $key"
        read -p "Enter path to your SSH private key (e.g. ~/Downloads/mykey.pem): " key
        key="${key/#\~/$HOME}"  # expand leading ~
        if [ ! -f "$key" ]; then
            log_error "Key file still not found: $key"
            return 1
        fi
    fi
    chmod 600 "$key" 2>/dev/null || true
    log_info "Connecting to ${SSH_USER}@${SSH_HOST} using key: $key"
    ssh -i "$key" -o StrictHostKeyChecking=accept-new "${SSH_USER}@${SSH_HOST}"
}


SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"
BACKEND_DIR="$SCRIPT_DIR/../shakthi-yoga-backend"
DB_NAME="zenyoga"
LOG_LINES="${LOG_LINES:-200}"
BACKEND_LOG="$BACKEND_DIR/backend.log"
FRONTEND_LOG="$FRONTEND_DIR/frontend.log"

if ! [[ "$LOG_LINES" =~ ^[1-9][0-9]*$ ]]; then
    log_warn "Invalid LOG_LINES value '$LOG_LINES'; using 200."
    LOG_LINES=200
fi

# SSH / Remote server config
SSH_USER="ubuntu"
SSH_HOST="13.211.124.201"
SSH_KEY="${SSH_KEY_PATH:-$HOME/.ssh/id_rsa}"

# Ensure backend .env exists
check_dependencies

if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
    log_warn "Backend .env not found. Creating from .env.example..."
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

if grep -q 'DATABASE_URL=""' "$BACKEND_DIR/.env" 2>/dev/null; then
    log_warn "Empty DATABASE_URL found in .env. Updating it with default local credentials..."
    sed -i 's|DATABASE_URL=""|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zenyoga?schema=public"|' "$BACKEND_DIR/.env"
fi
# Helper function to pause
pause() {
    echo ""
    read -p "Press Enter to continue..."
}

# Helper function to prompt for environment
prompt_env() {
    echo -e "\n${YELLOW}Select Environment:${NC}"
    echo "1) Development"
    echo "2) Staging"
    echo "3) Production"
    read -p "Enter choice [1-3]: " env_choice
    case $env_choice in
        1) ENV="development" ;;
        2) ENV="staging" ;;
        3) ENV="production" ;;
        *) echo -e "${RED}Invalid choice. Defaulting to development.${NC}"; ENV="development" ;;
    esac
    echo -e "Selected environment: ${GREEN}${ENV}${NC}\n"
}

build_services() {
    log_info "Building Backend..."
    cd "$BACKEND_DIR" || exit
    npm ci
    npm run build
    
    log_info "Building Frontend..."
    cd "$FRONTEND_DIR" || exit
    npm ci
    npm run build
}

stop_services_nohup() {
    local port
    local cleanup_failed=0

    log_info "Stopping non-PM2 services on ports 3000 and 3001..."
    for port in 3000 3001; do
        if ! fuser "$port/tcp" >/dev/null 2>&1; then
            continue
        fi

        log_warn "Port $port is occupied; stopping its current process..."
        fuser -k "$port/tcp" >/dev/null 2>&1 || true
        sleep 1

        if fuser "$port/tcp" >/dev/null 2>&1; then
            log_warn "Normal cleanup could not free port $port; elevated permission is required."
            sudo fuser -k "$port/tcp" || true
            sleep 1
        fi

        if fuser "$port/tcp" >/dev/null 2>&1; then
            log_error "Port $port is still occupied by:"
            sudo lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null ||
                lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
            cleanup_failed=1
        else
            log_success "Port $port is free."
        fi
    done

    if [ "$cleanup_failed" -ne 0 ]; then
        log_error "Unable to stop every old service. PM2 startup has been cancelled."
        return 1
    fi

    log_success "Ports 3000 and 3001 are ready."
}

clean_db() {
    if [ "${ENV:-}" = "production" ]; then
        log_warn "Skipping database clean in production environment for safety."
        return 0
    fi
    log_warn "Cleaning Database ($DB_NAME)..."
    cd "$BACKEND_DIR" || exit 1
    npx prisma migrate reset --force --skip-seed
}

setup_db() {
    log_info "Setting up Database ($DB_NAME)..."
    cd "$BACKEND_DIR" || exit
    npx prisma db push
}

migrate_db() {
    log_info "Migrating Database ($DB_NAME)..."
    cd "$BACKEND_DIR" || exit
    npx prisma migrate deploy
}

seed_db() {
    if [ "${ENV:-}" != "development" ]; then
        log_error "Database seeding is allowed only when Development is explicitly selected. Current environment: ${ENV:-unset}."
        return 1
    fi

    log_info "Seeding Database ($DB_NAME)..."
    cd "$BACKEND_DIR" || exit

    # Use committed migrations even in development. Seeding must never make
    # destructive schema changes or bypass migration history.
    log_info "Applying committed migrations before development seed..."
    NODE_ENV=development npx prisma migrate deploy || {
        log_error "Prisma migrations failed. Seed was not run."
        return 1
    }

    NODE_ENV=development npx prisma db seed
}


start_services_nohup() {
    log_info "Starting Backend (nohup)..."
    cd "$BACKEND_DIR" || exit
    printf '\n===== Backend start: %s =====\n' "$(date --iso-8601=seconds)" >> "$BACKEND_LOG"
    nohup npm run start:prod >> "$BACKEND_LOG" 2>&1 &
    local backend_pid=$!
    
    log_info "Starting Frontend (nohup)..."
    cd "$FRONTEND_DIR" || exit
    printf '\n===== Frontend start: %s =====\n' "$(date --iso-8601=seconds)" >> "$FRONTEND_LOG"
    nohup npm start >> "$FRONTEND_LOG" 2>&1 &
    local frontend_pid=$!

    sleep 2
    if ! kill -0 "$backend_pid" 2>/dev/null; then
        log_error "Backend exited during startup. Recent log output:"
        tail -n 50 "$BACKEND_LOG" >&2
        return 1
    fi
    if ! kill -0 "$frontend_pid" 2>/dev/null; then
        log_error "Frontend exited during startup. Recent log output:"
        tail -n 50 "$FRONTEND_LOG" >&2
        return 1
    fi
    
    log_success "Services started in background (backend PID $backend_pid, frontend PID $frontend_pid)."
}

start_services_pm2() {
    log_info "Preparing ports 3000 and 3001 for PM2..."
    stop_services_pm2
    stop_services_nohup

    if fuser 3000/tcp >/dev/null 2>&1 || fuser 3001/tcp >/dev/null 2>&1; then
        log_error "Ports 3000 or 3001 are still occupied. Refusing to start duplicate services."
        lsof -nP -iTCP:3000 -sTCP:LISTEN 2>/dev/null || true
        lsof -nP -iTCP:3001 -sTCP:LISTEN 2>/dev/null || true
        return 1
    fi

    log_info "Starting Backend (PM2)..."
    cd "$BACKEND_DIR" || exit
    pm2 start npm --name "zenyoga-backend" -- run start:prod
    
    log_info "Starting Frontend (PM2)..."
    cd "$FRONTEND_DIR" || exit
    pm2 start npm --name "zenyoga-frontend" -- run start

    sleep 2
    pm2 status
    if ! pm2 pid zenyoga-backend | grep -qE '^[1-9][0-9]*$' ||
       ! pm2 pid zenyoga-frontend | grep -qE '^[1-9][0-9]*$'; then
        log_error "One or more PM2 services failed to stay online. Recent errors:"
        pm2 logs --err --lines 50 --nostream || true
        return 1
    fi

    pm2 save
    log_success "PM2 services are online and the process list has been saved."
}

stop_services_pm2() {
    log_info "Stopping and removing PM2 services..."
    pm2 delete zenyoga-backend 2>/dev/null || true
    pm2 delete zenyoga-frontend 2>/dev/null || true
}

status_pm2() {
    pm2 status || true
}

tail_nohup_logs() {
    local log_file
    local -a log_files=()

    for log_file in "$BACKEND_LOG" "$FRONTEND_LOG"; do
        if [ -f "$log_file" ]; then
            log_files+=("$log_file")
        else
            log_warn "Log file does not exist yet: $log_file"
        fi
    done

    if [ "${#log_files[@]}" -eq 0 ]; then
        log_error "No nohup logs were found. Start the services with option 6, or use option 104 if they run under PM2."
        return 0
    fi

    log_info "Showing the last $LOG_LINES lines, then following new output. Press Ctrl+C to return."
    tail -n "$LOG_LINES" -F "${log_files[@]}" || true
}

tail_pm2_logs() {
    local pm2_home="${PM2_HOME:-$HOME/.pm2}"
    local pm2_log_dir="$pm2_home/logs"
    local pm2_processes
    local -a pm2_log_files=()

    log_info "PM2 process status for user $(id -un) (PM2_HOME=$pm2_home):"
    pm2 status || true

    pm2_processes="$(pm2 jlist 2>/dev/null || true)"
    if grep -q '"name"' <<< "$pm2_processes"; then
        log_info "Showing the last $LOG_LINES PM2 log lines."
        pm2 logs --lines "$LOG_LINES" --nostream --raw || true
        return 0
    fi

    log_warn "PM2 has no registered processes for user $(id -un). Checking retained PM2 log files..."
    if [ -d "$pm2_log_dir" ]; then
        while IFS= read -r -d '' log_file; do
            pm2_log_files+=("$log_file")
        done < <(find "$pm2_log_dir" -maxdepth 1 -type f -name '*.log' -print0)
    fi

    if [ "${#pm2_log_files[@]}" -gt 0 ]; then
        log_info "Showing retained logs from $pm2_log_dir. Press Ctrl+C to return."
        tail -n "$LOG_LINES" -F "${pm2_log_files[@]}" || true
    else
        log_error "No PM2 logs were found for this user. If PM2 was started with sudo or another user, run this script as that same user."
    fi
}

# Menu display function
show_menu() {
    clear
    echo -e "${CYAN}======================================================================${NC}"
    echo -e "${GREEN}                       Services Management Menu                        ${NC}"
    echo -e "${CYAN}======================================================================${NC}"
    
    echo -e "${YELLOW}Sec A: Local Environment Setup (application will run as a service):${NC}"
    echo "  1. Build Services (Clean and Install dependencies)"
    echo "  1a. Rebuild All (stop all envs → update deps → start)"
    echo "  2. Start PostgreSQL (System Service)"
    echo "  3. Clean Database (Select environment)"
    echo "  4. Setup Database (Select environment)"
    echo "  4a. Check Setup Status (Database tables verification)"
    echo "  5. Migrate Database (Select environment)"
    echo "  5a. Check Migration Status (Database migration history)"
    echo "  6. Start Services — nohup"
    echo "  6a. Quick nohup: Stop→Clean→Build→DropDB→SetupDB→Migrate→Start"
    echo "  6b. Quick nohup: Stop→Build→DropDB→SetupDB→Migrate→Start"
    echo "  6c. Quick nohup: Stop→Build→Migrate→Start"
    echo "  6d. Quick nohup: Stop→Build→Start (no DB ops)"
    echo "  7. Stop Services (nohup)"
    echo "  8. Service Status (nohup)"
    echo "  9. Start Services — PM2 (persistent, survives SSH disconnect)"
    echo "  9a. Quick PM2: Stop→Build→Migrate→Start"
    echo "  9b. Quick PM2: Stop→Build→Start (no DB ops)"
    echo "  9c. Quick PM2: Stop→Clean→Build→DropDB→SetupDB→Migrate→Start"
    echo "  9d. Quick PM2: Stop→Build→DropDB→SetupDB→Migrate→Start"
    echo " 10. Stop Services (PM2)"
    echo " 11. Service Status (PM2)"
    echo ""
    
    echo -e "${YELLOW}Sec E: Database & PostgreSQL Operations:${NC}"
    echo " 80. Start PostgreSQL (System Service)"
    echo " 81. Stop PostgreSQL (System Service)"
    echo " 82. Configure PostgreSQL Default Password (postgres:postgres)"
    echo " 84. Clean Database ($DB_NAME)"
    echo " 85. Setup Database ($DB_NAME)"
    echo " 86. Migrate Database ($DB_NAME)"
    echo " 87. Seed Database ($DB_NAME)"
    echo ""
    
    echo -e "${YELLOW}Sec F: System Monitoring & Health:${NC}"
    echo "100. Show Disk Space Usage"
    echo "101. Show RAM Usage (Services + PostgreSQL)"
    echo "102. Show Other Processes RAM Usage"
    echo "103. Tail Service Logs (nohup)"
    echo "104. Tail Service Logs (PM2)"
    echo ""
    
    echo -e "${YELLOW}Sec S: SSH & Remote Access:${NC}"
    echo "200. SSH into Remote Server (${SSH_USER}@${SSH_HOST})"
    echo "       Key: ${SSH_KEY}"
    echo "       (Set SSH_KEY_PATH env var to override)"
    echo ""

    echo -e "${RED}  0. Exit${NC}"
    echo -e "${CYAN}======================================================================${NC}"
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice: " choice
    
    echo ""
    case $choice in
        1)
            build_services
            pause
            ;;
        1a)
            echo "Rebuilding All..."
            stop_services_pm2
            stop_services_nohup
            build_services
            start_services_nohup
            pause
            ;;
        2|80)
            echo "Starting PostgreSQL (System Service)..."
            sudo systemctl start postgresql || true
            pause
            ;;
        3)
            prompt_env
            clean_db
            pause
            ;;
        4)
            prompt_env
            setup_db
            pause
            ;;
        4a)
            echo "Checking Setup Status (Database tables verification)..."
            cd "$BACKEND_DIR" || exit
            npx prisma studio
            pause
            ;;
        5)
            prompt_env
            migrate_db
            pause
            ;;
        5a)
            echo "Checking Migration Status..."
            cd "$BACKEND_DIR" || exit
            npx prisma migrate status
            pause
            ;;
        6)
            prompt_env
            stop_services_pm2
            start_services_nohup
            pause
            ;;
        6a)
            prompt_env
            stop_services_pm2
            stop_services_nohup
            clean_db
            build_services
            setup_db
            migrate_db
            seed_db
            start_services_nohup
            pause
            ;;
        6b)
            prompt_env
            stop_services_pm2
            stop_services_nohup
            build_services
            clean_db
            setup_db
            migrate_db
            seed_db
            start_services_nohup
            pause
            ;;
        6c)
            prompt_env
            stop_services_pm2
            stop_services_nohup
            build_services
            migrate_db
            start_services_nohup
            pause
            ;;
        6d)
            prompt_env
            stop_services_pm2
            stop_services_nohup
            build_services
            start_services_nohup
            pause
            ;;
        7)
            prompt_env
            stop_services_nohup
            pause
            ;;
        8)
            prompt_env
            echo "Service Status (Ports 3000 and 3001):"
            lsof -i :3000 || true
            lsof -i :3001 || true
            pause
            ;;
        9)
            start_services_pm2
            pause
            ;;
        9a)
            prompt_env
            stop_services_pm2
            stop_services_nohup
            build_services
            migrate_db
            start_services_pm2
            pause
            ;;
        9b)
            prompt_env
            stop_services_pm2
            stop_services_nohup
            build_services
            start_services_pm2
            pause
            ;;
        9c)
            prompt_env
            stop_services_pm2
            stop_services_nohup
            clean_db
            build_services
            setup_db
            migrate_db
            seed_db
            start_services_pm2
            pause
            ;;
        9d)
            prompt_env
            stop_services_pm2
            stop_services_nohup
            build_services
            clean_db
            setup_db
            migrate_db
            seed_db
            start_services_pm2
            pause
            ;;
        10)
            stop_services_pm2
            pause
            ;;
        11)
            status_pm2
            pause
            ;;
        81)
            echo "Stopping PostgreSQL (System Service)..."
            sudo systemctl stop postgresql || true
            pause
            ;;
        82)
            echo "Configuring PostgreSQL Default Password (postgres:postgres)..."
            sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" || true
            echo -e "${GREEN}Password updated. Prisma should now connect successfully.${NC}"
            pause
            ;;
        84)
            clean_db
            pause
            ;;
        85)
            setup_db
            pause
            ;;
        86)
            migrate_db
            pause
            ;;
        87)
            prompt_env
            seed_db
            pause
            ;;
        100)
            echo "Disk Space Usage:"
            df -h
            pause
            ;;
        101)
            echo "RAM Usage (PostgreSQL, Nginx, Node, Java, etc.):"
            free -h
            echo ""
            ps aux --sort=-%mem | head -n 10
            pause
            ;;
        102)
            echo "Other Processes RAM Usage:"
            top -b -o +%MEM -n 1 | head -n 20
            pause
            ;;
        103)
            echo "Tailing Service Logs (nohup)..."
            tail_nohup_logs
            pause
            ;;
        104)
            echo "Tailing PM2 Logs..."
            tail_pm2_logs
            pause
            ;;
        200)
            ssh_connect
            pause
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Please select a valid option.${NC}"
            pause
            ;;
    esac
done
