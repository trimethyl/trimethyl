#!/bin/sh

npm version patch && git push && git push --tags && npm publish && ./gendoc.sh
