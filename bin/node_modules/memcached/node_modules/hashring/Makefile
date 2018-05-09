ALL_TESTS = $(shell find tests/ -name '*.test.js')
REPORTER = spec
UI = exports

run-tests:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter $(REPORTER) \
		--ui $(UI) \
		--growl \
		$(TESTS)

doc:
	dox --title "node-hashring" lib/* > doc/index.html

test:
	@$(MAKE) TESTS="$(ALL_TESTS)" run-tests

.PHONY: test doc
