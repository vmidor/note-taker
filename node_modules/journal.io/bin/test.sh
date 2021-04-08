#!/bin/sh

#
# Custom test script
#
echo "============================  Testing JOURNAL.io  ====================="
./node_modules/mocha/bin/mocha test/general-specs.js --exit
