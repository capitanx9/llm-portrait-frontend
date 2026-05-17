##@ OpenAPI codegen

.PHONY: gen-api gen-api-check

gen-api: ## Regenerate src/api/schema.ts from the backend openapi.yaml
	$(NPM) run gen-api

gen-api-check: ## Fail if the committed schema.ts is stale vs the backend openapi.yaml
	@tmp=$$(mktemp); \
		$(NPX) openapi-typescript https://raw.githubusercontent.com/capitanx9/llm-portrait/main/schemas/openapi.yaml --output $$tmp >/dev/null; \
		if ! diff -q $(SRC)/api/schema.ts $$tmp >/dev/null; then \
			echo "schema.ts is stale — run 'make gen-api' and commit"; \
			rm -f $$tmp; exit 1; \
		fi; \
		rm -f $$tmp; \
		echo "schema.ts is up to date"
