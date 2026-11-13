# Dashpack Zsh Plugin
# Loads completions dynamically from the dashpack binary

if (( $+commands[dashpack] )); then
    source <(dashpack completion zsh)
fi
