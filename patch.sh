#!/bin/sh

npm run test
if [ $? -eq 0 ]; then
	npm version patch &&
	npm publish &&
	git push &&
	git push --tags;
	./gen-doc.sh
fi
