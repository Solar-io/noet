#!/bin/bash
# Convenience script that calls the moved version
source scripts/simple-config.sh
cd_project
exec scripts/dev/simple-noet.sh "$@"
