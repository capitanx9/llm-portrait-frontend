##@ Tests

.PHONY: test test-watch test-cov

test: ## Run the test suite once
	$(NPM) test

test-watch: ## Run vitest in watch mode for local development
	$(NPX) vitest

test-cov: ## Run tests with coverage report
	$(NPX) vitest run --coverage
