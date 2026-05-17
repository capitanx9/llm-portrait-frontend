.DEFAULT_GOAL := help

include makefiles/vars.mk
include makefiles/help.mk
include makefiles/install/deps.mk
include makefiles/quality/lint.mk
include makefiles/quality/test.mk
include makefiles/dev/server.mk
include makefiles/build/bundle.mk
include makefiles/tooling/openapi.mk
include makefiles/clean.mk
