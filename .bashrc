# -------- basic env --------
export EDITOR=nano
export PAGER=less
export PATH="$HOME/bin:$PATH"
shopt -s histappend      # append to history, don’t overwrite
HISTCONTROL=ignoredups   # ignore duplicates in history
HISTSIZE=5000
HISTFILESIZE=10000

# -------- colors & prompt --------
# colors
RED="\[\033[0;31m\]"
GREEN="\[\033[0;32m\]"
YELLOW="\[\033[0;33m\]"
BLUE="\[\033[0;34m\]"
MAGENTA="\[\033[0;35m\]"
CYAN="\[\033[0;36m\]"
RESET="\[\033[0m\]"

# prompt: user@host:cwd $
PS1="${GREEN}\u${RESET}@${BLUE}\h${RESET}:${YELLOW}\w${RESET}$ "

# -------- aliases --------
alias ll='ls -lh --color=auto'
alias la='ls -lha --color=auto'
alias l='ls -CF --color=auto'
alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'
alias update='sudo pacman -Syu'

# -------- git shortcuts --------
alias gst='git status'
alias gco='git checkout'
alias gbr='git branch'
alias glg='git log --oneline --graph --decorate --all'
alias gaa='git add .'
alias gcm='git commit -m'

# -------- custom functions --------
mkcd() {
  mkdir -p "$1" && cd "$1"
}

extract() {
  if [ -f "$1" ]; then
    case "$1" in
      *.tar.bz2)   tar xjf "$1"    ;;
      *.tar.gz)    tar xzf "$1"    ;;
      *.tar.xz)    tar xJf "$1"    ;;
      *.bz2)       bunzip2 "$1"    ;;
      *.rar)       unrar x "$1"    ;;
      *.gz)        gunzip "$1"     ;;
      *.tar)       tar xf "$1"     ;;
      *.zip)       unzip "$1"      ;;
      *.7z)        7z x "$1"       ;;
      *)           echo "don't know how to extract '$1'" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}

# -------- completion & extras --------
if [ -f /etc/bash_completion ]; then
  . /etc/bash_completion
fi

# -------- custom greeting --------
echo -e "${CYAN}welcome back zmac, ready to roll${RESET}"
