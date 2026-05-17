##@ Dev server

.PHONY: dev preview

dev: ## Start the Vite dev server with HMR on :5173 (proxies /api and /ws to :8000)
	$(NPM) run dev

preview: ## Serve the production build locally for smoke-testing
	$(NPM) run preview
