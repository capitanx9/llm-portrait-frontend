##@ Lint & format

.PHONY: lint format typecheck

lint: ## Run ESLint on the codebase
	$(NPM) run lint

format: ## Format with Prettier and auto-fix ESLint where possible
	$(NPX) prettier --write .
	$(NPX) eslint . --fix

typecheck: ## Run the TypeScript compiler in noEmit mode
	$(NPX) tsc -b --noEmit
