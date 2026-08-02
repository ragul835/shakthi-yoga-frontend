#!/bin/bash

set -o pipefail

# ============================================================
#  manage-repos.sh — Multi-Repository Management Tool
# ============================================================

# ── Colours ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ── Configuration ─────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPOS_FILE="$SCRIPT_DIR/repos.conf"
# Base directory where repos are cloned (parent of shakthi-yoga-frontend)
REPOS_BASE_DIR="$(dirname "$SCRIPT_DIR")"
DEFAULT_BRANCH="main"

# ── Helpers ───────────────────────────────────────────────────
banner() {
    clear
    echo -e "${CYAN}${BOLD}"
    echo "  ╔══════════════════════════════════════════════╗"
    echo "  ║        🗂  Multi-Repo Manager v1.0           ║"
    echo "  ╚══════════════════════════════════════════════╝"
    echo -e "${RESET}"
}

print_info()  { echo -e "${BLUE}[INFO]${RESET}  $*"; }
print_ok()    { echo -e "${GREEN}[OK]${RESET}    $*"; }
print_warn()  { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
print_error() { echo -e "${RED}[ERROR]${RESET} $*"; }
print_step()  { echo -e "${MAGENTA}  ──▶${RESET} $*"; }

divider() { echo -e "${DIM}  ────────────────────────────────────────────${RESET}"; }

pause() {
    echo ""
    read -rp "  Press [Enter] to return to menu…"
}

# ── Repos-file helpers ────────────────────────────────────────
# repos.conf format (one repo per line):
#   <local_dir>  <git_url>  [branch]
# Lines starting with # are comments; blank lines are ignored.

ensure_repos_file() {
    if [[ ! -f "$REPOS_FILE" ]]; then
        print_warn "No repos.conf found. Creating a sample at: $REPOS_FILE"
        cat > "$REPOS_FILE" <<'EOF'
# manage-repos configuration
# Format: <local_directory>  <git_clone_url>  [default_branch]
#
# Examples:
# my-frontend   https://github.com/yourorg/frontend.git   main
# my-backend    https://github.com/yourorg/backend.git    develop
# my-lib        git@github.com:yourorg/shared-lib.git     main
EOF
        print_info "Edit $REPOS_FILE and add your repositories, then re-run."
    fi
}

REPO_RECORDS=()

load_repos() {
    REPO_RECORDS=()
    while IFS= read -r line; do
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        REPO_RECORDS+=("$line")
    done < "$REPOS_FILE"

    if [[ ${#REPO_RECORDS[@]} -eq 0 ]]; then
        print_warn "repos.conf is empty or has no valid entries."
        return 1
    fi
    return 0
}

parse_record() {
    local record="$1"
    read -r R_DIR R_URL R_BRANCH extra <<< "$record"
    [[ -z "$R_BRANCH" ]] && R_BRANCH="$DEFAULT_BRANCH"

    if [[ -n "${extra:-}" || -z "$R_DIR" || -z "$R_URL" ]]; then
        print_error "Invalid repos.conf entry: $record"
        return 1
    fi
    if [[ "$R_DIR" == */* || "$R_DIR" == "." || "$R_DIR" == ".." ]]; then
        print_error "Repository directory must be a simple directory name: $R_DIR"
        return 1
    fi
    if ! git check-ref-format --branch "$R_BRANCH" >/dev/null 2>&1; then
        print_error "Invalid branch name in repos.conf: $R_BRANCH"
        return 1
    fi
    return 0
}

worktree_is_clean() {
    [[ -z "$(git status --porcelain --untracked-files=normal 2>/dev/null)" ]]
}

# ── Option 0 — Clone All ──────────────────────────────────────
clone_all() {
    banner
    echo -e "${BOLD}  [0] Clone All Repositories${RESET}"
    divider

    ensure_repos_file
    load_repos || { pause; return; }

    for record in "${REPO_RECORDS[@]}"; do
        parse_record "$record" || { divider; continue; }
        echo ""
        print_step "Repository : ${BOLD}$R_DIR${RESET}"
        print_step "URL        : $R_URL"
        print_step "Branch     : $R_BRANCH"

        if [[ -d "$REPOS_BASE_DIR/$R_DIR/.git" ]]; then
            print_warn "'$R_DIR' already exists and is a git repo — skipping clone."
        elif [[ -d "$REPOS_BASE_DIR/$R_DIR" && -n "$(ls -A "$REPOS_BASE_DIR/$R_DIR" 2>/dev/null)" ]]; then
            print_warn "'$R_DIR' exists and is not empty — skipping."
        else
            if git clone --branch "$R_BRANCH" "$R_URL" "$REPOS_BASE_DIR/$R_DIR" 2>&1; then
                print_ok "Cloned → $R_DIR"
            else
                print_error "Failed to clone $R_URL"
            fi
        fi
        divider
    done

    pause
}

# ── Option 1 — Sync (checkout + pull) ────────────────────────
sync_repos() {
    banner
    echo -e "${BOLD}  [1] Sync Repos (checkout + pull)${RESET}"
    divider

    ensure_repos_file
    load_repos || { pause; return; }

    for record in "${REPO_RECORDS[@]}"; do
        parse_record "$record" || { divider; continue; }
        echo ""
        print_step "${BOLD}$R_DIR${RESET}  (branch: $R_BRANCH)"

        if [[ ! -d "$REPOS_BASE_DIR/$R_DIR/.git" ]]; then
            print_warn "'$R_DIR' is not a git repo — skipping. (Run option 0 first.)"
            divider; continue
        fi

        pushd "$REPOS_BASE_DIR/$R_DIR" > /dev/null || continue

        if ! worktree_is_clean; then
            print_warn "Working tree has uncommitted changes — skipping sync. Commit or stash them first."
            popd > /dev/null
            divider
            continue
        fi

        current=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        if [[ "$current" != "$R_BRANCH" ]]; then
            print_info "Switching $current → $R_BRANCH"
            git switch "$R_BRANCH" 2>&1 || { print_error "Switch failed"; popd > /dev/null; divider; continue; }
        else
            print_info "Already on $R_BRANCH"
        fi

        print_info "Pulling latest…"
        git pull --ff-only origin "$R_BRANCH" 2>&1 && print_ok "Up to date." || print_error "Fast-forward pull failed."

        popd > /dev/null
        divider
    done

    pause
}

# ── Option 2 — Checkout Branches (no pull) ───────────────────
checkout_branches() {
    banner
    echo -e "${BOLD}  [2] Checkout Branches (no pull)${RESET}"
    divider

    ensure_repos_file
    load_repos || { pause; return; }

    for record in "${REPO_RECORDS[@]}"; do
        parse_record "$record" || { divider; continue; }
        echo ""
        print_step "${BOLD}$R_DIR${RESET}  → $R_BRANCH"

        if [[ ! -d "$REPOS_BASE_DIR/$R_DIR/.git" ]]; then
            print_warn "'$R_DIR' is not a git repo — skipping."
            divider; continue
        fi

        pushd "$REPOS_BASE_DIR/$R_DIR" > /dev/null || continue
        if ! worktree_is_clean; then
            print_warn "Working tree has uncommitted changes — skipping branch switch."
            popd > /dev/null
            divider
            continue
        fi
        current=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

        if [[ "$current" == "$R_BRANCH" ]]; then
            print_info "Already on '$R_BRANCH'."
        else
            git switch "$R_BRANCH" 2>&1 && print_ok "Switched to $R_BRANCH" || print_error "Switch failed."
        fi

        popd > /dev/null
        divider
    done

    pause
}

# ── Option 3 — Pull Changes ───────────────────────────────────
pull_changes() {
    banner
    echo -e "${BOLD}  [3] Pull Changes${RESET}"
    divider

    ensure_repos_file
    load_repos || { pause; return; }

    for record in "${REPO_RECORDS[@]}"; do
        parse_record "$record" || { divider; continue; }
        echo ""
        print_step "${BOLD}$R_DIR${RESET}"

        if [[ ! -d "$REPOS_BASE_DIR/$R_DIR/.git" ]]; then
            print_warn "'$R_DIR' is not a git repo — skipping."
            divider; continue
        fi

        pushd "$REPOS_BASE_DIR/$R_DIR" > /dev/null || continue
        if ! worktree_is_clean; then
            print_warn "Working tree has uncommitted changes — skipping pull. Commit or stash them first."
            popd > /dev/null
            divider
            continue
        fi
        current=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        if [[ -z "$current" || "$current" == "HEAD" ]]; then
            print_error "Repository is in detached HEAD state — skipping pull."
            popd > /dev/null
            divider
            continue
        fi
        print_info "Current branch: $current"
        git pull --ff-only origin "$current" 2>&1 && print_ok "Pulled successfully." || print_error "Fast-forward pull failed."
        popd > /dev/null
        divider
    done

    pause
}

# ── Option 4 — Show Status ────────────────────────────────────
show_status() {
    banner
    echo -e "${BOLD}  [4] Show Status${RESET}"
    divider

    ensure_repos_file
    load_repos || { pause; return; }

    for record in "${REPO_RECORDS[@]}"; do
        parse_record "$record" || { divider; continue; }
        echo ""
        echo -e "  ${BOLD}${CYAN}$R_DIR${RESET}"

        if [[ ! -d "$REPOS_BASE_DIR/$R_DIR/.git" ]]; then
            print_warn "Not a git repository."
            divider; continue
        fi

        pushd "$REPOS_BASE_DIR/$R_DIR" > /dev/null || continue

        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        commit=$(git log -1 --format="%h  %s  (%cr)" 2>/dev/null)
        ahead_behind=$(git rev-list --left-right --count "origin/$branch...HEAD" 2>/dev/null || echo "0 0")
        ahead=$(echo "$ahead_behind" | awk '{print $2}')
        behind=$(echo "$ahead_behind" | awk '{print $1}')

        echo -e "  Branch  : ${GREEN}$branch${RESET}"
        echo -e "  Commit  : ${DIM}$commit${RESET}"
        echo -e "  Ahead   : ${YELLOW}$ahead${RESET}  Behind: ${RED}$behind${RESET}"

        untracked=$(git status --porcelain 2>/dev/null | grep -c '^??' || true)
        modified=$(git status --porcelain 2>/dev/null | grep -c '^ M\|^M ' || true)
        staged=$(git status --porcelain 2>/dev/null | grep -c '^[MADRC]' || true)

        echo -e "  Changes : modified=${YELLOW}$modified${RESET}  staged=${GREEN}$staged${RESET}  untracked=${DIM}$untracked${RESET}"

        popd > /dev/null
        divider
    done

    pause
}

# ── Option 5 — Create New Branch ─────────────────────────────
create_branch() {
    banner
    echo -e "${BOLD}  [5] Create New Branch${RESET}"
    divider

    ensure_repos_file
    load_repos || { pause; return; }

    echo ""
    read -rp "  New branch name: " NEW_BRANCH
    if [[ -z "$NEW_BRANCH" ]]; then
        print_error "Branch name cannot be empty."
        pause; return
    fi
    if ! git check-ref-format --branch "$NEW_BRANCH" >/dev/null 2>&1; then
        print_error "Invalid Git branch name: $NEW_BRANCH"
        pause; return
    fi

    echo ""
    echo "  Apply to:"
    echo "    a) All repositories"
    echo "    s) Select repositories individually"
    read -rp "  Choice [a/s]: " APPLY_CHOICE

    for record in "${REPO_RECORDS[@]}"; do
        parse_record "$record" || { divider; continue; }
        echo ""
        print_step "${BOLD}$R_DIR${RESET}"

        if [[ ! -d "$REPOS_BASE_DIR/$R_DIR/.git" ]]; then
            print_warn "Not a git repo — skipping."
            divider; continue
        fi

        if [[ "$APPLY_CHOICE" == "s" ]]; then
            read -rp "  Create '$NEW_BRANCH' in '$R_DIR'? [y/N]: " yn
            [[ "$yn" != "y" && "$yn" != "Y" ]] && { print_info "Skipped."; divider; continue; }
        fi

        pushd "$REPOS_BASE_DIR/$R_DIR" > /dev/null || continue

        if ! worktree_is_clean; then
            print_warn "Working tree has uncommitted changes — skipping branch creation."
            popd > /dev/null
            divider
            continue
        fi

        if git show-ref --verify --quiet "refs/heads/$NEW_BRANCH"; then
            print_warn "Branch '$NEW_BRANCH' already exists. Checking out…"
            git switch "$NEW_BRANCH" 2>&1
        else
            git switch -c "$NEW_BRANCH" 2>&1 && print_ok "Created & switched to '$NEW_BRANCH'." || print_error "Failed to create branch."
        fi

        popd > /dev/null
        divider
    done

    pause
}

# ── Option 6 — Show Repositories List ────────────────────────
show_repos_list() {
    banner
    echo -e "${BOLD}  [6] Repositories List${RESET}"
    divider

    ensure_repos_file
    load_repos || { pause; return; }

    printf "\n  ${BOLD}%-4s  %-25s  %-12s  %-s${RESET}\n" "#" "Directory" "Branch" "URL"
    divider

    idx=1
    for record in "${REPO_RECORDS[@]}"; do
        parse_record "$record" || { divider; continue; }

        if [[ -d "$REPOS_BASE_DIR/$R_DIR/.git" ]]; then
            status_icon="${GREEN}✔${RESET}"
        else
            status_icon="${RED}✘${RESET}"
        fi

        printf "  %b %-3s  %-25s  %-12s  %s\n" \
            "$status_icon" "$idx" "$R_DIR" "$R_BRANCH" "$R_URL"
        ((idx++))
    done

    echo ""
    echo -e "  ${GREEN}✔${RESET} = cloned   ${RED}✘${RESET} = not yet cloned"
    pause
}

# ── Main Menu ─────────────────────────────────────────────────
main_menu() {
    while true; do
        banner
        echo -e "  ${BOLD}Choose an option:${RESET}"
        echo ""
        echo -e "  ${CYAN}0.${RESET} Clone All Repositories ${DIM}(first-time setup)${RESET}"
        echo -e "  ${CYAN}1.${RESET} Sync Repos ${DIM}(checkout + pull)${RESET}"
        echo -e "  ${CYAN}2.${RESET} Checkout Branches ${DIM}(no pull)${RESET}"
        echo -e "  ${CYAN}3.${RESET} Pull Changes"
        echo -e "  ${CYAN}4.${RESET} Show Status"
        echo -e "  ${CYAN}5.${RESET} Create New Branch"
        echo -e "  ${CYAN}6.${RESET} Show Repositories List"
        echo -e "  ${RED}7.${RESET} Exit"
        echo ""
        divider
        read -rp "  Enter your choice (0-7): " CHOICE
        divider

        case "$CHOICE" in
            0) clone_all ;;
            1) sync_repos ;;
            2) checkout_branches ;;
            3) pull_changes ;;
            4) show_status ;;
            5) create_branch ;;
            6) show_repos_list ;;
            7)
                echo ""
                print_ok "Goodbye! 👋"
                echo ""
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please enter a number between 0 and 7."
                sleep 1
                ;;
        esac
    done
}

# ── Entry Point ───────────────────────────────────────────────
ensure_repos_file
main_menu
