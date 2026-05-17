##@ Cleanup

.PHONY: clean clean-deps

clean: ## Remove build output, vite cache, and test coverage
	rm -rf $(DIST) node_modules/.vite $(COV_DIR)
	@echo "clean done."

clean-deps: ## Destructive: also remove node_modules (will require 'make install' after)
	@echo "About to delete node_modules/ — Ctrl+C to abort."
	@sleep 3
	rm -rf node_modules
	@echo "node_modules removed. Run 'make install' to reinstall."
