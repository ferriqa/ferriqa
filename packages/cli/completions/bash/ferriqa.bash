# ferriqa bash completion

_ferriqa_completions() {
    local cur prev words cword
    _init_completion || return

    # Main commands
    local commands="init dev db blueprint plugin help version"
    
    # Plugin subcommands
    local plugin_commands="list add remove create market search"
    
    # DB subcommands
    local db_commands="migrate rollback seed"
    
    # Blueprint subcommands
    local blueprint_commands="list create delete export import"
    
    # Marketplace subcommands
    local market_commands="search featured tags"

    case "${prev}" in
        ferriqa)
            COMPREPLY=($(compgen -W "${commands}" -- "${cur}"))
            ;;
        init)
            COMPREPLY=($(compgen -W "--help --verbose" -- "${cur}"))
            ;;
        dev)
            COMPREPLY=($(compgen -W "--port --host --help --verbose" -- "${cur}"))
            ;;
        db)
            COMPREPLY=($(compgen -W "${db_commands}" -- "${cur}"))
            ;;
        migrate)
            COMPREPLY=($(compgen -W "--help" -- "${cur}"))
            ;;
        rollback)
            COMPREPLY=($(compgen -W "--steps --help" -- "${cur}"))
            ;;
        blueprint)
            COMPREPLY=($(compgen -W "${blueprint_commands}" -- "${cur}"))
            ;;
        plugin)
            COMPREPLY=($(compgen -W "${plugin_commands}" -- "${cur}"))
            ;;
        market|marketplace)
            COMPREPLY=($(compgen -W "${market_commands}" -- "${cur}"))
            ;;
        search)
            # No completion for search query
            ;;
        add|remove)
            # Suggest available plugins
            local plugins="seo localization analytics search backup webp-converter webhook-notifier"
            COMPREPLY=($(compgen -W "${plugins}" -- "${cur}"))
            ;;
        --config|-c)
            COMPREPLY=($(compgen -f -- "${cur}"))
            ;;
        --help|-h)
            ;;
        *)
            ;;
    esac
}

complete -F _ferriqa_completions ferriqa
