# ferriqa fish shell completion

complete -c ferriqa -f

# Main commands
complete -c ferriqa -n "__fish_use_subcommand" -a init -d "Create a new Ferriqa project"
complete -c ferriqa -n "__fish_use_subcommand" -a dev -d "Start development server"
complete -c ferriqa -n "__fish_use_subcommand" -a db -d "Database operations"
complete -c ferriqa -n "__fish_use_subcommand" -a blueprint -d "Blueprint management"
complete -c ferriqa -n "__fish_use_subcommand" -a plugin -d "Plugin management"
complete -c ferriqa -n "__fish_use_subcommand" -a help -d "Show help"
complete -c ferriqa -n "__fish_use_subcommand" -a version -d "Show version"

# Global options
complete -c ferriqa -s h -l help -d "Show help"
complete -c ferriqa -s v -l verbose -d "Enable verbose logging"
complete -c ferriqa -s V -l version -d "Show version"
complete -c ferriqa -s c -l config -d "Config file path" -r

# dev options
complete -c ferriqa -n "__fish_seen_subcommand_from dev" -l port -d "Server port" -r
complete -c ferriqa -n "__fish_seen_subcommand_from dev" -l host -d "Server host" -r

# db subcommands
complete -c ferriqa -n "__fish_seen_subcommand_from db" -a migrate -d "Run migrations"
complete -c ferriqa -n "__fish_seen_subcommand_from db" -a rollback -d "Rollback migrations"
complete -c ferriqa -n "__fish_seen_subcommand_from db" -a seed -d "Seed database"

# blueprint subcommands
complete -c ferriqa -n "__fish_seen_subcommand_from blueprint" -a list -d "List blueprints"
complete -c ferriqa -n "__fish_seen_subcommand_from blueprint" -a create -d "Create blueprint"
complete -c ferriqa -n "__fish_seen_subcommand_from blueprint" -a delete -d "Delete blueprint"
complete -c ferriqa -n "__fish_seen_subcommand_from blueprint" -a export -d "Export blueprints"
complete -c ferriqa -n "__fish_seen_subcommand_from blueprint" -a import -d "Import blueprints"

# plugin subcommands
complete -c ferriqa -n "__fish_seen_subcommand_from plugin" -a list -d "List installed plugins"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin" -a add -d "Install a plugin"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin" -a remove -d "Uninstall a plugin"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin" -a create -d "Create custom plugin"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin" -a market -d "Browse marketplace"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin" -a search -d "Search plugins"

# plugin add/remove suggestions
complete -c ferriqa -n "__fish_seen_subcommand_from plugin; and __fish_seen_subcommand_from add remove" -a seo -d "SEO optimization"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin; and __fish_seen_subcommand_from add remove" -a localization -d "Multi-language support"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin; and __fish_seen_subcommand_from add remove" -a analytics -d "Analytics tracking"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin; and __fish_seen_subcommand_from add remove" -a search -d "Full-text search"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin; and __fish_seen_subcommand_from add remove" -a backup -d "Backup automation"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin; and __fish_seen_subcommand_from add remove" -a webp-converter -d "Image optimization"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin; and __fish_seen_subcommand_from add remove" -a webhook-notifier -d "Webhook notifications"

# market subcommands
complete -c ferriqa -n "__fish_seen_subcommand_from plugin; and __fish_seen_subcommand_from market" -a search -d "Search marketplace"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin; and __fish_seen_subcommand_from market" -a featured -d "Show featured plugins"
complete -c ferriqa -n "__fish_seen_subcommand_from plugin; and __fish_seen_subcommand_from market" -a tags -d "List available tags"
