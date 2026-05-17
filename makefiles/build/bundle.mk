##@ Build

.PHONY: build build-stats

build: ## Produce a production bundle in dist/ (runs tsc -b then vite build)
	$(NPM) run build

build-stats: build ## Build, then print per-asset sizes of the bundle
	@du -sh $(DIST)/assets/* 2>/dev/null || echo "no assets emitted"
