##@ Install

.PHONY: install lock outdated

install: ## Install all dependencies from package-lock.json (clean install)
	$(NPM) ci

lock: ## Regenerate package-lock.json without installing
	$(NPM) install --package-lock-only

outdated: ## List dependencies with newer versions available
	$(NPM) outdated || true
