dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

lint:
	npm run lint

format:
	npx prettier --write .

test:
	npm test

install:
	npm install

clean:
	rm -rf dist node_modules
	@echo "Clean done."
