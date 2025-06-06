#!/bin/bash
set -eu

BUILD_SECRET_1="I AM BUILD_SECRET #1"
BUILD_SECRET_2="I AM BUILD_SECRET #2"

# build does not support --env-file and for meta-core itself the build is already
# inside a container that consumed the env-file. we need to collect everything back
# into --env args for this to work
podman build -t exit-code-example .

podman run --rm exit-code-example || EXIT_CODE=$?
[[ "$EXIT_CODE" -eq 11 ]]
